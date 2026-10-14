#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'realtime-ziprecruiter-data';

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search ZipRecruiter jobs (US and Canada), get full job details, and get salary estimates.

Required (varies by endpoint):
  --query             Job search query (for /search)
  --job-id            Comma-separated job ids, up to 20 (for /job-details)
  --job-title         Job title to price (for /estimated-salary; --query also accepted)

Optional:
  --endpoint          Endpoint: /search (default), /job-details, /estimated-salary
  --count             Max jobs to fetch (default: 40, 20 per page)
  --format            json | csv (default: json)
  --output            Output file path (auto-generated if omitted)
  --country           us (default) | ca
  --fields            Comma-separated fields to return (all endpoints)

/search filters:
  --location          Free-text location, e.g. "New York, NY" or "Toronto, ON"
  --page              Start page (default: 1, max 50)
  --num-pages         Pages fetched per call (default: 1, max 20; max 5 with --include-details)
  --date-posted       all | today | 3days | week | month
  --employment-types  Comma-separated: FULLTIME, PARTTIME, CONTRACTOR, TEMPORARY, CONTRACT_TO_HIRE, AS_NEEDED, OTHER
  --experience-level  One of: no_experience | junior | mid | senior
  --remote-jobs-only  Only remote jobs (alias: --remote)
  --salary-min        Minimum annual salary in dollars (only jobs that state a salary)
  --salary-max        Maximum annual salary in dollars
  --radius            Radius in km around --location (requires --location)
  --zipapply-only     Only jobs that support ZipApply one-click apply
  --company-id        Only jobs from this ziprecruiter_company_id (send --location too)
  --include-details   Fill job_description and detail-only fields (1 extra request per job)

/estimated-salary:
  --location          US state, Canadian province or country spelled out in full, e.g. "New York".
                      Omit for the national figure. Cities and 2-letter codes are rejected.

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
        if (arg === '--remote-jobs-only' || arg === '--remote') { args.remoteJobsOnly = true; continue; }
        if (arg === '--zipapply-only') { args.zipapplyOnly = true; continue; }
        if (arg === '--include-details') { args.includeDetails = true; continue; }
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
    const host = meta.rapidapi_host || 'real-time-ziprecruiter-data.p.rapidapi.com';
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
        if (args.fields) params.fields = args.fields;
        const data = await call('/job-details', params);
        const records = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
        console.error(`${records.length} job(s) resolved in 1 call.`);
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint: '/job-details', jobIds: args.jobId, totalCalls });
        return;
    }

    // ── Estimated Salary (single call, one row) ──────────────────────────────
    if (endpoint === '/estimated-salary') {
        const jobTitle = args.jobTitle || args.query;
        if (!jobTitle) { console.error('Error: --job-title required for /estimated-salary'); process.exit(1); }
        const params = { job_title: jobTitle };
        if (args.location) params.location = args.location;
        if (args.country) params.country = args.country;
        if (args.fields) params.fields = args.fields;
        const data = await call('/estimated-salary', params);
        const records = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint: '/estimated-salary', jobTitle, location: args.location || 'nationwide', totalCalls });
        return;
    }

    if (endpoint !== '/search') {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }

    // ── Search (default, paginated, 20 per page) ─────────────────────────────
    if (!args.query) { console.error('Error: --query required for /search. Use --help for usage.'); process.exit(1); }

    const count = parseInt(args.count, 10) || 40;
    const maxPerCall = args.includeDetails ? 5 : 20;
    const perCall = Math.min(Math.max(parseInt(args.numPages, 10) || 1, 1), maxPerCall);
    const base = { query: args.query };
    if (args.location) base.location = args.location;
    if (args.country) base.country = args.country;
    if (args.datePosted) base.date_posted = args.datePosted;
    if (args.employmentTypes) base.employment_types = args.employmentTypes;
    if (args.experienceLevel) base.experience_level = args.experienceLevel;
    if (args.remoteJobsOnly) base.remote_jobs_only = true;
    if (args.salaryMin) base.salary_min = args.salaryMin;
    if (args.salaryMax) base.salary_max = args.salaryMax;
    if (args.radius) base.radius = args.radius;
    if (args.zipapplyOnly) base.zipapply_only = true;
    if (args.companyId) base.company_id = args.companyId;
    if (args.includeDetails) base.include_details = true;
    if (args.fields) base.fields = args.fields;

    const jobs = [];
    const seen = new Set();
    let page = parseInt(args.page, 10) || 1;
    console.error(`Fetching up to ${count} jobs (20 per page)...`);
    while (jobs.length < count && page <= 50) {
        if (totalCalls > 0) await sleep(delay);
        const n = dryRun ? 1 : Math.min(perCall, Math.ceil((count - jobs.length) / 20));
        console.error(`  Page ${page}${n > 1 ? `-${page + n - 1}` : ''} (call ${totalCalls + 1})`);
        const data = await call('/search', { ...base, page, num_pages: n });
        const batch = Array.isArray(data.data) ? data.data : [];
        for (const job of batch) {
            if (job.job_id && seen.has(job.job_id)) continue;
            if (job.job_id) seen.add(job.job_id);
            jobs.push(job);
        }
        if (batch.length < n * 20) { console.error('  Short page, end of results.'); break; }
        if (dryRun) break;
        page += n;
    }

    const results = jobs.slice(0, count);
    console.error(`${results.length} jobs in ${totalCalls} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint: '/search', query: args.query, totalCalls });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
