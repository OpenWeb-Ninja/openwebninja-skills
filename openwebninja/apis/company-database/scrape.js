#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'company-database';
const MAX_SEARCH_LIMIT = 500;  // companies per search call

// Filters shared by GET and POST /search: [flag key, API param].
// LIST: comma-separated, sent as-is on GET and split into an array on POST.
// REPEAT: a comma can be part of the value, so several values are separated with "|" on the
// command line and force POST /search (the GET form would need a repeated parameter).
const LIST_FILTERS = [
    ['employerId', 'employer_id'], ['websiteDomain', 'website_domain'],
    ['industryId', 'industry_id'], ['sectorId', 'sector_id'],
    ['companyType', 'company_type'], ['sizeCategory', 'size_category'],
    ['stockTicker', 'stock_ticker'], ['hqCountry', 'hq_country'],
];
const REPEAT_FILTERS = [['industry', 'industry']];
const STRING_FILTERS = [
    ['name', 'name'], ['description', 'description'],
    ['sizeCategoryMin', 'size_category_min'], ['sizeCategoryMax', 'size_category_max'],
];
const INT_FILTERS = [['yearFoundedMin', 'year_founded_min'], ['yearFoundedMax', 'year_founded_max']];

function printHelp() {
    console.log(`
Usage: node scrape.js [filters] [options]

Search Glassdoor Company Data (a database of Glassdoor company profiles): every company
matching the filters, with ratings, review counts, revenue, size, mission and sub-ratings.

Endpoint:
  /search        Filter search (GET, or POST for "|" lists / --post). At least one filter required.

Filters (comma-separated values are OR-ed, max 20; filters are AND-ed):
  --name                 Company name, full-text match, e.g. "Microsoft"
  --employer-id          Glassdoor employer ids, e.g. "1651,9079"
  --website-domain       Domains or URLs, e.g. "microsoft.com,siemens.com"
  --industry             Industry name, e.g. "Software Development". Several: separate with "|" (sent via POST)
  --industry-id          Industry ids, e.g. "200063"
  --sector-id            Sector ids, e.g. "10013"
  --company-type         PUBLIC, PRIVATE, SUBSIDIARY, NONPROFIT, GOVERNMENT, UNIVERSITY, SCHOOL,
                         HOSPITAL, PRIVATE_PRACTICE, FRANCHISE, CONTRACT, SELF_EMPLOYED
  --size-category        SMALL, SMALL_TO_MEDIUM, MEDIUM, MEDIUM_TO_LARGE, LARGE, LARGE_TO_GIANT, GIANT
  --size-category-min    Smallest headcount band, inclusive, e.g. "LARGE"
  --size-category-max    Largest headcount band, inclusive
  --year-founded-min     Earliest founding year, inclusive, e.g. 1950
  --year-founded-max     Latest founding year, inclusive
  --stock-ticker         Tickers, e.g. "MSFT,NVDA"
  --hq-country           HQ country, ISO alpha-2, e.g. "US" or "US,DE"
  --description          Company description, full-text match, e.g. "cloud computing"

Common:
  --post          Send as POST /search with a JSON body (also used automatically for "|" lists)
  --count         Max records to fetch (default: 100)
  --limit         Page size 1-500 (default: min(count, 500))
  --fields        Comma-separated fields to return (employer_id always included)
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --dry-run       Fetch one page only, print to console (shows match_count)
  --delay         Delay between calls in ms (default: 300)
  --max-calls     Safety cap on API calls (default: 20)
  --help          Show this help

Billing: one Companies unit per record returned; --fields does not change it.
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--post') { args.post = true; continue; }
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

function splitList(v, sep) {
    return String(v).split(sep).map(s => s.trim()).filter(Boolean);
}

// Builds the filter set in both shapes: GET query params and a POST body.
function buildFilters(args) {
    const query = {}, body = {};
    let needsPost = false;
    for (const [k, p] of LIST_FILTERS) {
        if (!args[k]) continue;
        query[p] = args[k];
        body[p] = splitList(args[k], ',');
    }
    for (const [k, p] of REPEAT_FILTERS) {
        if (!args[k]) continue;
        const values = splitList(args[k], '|');
        if (values.length > 1) needsPost = true;
        query[p] = values[0];
        body[p] = values;
    }
    for (const [k, p] of STRING_FILTERS) {
        if (!args[k]) continue;
        query[p] = args[k];
        body[p] = args[k];
    }
    for (const [k, p] of INT_FILTERS) {
        if (args[k] === undefined) continue;
        const v = parseInt(args[k], 10);
        if (Number.isNaN(v)) { console.error(`Error: --${p.replace(/_/g, '-')} must be a whole number`); process.exit(1); }
        query[p] = v;
        body[p] = v;
    }
    return { query, body, needsPost, count: Object.keys(body).length };
}

// Cursor walk. The next cursor is at the top level of the response and is omitted on the
// last page. GET calls carry the cursor as a query param, POST /search carries it in the body.
async function fetchCursor({ host, endpoint, method, params, body, apiKey, count, resultsKey, dryRun, delay, maxCalls }) {
    const results = [];
    let cursor = null, totalCallsMade = 0, matchCount = null;
    while (results.length < count) {
        if (totalCallsMade > 0) await sleep(delay);
        totalCallsMade++;
        if (totalCallsMade > maxCalls) throw new Error(`Cost cap exceeded: ${totalCallsMade} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
        console.error(`  Call ${totalCallsMade}${cursor ? ' (cursor)' : ''}`);
        const data = method === 'POST'
            ? await apiCall(host, endpoint, {}, apiKey, 'POST', cursor ? { ...body, cursor } : body, API_ID)
            : await apiCall(host, endpoint, cursor ? { ...params, cursor } : params, apiKey, 'GET', null, API_ID);
        const d = data.data || {};
        if (matchCount === null && d.match_count !== undefined) {
            matchCount = d.match_count;
            console.error(`  match_count: ${matchCount} matching companies in total`);
        }
        const records = Array.isArray(d[resultsKey]) ? d[resultsKey] : [];
        if (!records.length) { console.error('  No results, stopping.'); break; }
        results.push(...records);
        cursor = data.cursor || null;
        if (dryRun) break;
        if (!cursor) { console.error('  No next cursor, end of results.'); break; }
    }
    return { results: results.slice(0, count), totalCallsMade, matchCount };
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    if (endpoint !== '/search') {
        console.error(`Error: Unknown endpoint "${endpoint}". This API has one endpoint, /search. Use --help for usage.`);
        process.exit(1);
    }
    const apiKey = getApiKey();
    if (!String(apiKey).startsWith('ak_')) {
        console.error('Error: company-database has no RapidAPI listing. Set OPENWEBNINJA_API_KEY (ak_...) in .env.');
        process.exit(1);
    }
    const meta = loadMeta(API_ID);
    // No RapidAPI listing: apiCall routes ak_ keys to api.openwebninja.com/<own_slug>.
    const host = meta.rapidapi_host || 'api.openwebninja.com';
    const count = parseInt(args.count, 10) || 100;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const delay = parseInt(args.delay, 10) || 300;
    const maxCalls = parseInt(args.maxCalls, 10) || 20;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `${API_ID}_${ts}.${format}`);

    const filters = buildFilters(args);
    if (!filters.count) {
        console.error('Error: /search needs at least one filter (e.g. --name, --website-domain, --industry, --hq-country). Use --help for usage.');
        process.exit(1);
    }

    const limit = Math.min(MAX_SEARCH_LIMIT, parseInt(args.limit, 10) || count);
    const usePost = args.post || filters.needsPost;
    let method = 'GET', params = null, body = null;
    if (usePost) {
        method = 'POST';
        body = { ...filters.body, limit };
        if (args.fields) body.fields = splitList(args.fields, ',');
    } else {
        params = { ...filters.query, limit };
        if (args.fields) params.fields = args.fields;
    }

    const { results, totalCallsMade, matchCount } = await fetchCursor({
        host, endpoint: '/search', method, params, body, apiKey, count,
        resultsKey: 'companies', dryRun, delay, maxCalls,
    });

    console.error(`${results.length} companies in ${totalCallsMade} call(s)${matchCount !== null ? ` (match_count: ${matchCount})` : ''}.`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint: `${method} /search`, filters: filters.body, matchCount, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
