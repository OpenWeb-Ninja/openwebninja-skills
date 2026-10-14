#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, fetchAll, toCSV, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'realtime-bing-search';

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search Microsoft Bing: web, news, images, videos, shopping, product details and maps.

Required (varies by endpoint):
  --query         Search query (all endpoints except /product-details)
  --product-id    Product id from /shopping (for /product-details)

Optional:
  --endpoint      Endpoint: /search (default), /news, /images, /videos, /shopping, /product-details, /maps
  --count         Max results to fetch (default: 50). Caps: /search 10, /news 200, /images 560,
                  /videos 140, /shopping 180, /maps 100
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --country       ISO 3166-1 alpha-2 market (default: us; /product-details defaults to the product's market)
  --language      ISO 639-1 interface language (default: en)
  --time-period   /search, /images, /videos: any, last_day, last_week, last_month, last_year
                  /news: any, last_hour, last_day, last_week, last_month
  --safe-search   off | moderate | strict (/search, /images, /videos; default: off)
  --sort-by       /news: RELEVANCE, DATE. /shopping: BEST_MATCH, LOWEST_PRICE, HIGHEST_PRICE
  --size          /images: any, small, medium, large, wallpaper
  --color         /images: any, full, grayscale, red, orange, yellow, green, teal, blue, purple,
                  pink, brown, black, gray, white
  --type          /images: any, photo, clipart, lineart, animated, transparent
  --aspect-ratio  /images: any, square, wide, tall
  --people        /images: any, face, portrait
  --usage-rights  /images: any, creative_commons, public_domain, free_to_share,
                  free_to_share_commercially, free_to_modify, free_to_modify_commercially
  --duration      /videos: any, short (<5 min), medium (5-20 min), long (>20 min)
  --source-site   /videos: only videos hosted on this domain, e.g. youtube.com
  --min-price     /shopping: minimum price in the market currency
  --max-price     /shopping: maximum price in the market currency
  --include-sponsored  /shopping: also return Bing's paid product grid (sponsored_products)
  --limit         /maps: places per page, 1-50 (default: 20)
  --lat           /maps: latitude to centre the search on (use with --lng)
  --lng           /maps: longitude to centre the search on (use with --lat)
  --dry-run       Fetch first page only, print to console
  --max-calls     Safety cap on API calls (default: 30)
  --help          Show this help
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--include-sponsored') { args.includeSponsored = true; continue; }
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

// News, images, videos, maps and shopping pages can share results; keep the first occurrence.
function dedupe(records, keyFn) {
    const seen = new Set();
    return records.filter(r => {
        const k = keyFn(r);
        if (k === undefined || k === null) return true;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'real-time-bing-search.p.rapidapi.com';
    const count = parseInt(args.count, 10) || 50;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const maxCalls = parseInt(args.maxCalls, 10) || 30;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `${API_ID}_${ts}.${format}`);

    // ── Product Details (single call, no pagination) ──────────────────────────
    if (endpoint === '/product-details') {
        if (!args.productId) { console.error('Error: --product-id required for /product-details (take it from /shopping)'); process.exit(1); }
        const params = { product_id: args.productId };
        if (args.country) params.country = args.country;
        if (args.language) params.language = args.language;
        const data = await apiCall(host, '/product-details', params, apiKey, 'GET', null, API_ID);
        const records = data.data ? [data.data] : [data];
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: API_ID, endpoint: '/product-details', productId: args.productId, totalCalls: 1 });
        return;
    }

    if (!args.query) { console.error(`Error: --query required for ${endpoint}. Use --help for usage.`); process.exit(1); }
    const base = { query: args.query };
    if (args.country) base.country = args.country;
    if (args.language) base.language = args.language;

    // ── Web Search (single call, up to 10 organic results) ────────────────────
    if (endpoint === '/search') {
        const params = { ...base };
        if (args.timePeriod) params.time_period = args.timePeriod;
        if (args.safeSearch) params.safe_search = args.safeSearch;
        const data = await apiCall(host, '/search', params, apiKey, 'GET', null, API_ID);
        const results = ((data.data && data.data.organic_results) || []).slice(0, count);
        const estimate = data.data && data.data.total_organic_results;
        console.error(`${results.length} organic results${estimate != null ? ` (Bing estimate: ${estimate})` : ''} in 1 call.`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: API_ID, endpoint: '/search', query: args.query, totalCalls: 1 });
        return;
    }

    // ── Shopping (paginated; organic products + optional sponsored grid) ──────
    if (endpoint === '/shopping') {
        const params = { ...base };
        if (args.sortBy) params.sort_by = args.sortBy;
        if (args.minPrice) params.min_price = args.minPrice;
        if (args.maxPrice) params.max_price = args.maxPrice;
        const priceFiltered = params.min_price !== undefined || params.max_price !== undefined;
        const includeSponsored = !!args.includeSponsored;

        // Most markets serve 36 per page, Bing's list layout 20; plan on 20 and stop once count is met.
        const totalPages = dryRun ? 1 : Math.min(9, Math.ceil(count / 20));
        const products = [], sponsored = [];
        let totalCallsMade = 0;
        console.error(`Fetching up to ${count} products across up to ${totalPages} page(s)...`);
        for (let page = 1; page <= totalPages; page++) {
            if (page > 1) await sleep(300);
            totalCallsMade++;
            if (totalCallsMade > maxCalls) throw new Error(`Cost cap exceeded: ${totalCallsMade} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
            console.error(`  Page ${page}/${totalPages} (call ${totalCallsMade})`);
            let data;
            try {
                data = await apiCall(host, '/shopping', { ...params, page }, apiKey, 'GET', null, API_ID);
            } catch (e) {
                // With a price filter, a page holding no product in range is a 404: treat as the end.
                if (priceFiltered && /^HTTP 404/.test(e.message)) { console.error('  No product in the price range on this page, stopping.'); break; }
                throw e;
            }
            const d = data.data || {};
            const pageProducts = d.products || [];
            const pageSponsored = d.sponsored_products || [];
            // Stop when organic products run out. Only a sponsored-only market (no organic product
            // at all, e.g. Japan) keeps paging for the sponsored grid, and only with --include-sponsored.
            if (!pageProducts.length && (!includeSponsored || !pageSponsored.length || products.length)) {
                if (pageSponsored.length && !includeSponsored) console.error(`  No organic products, ${pageSponsored.length} sponsored on this page (pass --include-sponsored to keep them).`);
                else console.error('  No more products, stopping.');
                break;
            }
            products.push(...pageProducts);
            sponsored.push(...pageSponsored);
            if (products.length + (includeSponsored ? sponsored.length : 0) >= count) break;
        }

        const key = p => p.offer_id || p.product_id;
        let results = dedupe(products, key);
        if (includeSponsored) results = results.concat(dedupe(sponsored, key));
        results = results.slice(0, count);
        console.error(`${results.length} products in ${totalCallsMade} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: API_ID, endpoint: '/shopping', query: args.query, includeSponsored, totalCalls: totalCallsMade });
        return;
    }

    // ── News / Images / Videos / Maps (page-number paginated) ─────────────────
    const paged = {
        '/news':   { pageSize: 10, maxPages: 20, resultsPath: 'data.news',   key: r => r.link,     label: 'articles' },
        '/images': { pageSize: 35, maxPages: 16, resultsPath: 'data.images', key: r => r.id || r.url, label: 'images' },
        '/videos': { pageSize: 35, maxPages: 4,  resultsPath: 'data.videos', key: r => r.id || r.link, label: 'videos' },
        '/maps':   { pageSize: 20, maxPages: null, resultsPath: 'data.places', key: r => r.place_id, label: 'places' },
    }[endpoint];
    if (!paged) {
        console.error(`Error: Unknown endpoint "${endpoint}". Use --help for available endpoints.`);
        process.exit(1);
    }

    const params = { ...base };
    let pageSize = paged.pageSize;
    let cap = paged.maxPages * pageSize;
    if (endpoint === '/news') {
        if (args.sortBy) params.sort_by = args.sortBy;
        if (args.timePeriod) params.time_period = args.timePeriod;
    } else if (endpoint === '/images') {
        if (args.size) params.size = args.size;
        if (args.color) params.color = args.color;
        if (args.type) params.type = args.type;
        if (args.aspectRatio) params.aspect_ratio = args.aspectRatio;
        if (args.people) params.people = args.people;
        if (args.timePeriod) params.time_period = args.timePeriod;
        if (args.usageRights) params.usage_rights = args.usageRights;
        if (args.safeSearch) params.safe_search = args.safeSearch;
    } else if (endpoint === '/videos') {
        if (args.duration) params.duration = args.duration;
        if (args.timePeriod) params.time_period = args.timePeriod;
        if (args.sourceSite) params.source_site = args.sourceSite;
        if (args.safeSearch) params.safe_search = args.safeSearch;
    } else if (endpoint === '/maps') {
        pageSize = Math.min(Math.max(parseInt(args.limit, 10) || 20, 1), 50);
        params.limit = pageSize;
        if (args.lat) params.lat = args.lat;
        if (args.lng) params.lng = args.lng;
        // page x limit must stay within 100
        cap = Math.floor(100 / pageSize) * pageSize;
    }
    const target = Math.min(count, cap);
    if (target < count) console.error(`Note: ${endpoint} serves at most ${cap} results per query; fetching up to ${target}.`);

    const { results: raw, totalCallsMade } = await fetchAll({
        host, endpoint, params, apiKey, count: target,
        pagination: 'page_number', pageParam: 'page', pageSize,
        resultsPath: paged.resultsPath, dryRun, delay: 300, maxCalls,
        apiId: API_ID,
    });
    const results = dedupe(raw, paged.key);

    console.error(`${results.length} ${paged.label} in ${totalCallsMade} call(s)${raw.length !== results.length ? ` (${raw.length - results.length} duplicates removed)` : ''}.`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: API_ID, endpoint, query: args.query, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
