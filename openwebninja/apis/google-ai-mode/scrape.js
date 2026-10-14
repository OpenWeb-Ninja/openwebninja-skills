#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, writeOutput } = require('../../lib/utils');
const path = require('path');

function printHelp() {
    console.log(`
Usage: node scrape.js --query <prompt> [options]

Ask Google AI Mode a prompt and get structured reply parts and reference links.

Required:
  --query         AI Mode prompt (e.g. "How to make a pizza step by step?")

Optional:
  --session-token Session token from a previous response (continue the conversation)
  --country       Country/geo code, e.g. us, gb, de (default: us)
  --language      Language code, e.g. en, es, fr (default: en)
  --location      Location the prompt originates from (e.g. "London, England, United Kingdom")
  --attachments   Comma-separated PDF URLs to attach (up to 5, 10 MB each; sent with POST)
  --method        GET | POST (default: GET; POST has no URL length limit, use it for long prompts)
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
    const meta = loadMeta('google-ai-mode');
    const host = meta.rapidapi_host || 'google-ai-mode.p.rapidapi.com';
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `google-ai-mode_${ts}.${format}`);

    if (!args.query) { console.error('Error: --query required. Use --help for usage.'); process.exit(1); }

    const params = { prompt: args.query, gl: args.country || 'us', hl: args.language || 'en' };
    if (args.sessionToken) params.session_token = args.sessionToken;
    if (args.location) params.location = args.location;

    const usePost = (args.method || '').toUpperCase() === 'POST' || !!args.attachments;
    let data;
    if (usePost) {
        const body = { ...params };
        if (args.attachments) body.attachments = args.attachments.split(',').map(s => s.trim()).filter(Boolean);
        data = await apiCall(host, '/ai-mode', {}, apiKey, 'POST', body, 'google-ai-mode');
    } else {
        data = await apiCall(host, '/ai-mode', params, apiKey, 'GET', null, 'google-ai-mode');
    }
    const records = data.data ? [data.data] : [data];

    if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
    writeOutput(records, outputPath, format, { api: 'google-ai-mode', endpoint: '/ai-mode', method: usePost ? 'POST' : 'GET', totalCalls: 1 });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
