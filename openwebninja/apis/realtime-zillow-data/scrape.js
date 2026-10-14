#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, fetchAll, toCSV, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

function printHelp() {
    console.log(`
Usage: node scrape.js --location <place> [options]

Search Zillow real estate listings, get property details, and Zestimates.

Required (varies by endpoint):
  --location      Location string (for /search, e.g. "Los Angeles, CA"; for /agent-search a city-state slug, e.g. "new-york-ny")
  --encoded-zuid  Agent encodedZuid from /agent-search (for /agent-properties-for-sale, -sold, -for-rent)
  --zpid          Zillow property ID (for /zestimate; for /property-details pass --zpid or --url)
  --address       Full property address (for /property-details-address)
  --lat / --long  Coordinates (for /search-coordinates)
  --polygon       Polygon as "lng lat" pairs, longitude first (for /search-polygon)
                  e.g. "-118.50 34.03,-118.47 34.03,-118.47 34.00,-118.50 34.00"

Optional:
  --endpoint      Endpoint: /search (default), /search-coordinates, /search-polygon, /property-details, /property-details-address, /zestimate,
                  /agent-search, /agent-properties-for-sale, /agent-properties-sold, /agent-properties-for-rent
  --count         Max results to fetch (default: 82)
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --home-status   FOR_SALE (default), FOR_RENT, RECENTLY_SOLD
  --home-type     HOUSES, APARTMENTS, CONDOS, TOWNHOMES, etc.
  --sort          NEWEST, PRICE_LOW_TO_HIGH, PRICE_HIGH_TO_LOW, etc. (default: DEFAULT)
  --min-price     Min price filter
  --max-price     Max price filter
  --min-bedrooms  Min bedrooms
  --max-bedrooms  Max bedrooms
  --min-bathrooms Min bathrooms
  --max-bathrooms Max bathrooms
  --min-sqft      Min square footage
  --max-sqft      Max square footage
  --min-lot-size  Min lot size
  --max-lot-size  Max lot size
  --listing-type  BY_AGENT (default), BY_OWNER
  --max-hoa-fee   Max HOA fee
  --diameter      Search radius in miles (for /search-coordinates, default: 1)
  --name          Filter agents by name (for /agent-search)
  --include-team  true | false: include the agent's team listings (for /agent-properties-for-sale, -for-rent; default: true)
  --url           Zillow property URL (for /property-details instead of --zpid, optional for /zestimate)
  --dry-run       Fetch first page only, print to console
  --max-calls     Safety cap on API calls (default: 50)
  --help          Show this help
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

function addSearchFilters(params, args) {
    if (args.homeStatus) params.home_status = args.homeStatus;
    if (args.homeType) params.home_type = args.homeType;
    if (args.sort) params.sort = args.sort;
    if (args.minPrice) params.min_price = args.minPrice;
    if (args.maxPrice) params.max_price = args.maxPrice;
    if (args.minBedrooms) params.min_bedrooms = args.minBedrooms;
    if (args.maxBedrooms) params.max_bedrooms = args.maxBedrooms;
    if (args.minBathrooms) params.min_bathrooms = args.minBathrooms;
    if (args.maxBathrooms) params.max_bathrooms = args.maxBathrooms;
    if (args.minSqft) params.min_sqft = args.minSqft;
    if (args.maxSqft) params.max_sqft = args.maxSqft;
    if (args.minLotSize) params.min_lot_size = args.minLotSize;
    if (args.maxLotSize) params.max_lot_size = args.maxLotSize;
    if (args.listingType) params.listing_type = args.listingType;
    if (args.maxHoaFee) params.max_hoa_fee = args.maxHoaFee;
    if (args.spaceType) params.space_type = args.spaceType;
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta('realtime-zillow-data');
    const host = meta.rapidapi_host || 'real-time-real-estate-data.p.rapidapi.com';
    const count = parseInt(args.count, 10) || 82;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const maxCalls = parseInt(args.maxCalls, 10) || 50;
    const pageSize = 41; // fixed ~41 results per page

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `realtime-zillow-data_${ts}.${format}`);

    // ── Property Details by ZPID or URL (single call) ─────────────────────────
    if (endpoint === '/property-details') {
        if (!args.zpid && !args.url) { console.error('Error: --zpid or --url required for /property-details'); process.exit(1); }
        const params = {};
        if (args.zpid) params.zpid = args.zpid;
        if (args.url) params.url = args.url;
        const data = await apiCall(host, '/property-details', params, apiKey);
        const records = data.data ? [data.data] : [data];
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/property-details', totalCalls: 1 });
        return;
    }

    // ── Property Details by Address (single call) ─────────────────────────────
    if (endpoint === '/property-details-address') {
        if (!args.address) { console.error('Error: --address required for /property-details-address'); process.exit(1); }
        const params = { address: args.address };
        const data = await apiCall(host, '/property-details-address', params, apiKey);
        const records = data.data ? [data.data] : [data];
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/property-details-address', totalCalls: 1 });
        return;
    }

    // ── Zestimate (single call) ───────────────────────────────────────────────
    if (endpoint === '/zestimate') {
        if (!args.zpid) { console.error('Error: --zpid required for /zestimate'); process.exit(1); }
        const params = { zpid: args.zpid };
        if (args.url) params.url = args.url;
        const data = await apiCall(host, '/zestimate', params, apiKey);
        const records = data.data ? [data.data] : [data];
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/zestimate', totalCalls: 1 });
        return;
    }

    // ── Agent Search (paginated, up to 15 agents per page) ────────────────────
    if (endpoint === '/agent-search') {
        if (!args.location) { console.error('Error: --location required for /agent-search (e.g. "new-york-ny")'); process.exit(1); }
        const params = { location: args.location };
        if (args.name) params.name = args.name;
        const { results, totalCallsMade } = await fetchAll({
            host, endpoint: '/agent-search', params, apiKey, count,
            pagination: 'page_number', pageParam: 'page', pageSize: 15,
            resultsPath: 'data.agents', dryRun, delay: 300, maxCalls,
        });
        console.error(`${results.length} agents in ${totalCallsMade} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/agent-search', location: args.location, totalCalls: totalCallsMade });
        return;
    }

    // ── Agent Properties: for sale / sold / for rent (paginated, up to 5 per page) ──
    const agentResultsPath = {
        '/agent-properties-for-sale': 'data.listings',
        '/agent-properties-for-rent': 'data.listings',
        '/agent-properties-sold': 'data.sold_properties',
    };
    if (agentResultsPath[endpoint]) {
        if (!args.encodedZuid) { console.error(`Error: --encoded-zuid required for ${endpoint} (from /agent-search)`); process.exit(1); }
        const params = { encodedZuid: args.encodedZuid };
        if (args.includeTeam && endpoint !== '/agent-properties-sold') params.include_team = args.includeTeam;
        const { results, totalCallsMade } = await fetchAll({
            host, endpoint, params, apiKey, count,
            pagination: 'page_number', pageParam: 'page', pageSize: 5,
            resultsPath: agentResultsPath[endpoint], dryRun, delay: 300, maxCalls,
        });
        console.error(`${results.length} properties in ${totalCallsMade} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 3), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: 'realtime-zillow-data', endpoint, encodedZuid: args.encodedZuid, totalCalls: totalCallsMade });
        return;
    }

    // ── Search by Coordinates (paginated) ─────────────────────────────────────
    if (endpoint === '/search-coordinates') {
        if (!args.lat || !args.long) { console.error('Error: --lat and --long required for /search-coordinates'); process.exit(1); }
        const params = { lat: args.lat, long: args.long };
        if (args.diameter) params.diameter = args.diameter;
        addSearchFilters(params, args);

        const { results, totalCallsMade } = await fetchAll({
            host, endpoint: '/search-coordinates', params, apiKey, count,
            pagination: 'page_number', pageParam: 'page', pageSize,
            resultsPath: 'data', dryRun, delay: 300, maxCalls,
        });
        console.error(`${results.length} properties in ${totalCallsMade} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/search-coordinates', totalCalls: totalCallsMade });
        return;
    }

    // ── Search by Polygon (paginated) ─────────────────────────────────────────
    if (endpoint === '/search-polygon') {
        if (!args.polygon) { console.error('Error: --polygon required for /search-polygon'); process.exit(1); }
        const params = { polygon: args.polygon };
        addSearchFilters(params, args);

        const { results, totalCallsMade } = await fetchAll({
            host, endpoint: '/search-polygon', params, apiKey, count,
            pagination: 'page_number', pageParam: 'page', pageSize,
            resultsPath: 'data', dryRun, delay: 300, maxCalls,
        });
        console.error(`${results.length} properties in ${totalCallsMade} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
        writeOutput(results, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/search-polygon', totalCalls: totalCallsMade });
        return;
    }

    // ── Search by Location (default, paginated) ──────────────────────────────
    if (!args.location) { console.error('Error: --location required for /search. Use --help for usage.'); process.exit(1); }

    const params = { location: args.location };
    addSearchFilters(params, args);

    const { results, totalCallsMade } = await fetchAll({
        host, endpoint: '/search', params, apiKey, count,
        pagination: 'page_number', pageParam: 'page', pageSize,
        resultsPath: 'data', dryRun, delay: 300, maxCalls,
    });

    console.error(`${results.length} properties in ${totalCallsMade} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: 'realtime-zillow-data', endpoint: '/search', location: args.location, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
