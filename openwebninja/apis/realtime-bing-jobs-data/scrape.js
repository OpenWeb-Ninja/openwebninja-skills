#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'realtime-bing-jobs-data';
const PAGE_SIZE = 10;       // fixed by the API
const MAX_PAGE = 50;        // page + num_pages - 1 must stay within page 50
const MAX_NUM_PAGES = 20;   // pages per call
const MAX_DESC_PAGES = 10;  // include_descriptions is capped at 100 jobs per call
const MAX_IDS = 20;         // ids per /job-details call

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search Bing Jobs (LinkedIn, ZipRecruiter, Monster and other boards) and get full job details.

Required (varies by endpoint):
  --query                  Job search query with role and location, e.g. "developer jobs in new york" (for /search)
  --job-id                 Job id(s), comma-separated (for /job-details; batched 20 per call)

Optional:
  --endpoint               Endpoint: /search (default), /job-details
  --count                  Max jobs to fetch (default: 50, max 500 per query, 10 per page)
  --page                   Page to start from (default: 1, max 50)
  --format                 json | csv (default: json)
  --output                 Output file path (auto-generated if omitted)
  --location               Free-text location, appended to the query
  --country                ISO 3166-1 alpha-2 country code; selects Bing's national index (default: us)
  --language               ISO 639-1 language (default: primary language of --country)
  --date-posted            all | today | 3days | week | month (default: all; month returns a superset)
  --employment-types       Comma-separated: FULLTIME, CONTRACTOR, PARTTIME, INTERN
  --work-from-home         Only remote jobs
  --radius                 Radius in km (snapped to Bing's 10/20/30/40 mile menu)
  --exclude-job-publishers Comma-separated publishers to drop, e.g. "LinkedIn,Indeed"
  --include-descriptions   true | false (default: true). false = faster listing-only response
  --fields                 Comma-separated job fields to return (job_id, job_title always included)
  --dry-run                Fetch one page only, print to console
  --delay                  Delay between calls in ms (default: 300)
  --max-calls              Safety cap on HTTP calls (default: 10). Each call fetches up to 10 pages
                           (20 with --include-descriptions false).
  --help                   Show this help
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--work-from-home') { args.workFromHome = true; continue; }
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

// Walks page/num_pages windows. Every call re-walks Bing's results from the start and Bing's
// ranking drifts between calls, so each call asks for as many pages as still needed and
// results are de-duplicated by job_id across calls. A call returning fewer than
// num_pages x 10 jobs has reached the end, unless exclude_job_publishers dropped some.
async function fetchPages({ host, params, apiKey, count, startPage, pagesPerCall, dryRun, delay, maxCalls }) {
    const results = [];
    const seen = new Set();
    let page = startPage, totalCallsMade = 0;
    console.error(`Fetching up to ${count} jobs from page ${page}...`);
    while (results.length < count && page <= MAX_PAGE) {
        const numPages = dryRun ? 1 : Math.min(pagesPerCall, Math.ceil((count - results.length) / PAGE_SIZE), MAX_PAGE - page + 1);
        if (totalCallsMade > 0) await sleep(delay);
        totalCallsMade++;
        if (totalCallsMade > maxCalls) throw new Error(`Cost cap exceeded: ${totalCallsMade} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
        console.error(`  Pages ${page}-${page + numPages - 1} (call ${totalCallsMade})`);
        const data = await apiCall(host, '/search', { ...params, page, num_pages: numPages }, apiKey, 'GET', null, API_ID);
        const jobs = Array.isArray(data.data) ? data.data : [];
        if (!jobs.length) { console.error('  No results, stopping.'); break; }
        for (const job of jobs) {
            if (seen.has(job.job_id)) continue;
            seen.add(job.job_id);
            results.push(job);
        }
        page += numPages;
        if (dryRun) break;
        if (jobs.length < numPages * PAGE_SIZE && !params.exclude_job_publishers) { console.error('  Short page, end of results.'); break; }
    }
    return { results: results.slice(0, count), totalCallsMade };
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'real-time-bing-jobs-data.p.rapidapi.com';
    const count = parseInt(args.count, 10) || 50;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const delay = parseInt(args.delay, 10) || 300;
    const maxCalls = parseInt(args.maxCalls, 10) || 10;
    const startPage = parseInt(args.page, 10) || 1;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `${API_ID}_${ts}.${format}`);

    // ── Job Details (batched lookup, 20 ids per call) ─────────────────────────
    if (endpoint === '/job-details') {
        if (!args.jobId) { console.error('Error: --job-id required for /job-details'); process.exit(1); }
        const ids = [...new Set(args.jobId.split(',').map(s => s.trim()).filter(Boolean))];
        const batches = [];
        for (let i = 0; i < ids.length; i += MAX_IDS) batches.push(ids.slice(i, i + MAX_IDS));
        if (batches.length > maxCalls) { console.error(`Error: ${batches.length} calls needed, limit is ${maxCalls}. Use --max-calls to raise.`); process.exit(1); }
        const records = [];
        for (let b = 0; b < batches.length; b++) {
            if (b > 0) await sleep(delay);
            console.error(`  Batch ${b + 1}/${batches.length} (${batches[b].length} ids)`);
            const params = { job_id: batches[b].join(',') };
            if (args.country) params.country = args.country;
            if (args.language) params.language = args.language;
            if (args.fields) params.fields = args.fields;
            const data = await apiCall(host, '/job-details', params, apiKey, 'GET', null, API_ID);
            records.push(...(Array.isArray(data.data) ? data.data : []));
        }
        console.error(`${records.length} of ${ids.length} job(s) resolved in ${batches.length} call(s).`);
        if (dryRun) { console.log(JSON.stringify(records.slice(0, 3), null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint: '/job-details', ids: ids.length, totalCalls: batches.length });
        return;
    }

    if (endpoint !== '/search') {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }

    // ── Search (paginated) ────────────────────────────────────────────────────
    if (!args.query) { console.error('Error: --query required for /search. Use --help for usage.'); process.exit(1); }

    const params = { query: args.query };
    if (args.location) params.location = args.location;
    if (args.country) params.country = args.country;
    if (args.language) params.language = args.language;
    if (args.datePosted) params.date_posted = args.datePosted;
    if (args.employmentTypes) params.employment_types = args.employmentTypes;
    if (args.workFromHome) params.work_from_home = true;
    if (args.radius) params.radius = args.radius;
    if (args.excludeJobPublishers) params.exclude_job_publishers = args.excludeJobPublishers;
    if (args.includeDescriptions) params.include_descriptions = args.includeDescriptions;
    if (args.fields) params.fields = args.fields;
    const pagesPerCall = params.include_descriptions === 'false' ? MAX_NUM_PAGES : MAX_DESC_PAGES;

    const { results, totalCallsMade } = await fetchPages({
        host, params, apiKey, count, startPage, pagesPerCall, dryRun, delay, maxCalls,
    });

    console.error(`${results.length} jobs in ${totalCallsMade} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint: '/search', query: args.query, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
