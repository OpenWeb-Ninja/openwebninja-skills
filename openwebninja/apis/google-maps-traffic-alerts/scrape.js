#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

const API_ID = 'google-maps-traffic-alerts';

function printHelp() {
    console.log(`
Usage: node scrape.js --bbox <bottom_left|top_right> [options]

Get live Google Maps traffic alerts (accidents, construction, road closures, slowdowns)
inside one or more bounding boxes.

Required:
  --bbox          Bounding box: "bottom_left_lat,bottom_left_lng|top_right_lat,top_right_lng"
                  Example: "40.63,-74.10|40.81,-73.87"
                  Several boxes: separate them with ";" (one call per box, alerts deduplicated)

Optional:
  --zoom          Google Maps zoom 11-16 (default: 13). Max box area per zoom:
                  11 = 8000 km2, 12 = 2000, 13 = 500, 14 = 125, 15 = 30, 16 = 8
  --type          Keep only alerts of this type (comma-separated, applied to the response)
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --dry-run       Print alerts to console only (first box only)
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
        if (arg.startsWith('--') && i + 1 < argv.length) {
            const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            args[key] = argv[++i];
        }
    }
    return args;
}

function parseBbox(bbox) {
    const parts = bbox.split('|');
    if (parts.length !== 2) { console.error('Error: --bbox format must be "bottom_left_lat,bottom_left_lng|top_right_lat,top_right_lng"'); process.exit(1); }
    return { bottom_left: parts[0].trim(), top_right: parts[1].trim() };
}

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    if (!args.bbox) { console.error('Error: --bbox required. Use --help for usage.'); process.exit(1); }
    const endpoint = args.endpoint || '/traffic-alerts';
    if (endpoint !== '/traffic-alerts') { console.error(`Error: Unknown endpoint "${endpoint}". Only /traffic-alerts exists.`); process.exit(1); }

    const apiKey = getApiKey();
    const meta = loadMeta(API_ID);
    const host = meta.rapidapi_host || 'google-maps-traffic-alerts.p.rapidapi.com';
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const delay = parseInt(args.delay, 10) || 300;
    const maxCalls = parseInt(args.maxCalls, 10) || 20;
    const types = args.type ? new Set(args.type.split(',').map(s => s.trim()).filter(Boolean)) : null;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `${API_ID}_${ts}.${format}`);

    const boxes = args.bbox.split(';').map(s => s.trim()).filter(Boolean).map(parseBbox);
    const toFetch = dryRun ? boxes.slice(0, 1) : boxes;
    if (toFetch.length > maxCalls) { console.error(`Error: ${toFetch.length} calls needed, limit is ${maxCalls}. Use --max-calls to raise.`); process.exit(1); }

    const records = [];
    const seen = new Set();
    for (let i = 0; i < toFetch.length; i++) {
        if (i > 0) await sleep(delay);
        const params = { ...toFetch[i] };
        if (args.zoom) params.zoom = parseInt(args.zoom, 10);
        console.error(`  Box ${i + 1}/${toFetch.length}: ${params.bottom_left} | ${params.top_right}`);
        const data = await apiCall(host, '/traffic-alerts', params, apiKey, 'GET', null, API_ID);
        const alerts = (data.data && data.data.alerts) || [];
        for (const a of alerts) {
            const key = `${a.type}|${a.latitude}|${a.longitude}`;
            if (seen.has(key)) continue;
            seen.add(key);
            if (types && !types.has(a.type)) continue;
            records.push(a);
        }
    }

    console.error(`${records.length} alert(s) in ${toFetch.length} call(s).`);
    if (dryRun) { console.log(JSON.stringify(records.slice(0, 10), null, 2)); return; }
    writeOutput(records, outputPath, format, { api: API_ID, endpoint, boxes: toFetch.length, zoom: args.zoom || 13, totalCalls: toFetch.length });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
