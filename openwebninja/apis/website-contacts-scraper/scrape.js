#!/usr/bin/env node
'use strict';

const { getApiKey, loadMeta, apiCall, fetchAll, toCSV, writeOutput, sleep } = require('../../lib/utils');
const path = require('path');

function printHelp() {
    console.log(`
Usage: node scrape.js --domain <domain> [options]

Scrape contact information (emails, phones, social profiles) from websites.

Required (one of):
  --domain            Single domain to scrape (e.g. "openwebninja.com")
  --domains           Comma-separated list of domains (max 20 per batch)
  --keywords          Company names / keywords separated by "|" (for /website-url-by-keyword, max 20 per batch)

Optional:
  --endpoint          Endpoint: /scrape-contacts (default), /website-url-by-keyword
  --limit             Website URLs per keyword, 1-50 (for /website-url-by-keyword, default: 1)
  --format            json | csv (default: json)
  --output            Output file path (auto-generated if omitted)
  --match-email       Only return emails matching the domain (default: false)
  --external-matching Enable external matching (default: false)
  --dry-run           Fetch and print to console without writing a file
  --help              Show this help
`);
}

function parseArgs(argv) {
    const args = {};
    for (let i = 2; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--help') { args.help = true; continue; }
        if (arg === '--dry-run') { args.dryRun = true; continue; }
        if (arg === '--match-email') { args.matchEmail = true; continue; }
        if (arg === '--external-matching') { args.externalMatching = true; continue; }
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
    const meta = loadMeta('website-contacts-scraper');
    const host = meta.rapidapi_host || 'website-contacts-scraper.p.rapidapi.com';
    const format = args.format || 'json';
    const dryRun = !!args.dryRun;

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = args.output || path.join('output', `website-contacts_${ts}.${format}`);

    // ── Website URL by keyword (POST, up to 20 keywords per call) ─────────────
    if (args.endpoint === '/website-url-by-keyword') {
        const keywords = (args.keywords || '').split('|').map(k => k.trim()).filter(Boolean);
        if (!keywords.length) { console.error('Error: --keywords required for /website-url-by-keyword'); process.exit(1); }
        const limit = parseInt(args.limit, 10) || 1;
        const results = [];
        let calls = 0;
        for (let i = 0; i < keywords.length; i += 20) {
            if (i > 0) await sleep(300);
            calls++;
            const batch = keywords.slice(i, i + 20);
            console.error(`  Batch ${calls}: ${batch.length} keyword(s)`);
            const data = await apiCall(host, '/website-url-by-keyword', {}, apiKey, 'POST', { keywords: batch, limit });
            // data is keyed by keyword: a URL string when limit=1, an array of URLs when limit>1; no-match keywords are omitted
            for (const k of batch) {
                const v = data.data ? data.data[k] : undefined;
                results.push({ keyword: k, websites: v === undefined ? [] : (Array.isArray(v) ? v : [v]) });
            }
            if (dryRun) break;
        }
        console.error(`${results.filter(r => r.websites.length).length}/${results.length} keyword(s) matched in ${calls} call(s).`);
        if (dryRun) { console.log(JSON.stringify(results, null, 2)); return; }
        writeOutput(results, outputPath, format, { api: 'website-contacts-scraper', endpoint: '/website-url-by-keyword', totalCalls: calls });
        return;
    }

    // Build domain list
    let domainList = [];
    if (args.domains) {
        domainList = args.domains.split(',').map(d => d.trim()).filter(Boolean);
    } else if (args.domain) {
        domainList = [args.domain.trim()];
    } else {
        console.error('Error: --domain or --domains required. Use --help for usage.');
        process.exit(1);
    }

    // The API accepts up to 20 domains per call via comma-separated query param
    const allResults = [];
    const batchSize = 20;
    let totalCalls = 0;

    for (let i = 0; i < domainList.length; i += batchSize) {
        if (i > 0) await sleep(300);
        const batch = domainList.slice(i, i + batchSize);
        const query = batch.join(',');
        totalCalls++;

        console.error(`  Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} domain(s) (call ${totalCalls})`);

        const params = { query };
        if (args.matchEmail) params.match_email_domain = true;
        if (args.externalMatching) params.external_matching = true;

        try {
            const data = await apiCall(host, '/scrape-contacts', params, apiKey);
            const records = data.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [data];
            allResults.push(...records);
        } catch (e) {
            console.error(`    Error: ${e.message}`);
        }

        if (dryRun) break;
    }

    console.error(`${allResults.length} result(s) in ${totalCalls} call(s).`);
    if (dryRun) { console.log(JSON.stringify(allResults, null, 2)); return; }
    writeOutput(allResults, outputPath, format, { api: 'website-contacts-scraper', endpoint: '/scrape-contacts', totalCalls });
}

main().catch(e => { console.error(`Fatal: ${e.message}`); process.exit(1); });
