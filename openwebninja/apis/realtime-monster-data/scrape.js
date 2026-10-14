#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'realtime-monster-data';
const PAGE_SIZE = 10;     // fixed by Monster
const MAX_PAGE = 51;      // Monster serves nothing past offset 500 (510 jobs per query)
const MAX_NUM_PAGES = 20; // pages per call
const MAX_IDS = 20;       // ids per /job-details call

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search Monster jobs, list every open job at an employer, and look up jobs by id.

Required (varies by endpoint):
  --query             Job search query (for /search; optional keyword filter on /company-jobs)
  --company           Employer display name(s), comma-separated, up to 10 (for /company-jobs)
  --job-id            Job id(s), comma-separated (for /job-details; batched 20 per call)

Optional:
  --endpoint          Endpoint: /search (default), /company-jobs, /job-details
  --count             Max jobs to fetch (default: 50, max 510 per query, 10 per page)
  --page              Page to start from (default: 1, max 51)
  --format            json | csv (default: json)
  --output            Output file path (auto-generated if omitted)
  --location          Free-text location, e.g. "New York, NY" (required by --radius)
  --radius            Radius around --location in km (1-160)
  --country           2-letter country code (default: us). Jobs exist for us, gb, ca, ie, fr, be,
                      nl, es, se, ch, at, it, lu
  --language          Language of the query text as xx-xx, e.g. en-us (/search only)
  --sort-by           relevance | date (date sorts the returned jobs newest first; /search only)
  --date-posted       all | today | 3days | week | month (default: all)
  --employment-types  Comma-separated: FULLTIME, PARTTIME, CONTRACTOR, INTERN
  --remote-jobs-only  Only remote jobs (/search only)
  --fields            Comma-separated job fields to return (job_id, job_title always included)
  --dry-run           Fetch one page only, print to console
  --delay             Delay between calls in ms (default: 300)
  --max-calls         Safety cap on HTTP calls (default: 10). Each call fetches up to 20 pages.
  --help              Show this help

Billing: one request per page of 10, plus one extra request for any call starting above page 1.
This script fetches up to 20 pages per call (num_pages) to keep that extra cost to a minimum.
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--remote-jobs-only') { args.remoteJobsOnly = true; continue; }
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

// Walks page/num_pages windows. Monster bills one extra request for every call whose page is
// above 1, so each call asks for as many pages as still needed (up to 20) instead of one.
// Short pages occur inside the window, so only an empty response ends the walk.
async function fetchPages({ host, endpoint, params, apiKey, count, startPage, dryRun, delay, maxCalls }) {
    const results = [];
    const seen = new Set();
    let page = startPage, totalCallsMade = 0;
    console.error(`Fetching up to ${count} jobs from page ${page}...`);
    while (results.length < count && page <= MAX_PAGE) {
        const numPages = dryRun ? 1 : Math.min(MAX_NUM_PAGES, Math.ceil((count - results.length) / PAGE_SIZE), MAX_PAGE - page + 1);
        if (totalCallsMade > 0) await sleep(delay);
        totalCallsMade++;
        if (totalCallsMade > maxCalls) throw new Error(`Cost cap exceeded: ${totalCallsMade} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
        console.error(`  Pages ${page}-${page + numPages - 1} (call ${totalCallsMade})`);
        const data = await apiCall(host, endpoint, { ...params, page, num_pages: numPages }, apiKey, 'GET', null, API_ID);
        const jobs = Array.isArray(data.data) ? data.data : [];
        if (!jobs.length) { console.error('  No results, stopping.'); break; }
        for (const job of jobs) {
            if (seen.has(job.job_id)) continue;
            seen.add(job.job_id);
            results.push(job);
        }
        page += numPages;
        if (dryRun) break;
    }
    return { results: results.slice(0, count), totalCallsMade };
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'real-time-monster-data.p.rapidapi.com';
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
    let params;
    if (endpoint === '/company-jobs') {
        if (!args.company) { console.error('Error: --company required for /company-jobs'); process.exit(1); }
        params = { company: args.company };
        if (args.query) params.query = args.query;
    } else if (endpoint === '/search') {
        if (!args.query) { console.error('Error: --query required for /search. Use --help for usage.'); process.exit(1); }
        params = { query: args.query };
        if (args.language) params.language = args.language;
        if (args.sortBy) params.sort_by = args.sortBy;
        if (args.remoteJobsOnly) params.remote_jobs_only = true;
    } else {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }
    if (args.radius && !args.location) { console.error('Error: --radius requires --location'); process.exit(1); }
    if (args.location) params.location = args.location;
    if (args.radius) params.radius = args.radius;
    if (args.country) params.country = args.country;
    if (args.datePosted) params.date_posted = args.datePosted;
    if (args.employmentTypes) params.employment_types = args.employmentTypes;
    if (args.fields) params.fields = args.fields;

    const { results, totalCallsMade } = await fetchPages({
        host, endpoint, params, apiKey, count, startPage, dryRun, delay, maxCalls,
    });

    console.error(`${results.length} jobs in ${totalCallsMade} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint, query: args.query, company: args.company, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
