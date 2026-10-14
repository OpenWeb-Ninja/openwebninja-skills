#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput } = require('../../lib/utils');
const path = require('path');

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Get the Google Search AI Overview for a query (text parts and reference links).

Required:
  --query         Search query (e.g. "what is the speed of light")

Optional:
  --country       Country/geo code, e.g. us, gb, de (default: us)
  --language      Language code, e.g. en, es, fr (default: en)
  --location      Location string the search originates from (e.g. "London, England, United Kingdom")
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --dry-run       Fetch data and print to console without saving
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

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const apiKey = getApiKey();
    const meta = loadMeta('ai-overviews');
    const host = meta.rapidapi_host || 'ai-overviews.p.rapidapi.com';
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `ai-overviews_${ts}.${format}`);

    if (!args.query) { console.error('Error: --query required. Use --help for usage.'); process.exit(1); }

    const params = { q: args.query, gl: args.country || 'us', hl: args.language || 'en' };
    if (args.location) params.location = args.location;

    const data = await apiCall(host, '/ai-overviews', params, apiKey, 'GET', null, 'ai-overviews');
    const records = data.data ? [data.data] : [data];
    if (data.data && data.data.search_returned_ai_overviews === false) console.error('Google returned no AI Overview for this query.');

    if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
    writeOutput(records, outputPath, format, { api: 'ai-overviews', endpoint: '/ai-overviews', query: args.query, totalCalls: 1 });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
