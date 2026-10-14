#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, fetchAll, toCSV, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search Costco products or get product details, and export results.

Required (varies by endpoint):
  --query           Search query (for /search, e.g. "Nike")
  --product-id      Costco item number (for /product-details, the item_number field from /search)

Optional:
  --endpoint        Endpoint: /search (default), /product-details
  --count           Max results to fetch (default: 30)
  --format          json | csv (default: json)
  --output          Output file path (auto-generated if omitted)
  --country         Country code (default: US)
  --language        Language code (default: en-US)
  --delivery-location  ZIP code (US) or postal code (CA) to scope availability to
  --dry-run         Fetch first page only, print to console
  --max-calls       Safety cap on API calls (default: 50)
  --help            Show this help
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
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
    const meta = loadMeta('realtime-costco-data');
    const host = meta.rapidapi_host || 'real-time-costco-data.p.rapidapi.com';
    const count = parseInt(args.count, 10) || 30;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const maxCalls = parseInt(args.maxCalls, 10) || 50;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `realtime-costco-data_${ts}.${format}`);

    // ── Product Details (single call, no pagination) ──────────────────────────
    if (endpoint === '/product-details') {
        if (!args.productId) { console.error('Error: --product-id required for /product-details'); process.exit(1); }
        const params = { product_id: args.productId, country: args.country || 'US', language: args.language || 'en-US' };
        if (args.deliveryLocation) params.delivery_location = args.deliveryLocation;
        const data = await apiCall(host, '/product-details', params, apiKey);
        const records = data.data ? [data.data] : [data];
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-costco-data', endpoint: '/product-details', productId: args.productId, totalCalls: 1 });
        return;
    }

    // ── Search (default, paginated) ───────────────────────────────────────────
    if (!args.query) { console.error('Error: --query required for /search. Use --help for usage.'); process.exit(1); }

    const params = { query: args.query, country: args.country || 'US', language: args.language || 'en-US' };
    if (args.deliveryLocation) params.delivery_location = args.deliveryLocation;

    // Offset-based pagination (param: start)
    const { results, totalCallsMade } = await fetchAll({
        host, endpoint: '/search', params, apiKey, count,
        pagination: 'offset', offsetParam: 'start', pageSize: 10,
        resultsPath: 'data.products', dryRun, delay: 300, maxCalls,
    });

    console.error(`${results.length} results in ${totalCallsMade} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: 'realtime-costco-data', endpoint: '/search', query: args.query, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
