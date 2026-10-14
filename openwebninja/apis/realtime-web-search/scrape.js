#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, fetchAll, toCSV, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

function printHelp() {
    console.log(`
Usage: node scrape.js --query <search> [options]

Search the web via Google and export results.

Required:
  --query         Search query (e.g. "best CRM software 2025")
  --queries       Bulk: up to 100 queries separated by "|" (for /search-light-bulk; --count = results per query)

Optional:
  --endpoint      Endpoint: /search (default), /search-light, /search-light-bulk, /people-also-ask, /ai-mode
  --count         Max results to fetch (default: 30; /search-light max 300)
  --format        json | csv (default: json)
  --output        Output file path (auto-generated if omitted)
  --country       Country/geo code, e.g. us, gb, de (default: us)
  --language      Language code, e.g. en, es, fr (default: en)
  --num           Results per page for /search (default: 10, max: 10)
  --tbs           Time-based search filter (e.g. qdr:d for past day, qdr:w for past week)
  --fetch-ai-overviews  true | false: include AI Overviews in /search results (default: false)
  --location      Location string for local results
  --device        desktop | mobile | tablet (default: desktop)
  --session-token Session token from a previous /ai-mode response (continue the conversation)
  --fetch-answers true | false: include answer + source per question (for /people-also-ask, default: true)
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

async function main() {
    const args = parseArgs(process.argv);
    if (args.help) { printHelp(); process.exit(0); }

    const endpoint = args.endpoint || '/search';
    const apiKey = getApiKey();
    const meta = loadMeta('realtime-web-search');
    const host = meta.rapidapi_host || 'real-time-web-search.p.rapidapi.com';
    const count = parseInt(args.count, 10) || 30;
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;
    const maxCalls = parseInt(args.maxCalls, 10) || 50;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `realtime-web-search_${ts}.${format}`);

    // ── AI Mode (single call, no pagination; POST with a JSON body) ──────────
    if (endpoint === '/ai-mode') {
        if (!args.query) { console.error('Error: --query required for /ai-mode'); process.exit(1); }
        const body = { prompt: args.query, gl: args.country || 'us', hl: args.language || 'en' };
        if (args.sessionToken) body.session_token = args.sessionToken;
        const data = await apiCall(host, '/ai-mode', {}, apiKey, 'POST', body, 'realtime-web-search');
        const records = data.data ? [data.data] : [data];
        if (dryRun) { console.log(JSON.stringify(records, null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-web-search', endpoint: '/ai-mode', totalCalls: 1 });
        return;
    }

    // ── AI Overviews moved to its own API ────────────────────────────────────
    if (endpoint === '/ai-overviews') {
        console.error('Error: /ai-overviews is not part of realtime-web-search v2. Use apis/ai-overviews/scrape.js, or /search with --fetch-ai-overviews true.');
        process.exit(1);
    }

    // ── People Also Ask (single call, no pagination) ─────────────────────────
    if (endpoint === '/people-also-ask') {
        if (!args.query) { console.error('Error: --query required for /people-also-ask'); process.exit(1); }
        const params = { q: args.query, gl: args.country || 'us', hl: args.language || 'en' };
        if (args.location) params.location = args.location;
        if (args.tbs) params.tbs = args.tbs;
        if (args.fetchAnswers) params.fetch_answers = args.fetchAnswers;
        const data = await apiCall(host, '/people-also-ask', params, apiKey, 'GET', null, 'realtime-web-search');
        const records = (data.data && Array.isArray(data.data.people_also_ask)) ? data.data.people_also_ask : (data.data ? [data.data] : [data]);
        if (dryRun) { console.log(JSON.stringify(records.slice(0, 5), null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-web-search', endpoint: '/people-also-ask', query: args.query, totalCalls: 1 });
        return;
    }

    // ── Search Light Bulk (one POST for up to 100 queries) ───────────────────
    if (endpoint === '/search-light-bulk') {
        const queries = (args.queries || args.query || '').split('|').map(q => q.trim()).filter(Boolean);
        if (!queries.length) { console.error('Error: --queries required for /search-light-bulk'); process.exit(1); }
        if (queries.length > 100) { console.error('Error: --queries accepts up to 100 queries'); process.exit(1); }
        const body = { queries, limit: Math.min(count, 300), gl: args.country || 'us', hl: args.language || 'en' };
        const data = await apiCall(host, '/search-light-bulk', {}, apiKey, 'POST', body, 'realtime-web-search');
        // One record per result, tagged with the query it belongs to
        const records = (Array.isArray(data.data) ? data.data : []).flatMap(g => (g.results || []).map(r => ({ query: g.query, ...r })));
        console.error(`${records.length} results for ${queries.length} queries in 1 call.`);
        if (dryRun) { console.log(JSON.stringify(records.slice(0, 5), null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-web-search', endpoint: '/search-light-bulk', queries, totalCalls: 1 });
        return;
    }

    // ── Light Search (single call, no pagination) ────────────────────────────
    if (endpoint === '/search-light') {
        if (!args.query) { console.error('Error: --query required for /search-light'); process.exit(1); }
        const params = { q: args.query, num: Math.min(count, 300), gl: args.country || 'us', hl: args.language || 'en' };
        const data = await apiCall(host, '/search-light', params, apiKey, 'GET', null, 'realtime-web-search');
        const records = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : [data]);
        if (dryRun) { console.log(JSON.stringify(records.slice(0, 5), null, 2)); return; }
        writeOutput(records, outputPath, format, { api: 'realtime-web-search', endpoint: '/search-light', query: args.query, totalCalls: 1 });
        return;
    }

    // ── Full Search (offset-based pagination) ────────────────────────────────
    if (!args.query) { console.error('Error: --query required. Use --help for usage.'); process.exit(1); }

    const numPerPage = Math.min(parseInt(args.num, 10) || 10, 10);
    const params = { q: args.query, num: numPerPage, gl: args.country || 'us', hl: args.language || 'en' };
    if (args.tbs) params.tbs = args.tbs;
    if (args.location) params.location = args.location;
    if (args.device) params.device = args.device;
    if (args.fetchAiOverviews) params.fetch_ai_overviews = args.fetchAiOverviews;

    // v2 pages through Google's own result offsets: `start` advances by `num` per page, but a
    // page can hold fewer than `num` organic results, so step by numPerPage (not by the number
    // of records returned, which would re-request overlapping results) and drop repeated URLs.
    const results = [];
    const seen = new Set();
    let totalCallsMade = 0;
    for (let start = 0; results.length < count; start += numPerPage) {
        if (totalCallsMade >= maxCalls) { console.error(`Cost cap reached: ${maxCalls} calls. Use --max-calls to raise.`); break; }
        if (totalCallsMade > 0) await sleep(300);
        totalCallsMade++;
        console.error(`  Offset ${start} (call ${totalCallsMade})`);
        const data = await apiCall(host, '/search', { ...params, start }, apiKey, 'GET', null, 'realtime-web-search');
        const records = (data.data && data.data.organic_results) || [];
        if (!records.length) { console.error('  No results, stopping.'); break; }
        for (const r of records) {
            if (r.url && seen.has(r.url)) continue;
            if (r.url) seen.add(r.url);
            results.push(r);
        }
        if (dryRun) break;
    }
    results.splice(count);

    console.error(`${results.length} results in ${totalCallsMade} call(s).`);
    if (dryRun) { console.log(JSON.stringify(results.slice(0, 5), null, 2)); return; }
    writeOutput(results, outputPath, format, { api: 'realtime-web-search', endpoint: '/search', query: args.query, totalCalls: totalCallsMade });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
