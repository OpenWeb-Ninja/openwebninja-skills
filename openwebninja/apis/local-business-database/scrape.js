#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'local-business-database';
const MAX_SEARCH_LIMIT = 500;  // businesses per search call
const MAX_DETAIL_IDS = 500;    // business_ids per /business-details call
const REVIEWS_PAGE = 20;       // a cursor is only returned at limit=20
const MAX_PHOTOS_LIMIT = 10;   // spec allows 100, but a limit above 10 currently fails with 502 UPSTREAM_UNAVAILABLE

// Filters shared by /search, POST /search and both area endpoints: [flag key, API param].
// LIST: comma-separated, sent as-is on GET and split into an array on POST.
// REPEAT: a comma can be part of the value, so several values are separated with "|" on the
// command line and force POST /search (the GET form would need a repeated parameter).
const LIST_FILTERS = [
    ['businessCategory', 'business_category'], ['mainBusinessCategory', 'main_business_category'],
    ['businessCategoryId', 'business_category_id'], ['mainBusinessCategoryId', 'main_business_category_id'],
    ['country', 'country'], ['state', 'state'], ['zipcode', 'zipcode'],
    ['phoneNumber', 'phone_number'], ['businessId', 'business_id'],
];
const REPEAT_FILTERS = [['city', 'city'], ['district', 'district'], ['ownerName', 'owner_name'], ['streetAddress', 'street_address']];
const STRING_FILTERS = [['name', 'name'], ['address', 'address']];

