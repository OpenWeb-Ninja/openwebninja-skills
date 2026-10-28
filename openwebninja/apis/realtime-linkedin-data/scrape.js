#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'realtime-linkedin-data';
const PAGE_SIZE = 10;            // fixed by LinkedIn
const MAX_PAGE = 100;            // 1000-result ceiling
const MAX_NUM_PAGES = 20;        // pages per call
const MAX_NUM_PAGES_DETAILS = 10; // include_details fills at most 100 jobs per call
const MAX_IDS = 20;              // ids per /job-details call

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search LinkedIn jobs, list every open job at a company, and look up jobs by id.

Required (varies by endpoint):
  --query             Job search query (for /search; optional keyword filter on /company-jobs)
  --company-id        LinkedIn numeric company id(s), comma-separated, up to 10
                      (for /company-jobs; on /search restricts to one company)
  --company           Company vanity slug(s) or page URL(s), comma-separated, up to 10
                      (for /company-jobs, alternative to --company-id; 1 extra request per slug)
  --job-id            Job id(s), comma-separated (for /job-details; batched 20 per call)

Optional:
  --endpoint          Endpoint: /search (default), /company-jobs, /job-details
  --count             Max jobs to fetch (default: 50, max 1000 per query, 10 per page)
  --page              Page to start from (default: 1, max 100)
  --format            json | csv (default: json)
  --output            Output file path (auto-generated if omitted)
  --location          Free-text location, e.g. "Berlin, Germany"
  --geo-id            LinkedIn numeric geo id, e.g. 102571732 (New York City). Required by --radius
  --radius            Radius in km (requires --geo-id)
  --sort-by           relevance | date (date sorts the returned jobs newest first)
  --date-posted       all | today | 3days | week | month (default: all)
  --employment-types  Comma-separated: FULLTIME, PARTTIME, CONTRACTOR, INTERN (filtered locally)
  --seniority-levels  Comma-separated: Internship, Entry level, Associate, Mid-Senior level,
                      Director, Executive, Not Applicable (filtered locally)
  --remote-jobs-only  Only jobs with an explicit remote marker (low recall)
  --no-details        include_details=false: card-only response, ~3x faster
  --fields            Comma-separated job fields to return (job_id, job_title always included)
  --dry-run           Fetch one page only, print to console
  --delay             Delay between calls in ms (default: 300)
  --max-calls         Safety cap on HTTP calls (default: 10). Each call fetches up to 10 pages
                      (20 with --no-details).
  --help              Show this help

Billing: one request per page of 10. Local filters (--employment-types, --seniority-levels,
--remote-jobs-only) over-fetch up to 3x the pages, and those pages are billed.
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--remote-jobs-only') { args.remoteJobsOnly = true; continue; }
        if (arg === '--no-details') { args.noDetails = true; continue; }
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

// Walks page/num_pages windows, asking for as many pages per call as still needed (up to 20,
// or 10 while include_details is on). Without a local filter, a call returning fewer than
// num_pages x 10 jobs is the last one; with one, only an empty response ends the walk.
// After the first /company-jobs call, slugs are swapped for the resolved ids so the slug
// lookup is not billed again on every page.
async function fetchPages({ host, endpoint, params, apiKey, count, startPage, localFilter, dryRun, delay, maxCalls }) {
    const results = [];
    const seen = new Set();
    const perCall = params.include_details === false && !localFilter ? MAX_NUM_PAGES : MAX_NUM_PAGES_DETAILS;
    let page = startPage, totalCallsMade = 0;
    console.error(`Fetching up to ${count} jobs from page ${page}...`);
    while (results.length < count && page <= MAX_PAGE) {
        const numPages = dryRun ? 1 : Math.min(perCall, Math.ceil((count - results.length) / PAGE_SIZE), MAX_PAGE - page + 1);
        if (totalCallsMade > 0) await sleep(delay);
        totalCallsMade++;
        if (totalCallsMade > maxCalls) throw new Error(`Cost cap exceeded: ${totalCallsMade} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
        console.error(`  Pages ${page}-${page + numPages - 1} (call ${totalCallsMade})`);
        const data = await apiCall(host, endpoint, { ...params, page, num_pages: numPages }, apiKey, 'GET', null, API_ID);
        const jobs = Array.isArray(data.data) ? data.data : [];
        const resolved = data.parameters && data.parameters.company_ids_resolved;
        if (params.company && resolved) {
            delete params.company;
            params.company_id = resolved;
        }
        if (!jobs.length) { console.error('  No results, stopping.'); break; }
        for (const job of jobs) {
            if (seen.has(job.job_id)) continue;
            seen.add(job.job_id);
            results.push(job);
        }
        page += numPages;
        if (dryRun) break;
        if (!localFilter && jobs.length < numPages * PAGE_SIZE) { console.error('  Short page, end of results.'); break; }
    }
    return { results: results.slice(0, count), totalCallsMade };
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'real-time-linkedin-data3.p.rapidapi.com';
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
            if (args.fields) params.fields = args.fields;
            const data = await apiCall(host, '/job-details', params, apiKey, 'GET', null, API_ID);
            records.push(...(Array.isArray(data.data) ? data.data : []));
        }
        console.error(`${records.length} of ${ids.length} job(s) resolved in ${batches.length} call(s).`);
        if (dryRun) { console.log(JSON.stringify(records.slice(0, 3), null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint: '/job-details', ids: ids.length, totalCalls: batches.length });
        return;
    }

    // ── Search / Company Jobs (paginated) ─────────────────────────────────────
    const params = {};
    if (endpoint === '/company-jobs') {
        if (!args.companyId && !args.company) { console.error('Error: --company-id or --company required for /company-jobs'); process.exit(1); }
        if (args.company) params.company = args.company;
        if (args.query) params.query = args.query;
    } else if (endpoint === '/search') {
        if (!args.query) { console.error('Error: --query required for /search. Use --help for usage.'); process.exit(1); }
        params.query = args.query;
    } else {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }
    if (args.radius && !args.geoId) { console.error('Error: --radius requires --geo-id'); process.exit(1); }
    if (args.companyId) params.company_id = args.companyId;
    if (args.location) params.location = args.location;
    if (args.geoId) params.geo_id = args.geoId;
    if (args.radius) params.radius = args.radius;
    if (args.sortBy) params.sort_by = args.sortBy;
    if (args.datePosted) params.date_posted = args.datePosted;
    if (args.employmentTypes) params.employment_types = args.employmentTypes;
    if (args.seniorityLevels) params.seniority_levels = args.seniorityLevels;
    if (args.remoteJobsOnly) params.remote_jobs_only = true;
    if (args.noDetails) params.include_details = false;
    if (args.fields) params.fields = args.fields;
    const localFilter = !!(args.employmentTypes || args.seniorityLevels || args.remoteJobsOnly);

    const { results, totalCallsMade } = await fetchPages({
        host, endpoint, params, apiKey, count, startPage, localFilter, dryRun, delay, maxCalls,
    });

    console.error(`${results.length} jobs in ${totalCallsMade} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint, query: args.query, company: args.company || args.companyId, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
