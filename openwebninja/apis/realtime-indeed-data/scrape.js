#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'realtime-indeed-data';

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search Indeed jobs, get full job details, and pull a company's employee reviews.

Required (varies by endpoint):
  --query             Job search query (for /search)
  --job-id            Comma-separated job ids, up to 20 (for /job-details)
  --company           Indeed /cmp slug, /cmp URL, or company name (for /company-reviews).
                      A job's job_indeed_company_page_url works directly.

Optional:
  --endpoint          Endpoint: /search (default), /job-details, /company-reviews
  --count             Max results to fetch (default: 50 jobs, 40 reviews)
  --format            json | csv (default: json)
  --output            Output file path (auto-generated if omitted)
  --page              Start page (default: 1). /search: 1-50, 10 jobs/page. /company-reviews: 1-100, 20 reviews/page
  --num-pages         Pages fetched per call (default: 1). /search: 1-50. /company-reviews: 1-10

/search filters:
  --location          Location in Indeed's format, e.g. "New York, NY"
  --country           Market code (default: us), e.g. gb, de, ca, in, au
  --language          ISO 639-1 language (defaults to the country's language)
  --date-posted       all | today | 3days | week | month
  --employment-types  Comma-separated: FULLTIME, CONTRACTOR, PARTTIME, INTERN
  --experience-level  Comma-separated: ENTRY_LEVEL, MID_LEVEL, SENIOR_LEVEL, NO_EXPERIENCE
  --work-from-home    Only jobs Indeed tags as Remote (alias: --remote)
  --min-salary        Minimum annual salary (excludes jobs with no stated salary)
  --max-salary        Maximum annual salary
  --radius            Radius in km around --location (requires --location)
  --exclude-job-publishers  Comma-separated publishers to drop
  --fields            Comma-separated job fields to return (also /job-details)

/company-reviews filters:
  --sort              relevance (default) | helpfulness | rating_desc | rating_asc
  --country           2-letter review country, or ALL for every country
  --location          Location within --country, e.g. "Coopersburg, PA" (requires 2-letter --country)
  --topic             wlbalance | paybenefits | jobsecadv | mgmt | culture
  --job-title         Only reviews by people with this job title
  --text              Full-text search within reviews

Common:
  --dry-run           Fetch one page only, print to console
  --delay             Delay between calls in ms (default: 300)
  --max-calls         Safety cap on API calls (default: 20)
  --help              Show this help
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--work-from-home' || arg === '--remote') { args.workFromHome = true; continue; }
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'real-time-indeed-data.p.rapidapi.com';
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const maxCalls = parseInt(args.maxCalls, 10) || 20;
    const delay = parseInt(args.delay, 10) || 300;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `${API_ID}_${ts}.${format}`);

    let totalCalls = 0;
    function call(endpointPath, params) {
        totalCalls++;
        if (totalCalls > maxCalls) throw new Error(`Cost cap exceeded: ${totalCalls} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
        return apiCall(host, endpointPath, params, apiKey, 'GET', null, API_ID);
    }

    // ── Job Details (single call, up to 20 ids) ──────────────────────────────
    if (endpoint === '/job-details') {
        if (!args.jobId) { console.error('Error: --job-id required for /job-details (comma-separated, up to 20)'); process.exit(1); }
        const params = { job_id: args.jobId };
        if (args.country) params.country = args.country;
        if (args.language) params.language = args.language;
        if (args.fields) params.fields = args.fields;
        const data = await call('/job-details', params);
        const records = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
        console.error(`${records.length} job(s) resolved in 1 call.`);
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint: '/job-details', jobIds: args.jobId, totalCalls });
        return;
    }

    // ── Company Reviews (paginated, 20 per page, data.reviews[]) ─────────────
    if (endpoint === '/company-reviews') {
        if (!args.company) { console.error('Error: --company required for /company-reviews'); process.exit(1); }
        const count = parseInt(args.count, 10) || 40;
        const perCall = Math.min(Math.max(parseInt(args.numPages, 10) || 1, 1), 10);
        const base = { company: args.company };
        if (args.sort) base.sort = args.sort;
        if (args.country) base.country = args.country;
        if (args.location) base.location = args.location;
        if (args.topic) base.topic = args.topic;
        if (args.jobTitle) base.job_title = args.jobTitle;
        if (args.text) base.text = args.text;

        const reviews = [];
        let company = null;
        let page = parseInt(args.page, 10) || 1;
        console.error(`Fetching up to ${count} reviews (20 per page)...`);
        while (reviews.length < count && page <= 100) {
            if (totalCalls > 0) await sleep(delay);
            const n = dryRun ? 1 : Math.min(perCall, Math.ceil((count - reviews.length) / 20));
            console.error(`  Page ${page}${n > 1 ? `-${page + n - 1}` : ''} (call ${totalCalls + 1})`);
            const data = await call('/company-reviews', { ...base, page, num_pages: n });
            const d = data.data || {};
            if (!company) {
                const { reviews: _r, ...aggregates } = d;
                company = { ...aggregates, company_slug_resolved: data.parameters && data.parameters.company_slug_resolved };
            }
            const batch = Array.isArray(d.reviews) ? d.reviews : [];
            reviews.push(...batch);
            if (data.parameters && data.parameters.page_past_last) { console.error('  Past the last page, stopping.'); break; }
            if (batch.length < n * 20) { console.error('  Short page, no more reviews.'); break; }
            if (dryRun) break;
            page += n;
        }

        const results = reviews.slice(0, count);
        if (company) {
            console.error(`${company.company_name || args.company}: rating ${company.company_rating}, ${company.company_review_count} reviews total (${company.company_filtered_review_count} under the current filters).`);
        }
        console.error(`${results.length} reviews in ${totalCalls} call(s).`);
        if (dryRun) { console.log(JSON.stringify({ company, reviews: results.slice(0, 5) }, null, 2)); return; }
        writeOutput(results, outputPath, format, { api: API_ID, endpoint: '/company-reviews', company, totalCalls });
        return;
    }

    if (endpoint !== '/search') {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }

    // ── Search (default, paginated, 10 per page) ─────────────────────────────
    if (!args.query) { console.error('Error: --query required for /search. Use --help for usage.'); process.exit(1); }

    const count = parseInt(args.count, 10) || 50;
    const perCall = Math.min(Math.max(parseInt(args.numPages, 10) || 1, 1), 50);
    const base = { query: args.query };
    if (args.location) base.location = args.location;
    if (args.country) base.country = args.country;
    if (args.language) base.language = args.language;
    if (args.datePosted) base.date_posted = args.datePosted;
    if (args.employmentTypes) base.employment_types = args.employmentTypes;
    if (args.experienceLevel) base.experience_level = args.experienceLevel;
    if (args.workFromHome) base.work_from_home = true;
    if (args.minSalary) base.min_salary = args.minSalary;
    if (args.maxSalary) base.max_salary = args.maxSalary;
    if (args.radius) base.radius = args.radius;
    if (args.excludeJobPublishers) base.exclude_job_publishers = args.excludeJobPublishers;
    if (args.fields) base.fields = args.fields;

    const jobs = [];
    const seen = new Set();
    let page = parseInt(args.page, 10) || 1;
    console.error(`Fetching up to ${count} jobs (10 per page)...`);
    while (jobs.length < count && page <= 50) {
        if (totalCalls > 0) await sleep(delay);
        const n = dryRun ? 1 : Math.min(perCall, Math.ceil((count - jobs.length) / 10));
        console.error(`  Page ${page}${n > 1 ? `-${page + n - 1}` : ''} (call ${totalCalls + 1})`);
        const data = await call('/search', { ...base, page, num_pages: n });
        const batch = Array.isArray(data.data) ? data.data : [];
        for (const job of batch) {
            if (job.job_id && seen.has(job.job_id)) continue;
            if (job.job_id) seen.add(job.job_id);
            jobs.push(job);
        }
        if (data.parameters && data.parameters.response_truncated) {
            console.error(`  Response truncated to fit the payload limit (${data.parameters.jobs_omitted} jobs omitted). Rerun with --fields or a smaller --num-pages to get them.`);
            break;
        }
        if (batch.length < n * 10) { console.error('  Short page, end of results.'); break; }
        if (dryRun) break;
        page += n;
    }

    const results = jobs.slice(0, count);
    console.error(`${results.length} jobs in ${totalCalls} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint: '/search', query: args.query, totalCalls });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