function printHelp() {
    console.log(`
Usage: node scrape.js [filters] [options]

Search the Local Business Database (Google Maps listings, refreshed every 30 days): every
business matching the filters, by attribute, bounding box or radius; then full details,
live reviews and live photos by business id.

Endpoints:
  /search                        Filter search (default). At least one filter required.
  /area-search-by-bounding-box   Filters + --bbox
  /area-search-by-radius         Filters + --lat --lng --radius
  /business-details              Full records by --business-ids (batched 500 per call)
  /business-reviews              Live reviews by --business-id (20 per page)
  /business-photos               Live photos by --business-id

Filters (/search and area endpoints; comma-separated values are OR-ed, max 32):
  --business-category        Any category on the listing, e.g. "restaurant,bank"
  --main-business-category   Primary category, e.g. "Coffee shop"
  --business-category-id     Google category ids (gcids), wide filter
  --main-business-category-id  gcid of the primary category, e.g. "dentist"
  --country                  ISO alpha-2, e.g. "US" or "US,CA"
  --state                    State/province, e.g. "Texas" or "TX,FL"
  --city                     City. Several: separate with "|" (sent via POST /search)
  --zipcode                  ZIP/postal codes, e.g. "60602,98112"
  --district                 District/neighbourhood. Several: separate with "|"
  --name                     Business display name
  --owner-name               Owner profile name. Several: separate with "|"
  --phone-number             With country code, e.g. "+13127443356"
  --address                  Full formatted address incl. business name
  --street-address           Street line. Several: separate with "|" (matched exactly)
  --business-id              Exact Business Id(s), comma-separated
  --verified                 true (owner-claimed) | false (unclaimed)

Area:
  --bbox                     "bottom_left_lat,bottom_left_lng|top_right_lat,top_right_lng"
  --lat / --lng / --radius   Center point and radius in meters (1-100000)

Details / reviews / photos:
  --business-ids             Comma-separated business ids (for /business-details)
  --business-id              One business id (for /business-reviews, /business-photos)
  --sort-by                  Reviews: most_relevant (default), newest, highest_ranking, lowest_ranking
  --language                 Reviews/photos language (default: en)
  --region                   Reviews/photos region (default: us)

Common:
  --endpoint      Endpoint (default: /search)
  --post          Send /search as POST with a JSON body (also used automatically for "|" lists,
                  and lets /search take --bbox or --lat/--lng/--radius)
  --count         Max records to fetch (default: 100)
  --limit         Page size (search 1-500, photos 1-10; default: min(count, max))
  --fields        Comma-separated fields to return (business_id always included)
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --dry-run       Fetch one page only, print to console (shows match_count)
  --delay         Delay between calls in ms (default: 300)
  --max-calls     Safety cap on API calls (default: 20)
  --help          Show this help
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
    if (args.verified !== undefined) {
        const v = String(args.verified).toLowerCase() === 'true';
        query.verified = v;
        body.verified = v;
    }
    return { query, body, needsPost, count: Object.keys(body).length };
}

function parseBbox(bbox) {
    const parts = bbox.split('|');
    if (parts.length !== 2) { console.error('Error: --bbox format must be "bottom_left_lat,bottom_left_lng|top_right_lat,top_right_lng"'); process.exit(1); }
    return { bottom_left: parts[0].trim(), top_right: parts[1].trim() };
}

// Cursor walk shared by every paginated endpoint. The next cursor is at the top level of the
// response and is omitted on the last page. GET calls carry the cursor as a query param,
// POST /search carries it in the body.
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
            if (resultsKey === 'businesses') console.error(`  match_count: ${matchCount} matching businesses in total`);
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
    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'local-business-database.p.rapidapi.com';
    const count = parseInt(args.count, 10) || 100;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const delay = parseInt(args.delay, 10) || 300;
    const maxCalls = parseInt(args.maxCalls, 10) || 20;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `${API_ID}_${ts}.${format}`);

    // ── Business Details (batched, 500 ids per call) ──────────────────────────
    if (endpoint === '/business-details') {
        const raw = args.businessIds || args.businessId;
        if (!raw) { console.error('Error: --business-ids required for /business-details'); process.exit(1); }
        const ids = [...new Set(splitList(raw, ','))];
        const batches = [];
        for (let i = 0; i < ids.length; i += MAX_DETAIL_IDS) batches.push(ids.slice(i, i + MAX_DETAIL_IDS));
        if (batches.length > maxCalls) { console.error(`Error: ${batches.length} calls needed, limit is ${maxCalls}. Use --max-calls to raise.`); process.exit(1); }
        const records = [];
        for (let b = 0; b < batches.length; b++) {
            if (b > 0) await sleep(delay);
            console.error(`  Batch ${b + 1}/${batches.length} (${batches[b].length} ids)`);
            const params = { business_ids: batches[b].join(',') };
            if (args.fields) params.fields = args.fields;
            const data = await apiCall(host, '/business-details', params, apiKey, 'GET', null, API_ID);
            records.push(...((data.data && data.data.businesses) || []));
        }
        console.error(`${records.length} of ${ids.length} business(es) resolved in ${batches.length} call(s).`);
        if (dryRun) { console.log(JSON.stringify(records.slice(0, 3), null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint, ids: ids.length, totalCalls: batches.length });
        return;
    }

    // ── Business Reviews / Photos (live, cursor) ──────────────────────────────
    if (endpoint === '/business-reviews' || endpoint === '/business-photos') {
        if (!args.businessId) { console.error(`Error: --business-id required for ${endpoint}`); process.exit(1); }
        const isReviews = endpoint === '/business-reviews';
        const params = { business_id: args.businessId };
        // Reviews only paginate at limit=20; a smaller limit returns one trimmed page.
        params.limit = isReviews
            ? Math.min(REVIEWS_PAGE, count)
            : Math.min(MAX_PHOTOS_LIMIT, parseInt(args.limit, 10) || count);
        if (isReviews && args.sortBy) params.sort_by = args.sortBy;
        if (args.language) params.language = args.language;
        if (args.region) params.region = args.region;

        const { results, totalCallsMade } = await fetchCursor({
            host, endpoint, method: 'GET', params, apiKey, count,
            resultsKey: isReviews ? 'reviews' : 'photos', dryRun, delay, maxCalls,
        });
        console.error(`${results.length} ${isReviews ? 'reviews' : 'photos'} in ${totalCallsMade} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: API_ID, endpoint, businessId: args.businessId, totalCalls: totalCallsMade });
        return;
    }

    // ── Search / Area searches (cursor, up to 500 per call) ──────────────────
    if (!['/search', '/area-search-by-bounding-box', '/area-search-by-radius'].includes(endpoint)) {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }
    const filters = buildFilters(args);
    const area = {};
    if (args.bbox) Object.assign(area, parseBbox(args.bbox));
    if (args.lat !== undefined || args.lng !== undefined || args.radius !== undefined) {
        if (args.lat === undefined || args.lng === undefined || args.radius === undefined) { console.error('Error: --lat, --lng and --radius go together'); process.exit(1); }
        if (args.bbox) { console.error('Error: use either --bbox or --lat/--lng/--radius, not both'); process.exit(1); }
        Object.assign(area, { lat: Number(args.lat), lng: Number(args.lng), radius: Number(args.radius) });
    }
    if (endpoint === '/area-search-by-bounding-box' && !area.bottom_left) { console.error('Error: --bbox required for /area-search-by-bounding-box'); process.exit(1); }
    if (endpoint === '/area-search-by-radius' && area.lat === undefined) { console.error('Error: --lat, --lng and --radius required for /area-search-by-radius'); process.exit(1); }
    if (endpoint === '/search' && !filters.count && !(args.post && Object.keys(area).length)) {
        console.error('Error: /search needs at least one filter (e.g. --business-category, --city, --zipcode). Use --help for usage.');
        process.exit(1);
    }

    const limit = Math.min(MAX_SEARCH_LIMIT, parseInt(args.limit, 10) || count);
    // Area on /search, or a "|" list on a repeat-only filter, means POST /search.
    const usePost = args.post || filters.needsPost || (endpoint === '/search' && Object.keys(area).length > 0);
    let method = 'GET', apiEndpoint = endpoint, params = null, body = null;
    if (usePost) {
        method = 'POST';
        apiEndpoint = '/search';
        body = { ...filters.body, ...area, limit };
        if (args.fields) body.fields = splitList(args.fields, ',');
        if (endpoint !== '/search') console.error(`  Sending as POST /search (area + filters) instead of GET ${endpoint}.`);
    } else {
        params = { ...filters.query, ...area, limit };
        if (args.fields) params.fields = args.fields;
    }

    const { results, totalCallsMade, matchCount } = await fetchCursor({
        host, endpoint: apiEndpoint, method, params, body, apiKey, count,
        resultsKey: 'businesses', dryRun, delay, maxCalls,
    });

    console.error(`${results.length} businesses in ${totalCallsMade} call(s)${matchCount !== null ? ` (match_count: ${matchCount})` : ''}.`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint: `${method} ${apiEndpoint}`, filters: filters.body, area, matchCount, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
