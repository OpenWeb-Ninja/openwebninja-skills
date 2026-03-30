'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SKILL_ROOT = path.resolve(__dirname, '..');

// ─── Credentials ──────────────────────────────────────────────────────────────

function getApiKey() {
    const key = process.env.OPENWEBNINJA_API_KEY || process.env.RAPIDAPI_KEY;
    if (!key) {
        console.error('Error: OPENWEBNINJA_API_KEY (or RAPIDAPI_KEY) env var is required.');
        process.exit(1);
    }
    return key;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

function loadMeta(apiId) {
    const metaPath = path.join(SKILL_ROOT, 'apis', apiId, 'meta.json');
    try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        if (meta.last_updated_yaml && meta.update_interval_seconds) {
            const ageSeconds = (Date.now() - new Date(meta.last_updated_yaml).getTime()) / 1000;
            if (ageSeconds > meta.update_interval_seconds) {
                const ageDays = Math.round(ageSeconds / 86400);
                console.error(`Warning: YAML spec for "${apiId}" is ${ageDays}d old. Run: node scripts/refresh_yamls.js --api ${apiId}`);
            }
        }
        return meta;
    } catch (e) {
        return {};
    }
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function isOpenWebNinjaKey(apiKey) {
    return apiKey && apiKey.startsWith('ak_');
}

function resolveOwnSlug(host) {
    // Find the OWN slug by reading the YAML spec's servers[0].url for the matching API.
    // The YAML server URL is the source of truth (e.g. https://api.openwebninja.com/realtime-events-data).
    // meta.json api_id can differ from the actual OWN slug, so we parse the YAML.
    const apisDir = path.join(SKILL_ROOT, 'apis');
    try {
        for (const dir of fs.readdirSync(apisDir)) {
            const metaPath = path.join(apisDir, dir, 'meta.json');
            if (fs.existsSync(metaPath)) {
                const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                if (meta.rapidapi_host === host) {
                    // Try to extract slug from YAML server URL
                    const yamlFiles = fs.readdirSync(path.join(apisDir, dir)).filter(f => f.endsWith('.yaml'));
                    if (yamlFiles.length > 0) {
                        const yaml = fs.readFileSync(path.join(apisDir, dir, yamlFiles[0]), 'utf8');
                        const match = yaml.match(/url:\s*https:\/\/api\.openwebninja\.com\/([^\s\n]+)/);
                        if (match) return match[1];
                    }
                    // Fallback to api_id
                    return meta.api_id || dir;
                }
            }
        }
    } catch (e) { /* fallback */ }
    // Fallback: strip .p.rapidapi.com
    return host.replace('.p.rapidapi.com', '');
}

function apiCall(host, endpoint, params, apiKey, method = 'GET', body = null) {
    const useOWN = isOpenWebNinjaKey(apiKey);
    const actualHost = useOWN ? 'api.openwebninja.com' : host;
    const slug = useOWN ? resolveOwnSlug(host) : null;
    const actualEndpoint = useOWN ? `/${slug}${endpoint}` : endpoint;

    const url = new URL(`https://${actualHost}${actualEndpoint}`);

    if (method === 'GET') {
        for (const [k, v] of Object.entries(params || {})) {
            if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        }
    }

    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null;
        const headers = useOWN
            ? { 'x-api-key': apiKey }
            : { 'x-rapidapi-host': host, 'x-rapidapi-key': apiKey };
        if (bodyStr) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname + url.search,
            method,
            headers,
        };

        const req = https.request(options, res => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8');
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 300)}`));
                }
                try {
                    resolve(JSON.parse(raw));
                } catch (e) {
                    reject(new Error(`JSON parse error: ${raw.slice(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getNestedValue(obj, dotPath) {
    if (!dotPath) return obj;
    return dotPath.split('.').reduce((cur, key) => (cur && cur[key] !== undefined ? cur[key] : undefined), obj);
}

function collectRecords(data, resultsPath, callNum) {
    const records = getNestedValue(data, resultsPath);
    if (Array.isArray(records)) return records;
    if (callNum === 1) return [data];
    return [];
}

// ─── Output ───────────────────────────────────────────────────────────────────

function flattenRecord(obj, prefix) {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        const key = prefix ? `${prefix}_${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
            Object.assign(result, flattenRecord(v, key));
        } else {
            result[key] = Array.isArray(v) ? JSON.stringify(v) : v;
        }
    }
    return result;
}

function toCSV(records) {
    if (!records.length) return '';
    const flat = records.map(r => (typeof r === 'object' && r !== null ? flattenRecord(r, '') : { value: r }));
    const keys = [...new Set(flat.flatMap(r => Object.keys(r)))];
    const escape = v => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [keys.join(','), ...flat.map(r => keys.map(k => escape(r[k])).join(','))].join('\n');
}

function writeOutput(records, outputPath, format, manifest) {
    if (!outputPath) {
        displayQuickAnswer(records);
        return;
    }
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const content = format === 'csv' ? toCSV(records) : JSON.stringify(records, null, 2);
    fs.writeFileSync(outputPath, content);
    if (manifest) {
        fs.writeFileSync(outputPath + '.meta.json', JSON.stringify({ ...manifest, recordCount: records.length, completedAt: new Date().toISOString() }, null, 2));
    }
    console.error(`\nDone. ${records.length} records → ${outputPath}`);
}

// ─── Pagination ───────────────────────────────────────────────────────────────

async function fetchAll({ host, endpoint, params, apiKey, count, pagination, pageSize, pageParam, offsetParam, cursorParam, cursorPath, resultsPath, dryRun, delay, maxCalls }) {
    const allResults = [];
    let totalCallsMade = 0;

    function call(p) {
        totalCallsMade++;
        if (totalCallsMade > maxCalls) throw new Error(`Cost cap exceeded: ${totalCallsMade} calls, limit is ${maxCalls}. Use --max-calls to raise.`);
        return apiCall(host, endpoint, p, apiKey);
    }

    if (pagination === 'none') {
        console.error('  Call 1 (single response, no pagination)');
        const data = await call(params);
        allResults.push(...collectRecords(data, resultsPath, 1));

    } else if (pagination === 'page_number') {
        const totalPages = dryRun ? 1 : Math.ceil(count / pageSize);
        console.error(`Fetching up to ${count} results across up to ${totalPages} page(s)...`);
        for (let page = 1; page <= totalPages; page++) {
            if (page > 1) await sleep(delay);
            console.error(`  Page ${page}/${totalPages} (call ${totalCallsMade + 1})`);
            const data = await call({ ...params, [pageParam]: page });
            const records = collectRecords(data, resultsPath, page);
            if (!records.length) { console.error('  No results, stopping early.'); break; }
            allResults.push(...records);
            if (allResults.length >= count) break;
            const totalPagesInResponse = getNestedValue(data, 'num_pages');
            if (totalPagesInResponse && page >= Number(totalPagesInResponse)) break;
        }

    } else if (pagination === 'offset') {
        let offset = 0, callNum = 0;
        console.error(`Fetching up to ${count} results (offset-based, param: ${offsetParam})...`);
        while (allResults.length < count) {
            if (callNum > 0) await sleep(delay);
            callNum++;
            console.error(`  Offset ${offset} (call ${totalCallsMade + 1})`);
            const data = await call({ ...params, [offsetParam]: offset });
            const records = collectRecords(data, resultsPath, callNum);
            if (!records.length) { console.error('  No results, stopping.'); break; }
            allResults.push(...records);
            offset += records.length;
            if (dryRun) break;
        }

    } else if (pagination === 'cursor') {
        let cursor = null, callNum = 0;
        console.error(`Fetching up to ${count} results (cursor-based, param: ${cursorParam})...`);
        while (allResults.length < count) {
            if (callNum > 0) await sleep(delay);
            callNum++;
            console.error(`  Cursor call ${callNum} (call ${totalCallsMade + 1})`);
            const p = { ...params };
            if (cursor !== null) p[cursorParam] = cursor;
            const data = await call(p);
            const records = collectRecords(data, resultsPath, callNum);
            if (!records.length) { console.error('  No results, stopping.'); break; }
            allResults.push(...records);
            cursor = getNestedValue(data, cursorPath) || null;
            if (!cursor) { console.error('  No next cursor, stopping.'); break; }
            if (dryRun) break;
        }

    } else {
        throw new Error(`Unknown pagination style "${pagination}". Use: page_number | offset | cursor | none`);
    }

    return { results: allResults.slice(0, count), totalCallsMade };
}

// ─── Quick Answer ─────────────────────────────────────────────────────────────

function displayQuickAnswer(records, { limit = 5, fields } = {}) {
    if (!records.length) { console.log('\nNo results found.'); return; }
    const top = records.slice(0, limit);
    const pick = fields || Object.keys(top[0]).filter(k => {
        const v = top[0][k];
        return v !== null && v !== undefined && !(Array.isArray(v) && !v.length);
    }).slice(0, 10);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`TOP ${top.length} RESULTS (of ${records.length} total)`);
    console.log('='.repeat(60));

    for (let i = 0; i < top.length; i++) {
        console.log(`\n--- Result ${i + 1} ---`);
        for (const key of pick) {
            let val = top[i][key];
            if (val === null || val === undefined) continue;
            if (typeof val === 'string' && val.length > 120) val = val.slice(0, 120) + '...';
            else if (typeof val === 'object') {
                const s = JSON.stringify(val);
                val = s.length > 120 ? s.slice(0, 120) + '...' : s;
            }
            console.log(`  ${key}: ${val}`);
        }
    }
    console.log(`\n${'='.repeat(60)}`);
    if (records.length > limit) console.log(`Showing ${limit} of ${records.length} results. Use --output to save all.`);
}

// ─── Output Destinations ──────────────────────────────────────────────────────

/**
 * POST records to a webhook URL.
 * batchMode=true  → single POST with { records }
 * batchMode=false → one POST per record, with `delay` ms between requests
 */
async function pushWebhook(records, { url, batchMode = true, delay = 200 } = {}) {
    const target = url || process.env.WEBHOOK_URL;
    if (!target) throw new Error('pushWebhook: url is required (or set WEBHOOK_URL env var)');

    function post(payload) {
        return new Promise((resolve, reject) => {
            const body = JSON.stringify(payload);
            const parsed = new URL(target);
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || 443,
                path: parsed.pathname + parsed.search,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            };
            const mod = parsed.protocol === 'http:' ? require('http') : https;
            const req = mod.request(options, res => {
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return reject(new Error(`pushWebhook: HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString('utf8').slice(0, 200)}`));
                    }
                    resolve();
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    if (batchMode) {
        console.error(`pushWebhook: sending ${records.length} records in one batch → ${target}`);
        await post({ records });
        console.error('pushWebhook: done');
    } else {
        console.error(`pushWebhook: sending ${records.length} records individually → ${target}`);
        for (let i = 0; i < records.length; i++) {
            if (i > 0) await sleep(delay);
            await post(records[i]);
            console.error(`pushWebhook: sent ${i + 1}/${records.length}`);
        }
        console.error('pushWebhook: done');
    }
}

/**
 * Push records to an Airtable table.
 * Batches up to 10 records per request (Airtable limit).
 */
async function pushAirtable(records, { apiKey, baseId, tableName, delay = 200 } = {}) {
    const key      = apiKey    || process.env.AIRTABLE_API_KEY;
    const base     = baseId    || process.env.AIRTABLE_BASE_ID;
    const table    = tableName || process.env.AIRTABLE_TABLE_NAME;
    if (!key)   throw new Error('pushAirtable: apiKey is required (or set AIRTABLE_API_KEY)');
    if (!base)  throw new Error('pushAirtable: baseId is required (or set AIRTABLE_BASE_ID)');
    if (!table) throw new Error('pushAirtable: tableName is required (or set AIRTABLE_TABLE_NAME)');

    const encodedTable = encodeURIComponent(table);

    function postBatch(batch) {
        return new Promise((resolve, reject) => {
            const payload = { records: batch.map(r => ({ fields: r })) };
            const body = JSON.stringify(payload);
            const options = {
                hostname: 'api.airtable.com',
                port: 443,
                path: `/v0/${base}/${encodedTable}`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                },
            };
            const req = https.request(options, res => {
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return reject(new Error(`pushAirtable: HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString('utf8').slice(0, 200)}`));
                    }
                    resolve();
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    const BATCH = 10;
    const batches = Math.ceil(records.length / BATCH);
    console.error(`pushAirtable: sending ${records.length} records in ${batches} batch(es) → ${base}/${table}`);
    for (let i = 0; i < batches; i++) {
        if (i > 0) await sleep(delay);
        const chunk = records.slice(i * BATCH, (i + 1) * BATCH);
        await postBatch(chunk);
        console.error(`pushAirtable: batch ${i + 1}/${batches} done`);
    }
    console.error('pushAirtable: done');
}

/**
 * Post a message to a Slack Incoming Webhook.
 */
function postSlack(message, { webhookUrl } = {}) {
    const target = webhookUrl || process.env.SLACK_WEBHOOK_URL;
    if (!target) throw new Error('postSlack: webhookUrl is required (or set SLACK_WEBHOOK_URL env var)');

    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ text: message });
        const parsed = new URL(target);
        const options = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.pathname + parsed.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`postSlack: HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString('utf8').slice(0, 200)}`));
                }
                resolve();
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

/**
 * Format and post a standard scrape-completion summary to Slack.
 */
async function slackSummary(records, outputPath, opts = {}) {
    const lines = [
        `*Scrape complete*`,
        `• Records: ${records.length}`,
        outputPath ? `• Output: \`${outputPath}\`` : '• Output: stdout',
        `• Finished: ${new Date().toISOString()}`,
    ];
    await postSlack(lines.join('\n'), opts);
}

/**
 * Upload string content (JSON or CSV) to S3.
 * Requires: npm install @aws-sdk/client-s3
 */
async function pushS3(content, { bucket, key, region, contentType = 'application/json' } = {}) {
    let S3Client, PutObjectCommand;
    try {
        ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
    } catch {
        throw new Error('pushS3: Run: npm install @aws-sdk/client-s3');
    }

    const b  = bucket || process.env.S3_BUCKET;
    const k  = key    || process.env.S3_KEY;
    const r  = region || process.env.AWS_REGION;
    if (!b) throw new Error('pushS3: bucket is required (or set S3_BUCKET)');
    if (!k) throw new Error('pushS3: key is required (or set S3_KEY)');
    if (!r) throw new Error('pushS3: region is required (or set AWS_REGION)');

    const clientOpts = { region: r };
    const accessKeyId     = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    if (accessKeyId && secretAccessKey) {
        clientOpts.credentials = { accessKeyId, secretAccessKey };
    }

    const client = new S3Client(clientOpts);
    console.error(`pushS3: uploading to s3://${b}/${k} (${r})`);
    await client.send(new PutObjectCommand({
        Bucket: b,
        Key: k,
        Body: content,
        ContentType: contentType,
    }));
    console.error('pushS3: done');
}

/**
 * Upload a local file to an FTP server.
 * Requires: npm install basic-ftp
 */
async function pushFTP(localFilePath, { host, user, pass, remotePath } = {}) {
    let ftp;
    try {
        ftp = require('basic-ftp');
    } catch {
        throw new Error('pushFTP: Run: npm install basic-ftp');
    }

    const h = host       || process.env.FTP_HOST;
    const u = user       || process.env.FTP_USER;
    const p = pass       || process.env.FTP_PASS;
    const r = remotePath || process.env.FTP_PATH;
    if (!h) throw new Error('pushFTP: host is required (or set FTP_HOST)');
    if (!u) throw new Error('pushFTP: user is required (or set FTP_USER)');
    if (!p) throw new Error('pushFTP: pass is required (or set FTP_PASS)');
    if (!r) throw new Error('pushFTP: remotePath is required (or set FTP_PATH)');

    const client = new ftp.Client();
    try {
        console.error(`pushFTP: connecting to ${h}`);
        await client.access({ host: h, user: u, password: p, secure: false });
        console.error(`pushFTP: uploading ${localFilePath} → ${r}`);
        await client.uploadFrom(localFilePath, r);
        console.error('pushFTP: done');
    } finally {
        client.close();
    }
}

/**
 * Write records to a Google Sheet (clears existing content first).
 * Requires: npm install googleapis
 */
async function pushGoogleSheets(records, { credentialsPath, spreadsheetId, sheetName } = {}) {
    let google;
    try {
        ({ google } = require('googleapis'));
    } catch {
        throw new Error('pushGoogleSheets: Run: npm install googleapis');
    }

    const credsPath = credentialsPath || process.env.GOOGLE_CLIENT_CREDENTIALS;
    const ssId      = spreadsheetId   || process.env.SPREADSHEET_ID;
    const sheet     = sheetName       || process.env.SHEET_NAME;
    if (!credsPath) throw new Error('pushGoogleSheets: credentialsPath is required (or set GOOGLE_CLIENT_CREDENTIALS)');
    if (!ssId)      throw new Error('pushGoogleSheets: spreadsheetId is required (or set SPREADSHEET_ID)');
    if (!sheet)     throw new Error('pushGoogleSheets: sheetName is required (or set SHEET_NAME)');

    const credentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (!records.length) {
        console.error('pushGoogleSheets: no records to write');
        return;
    }

    const flat = records.map(r => (typeof r === 'object' && r !== null ? flattenRecord(r, '') : { value: r }));
    const headers = [...new Set(flat.flatMap(r => Object.keys(r)))];
    const rows = flat.map(r => headers.map(h => {
        const v = r[h];
        return (v === null || v === undefined) ? '' : String(v);
    }));
    const values = [headers, ...rows];

    const range = `${sheet}!A1`;
    console.error(`pushGoogleSheets: writing ${records.length} records to "${sheet}" in ${ssId}`);
    await sheets.spreadsheets.values.update({
        spreadsheetId: ssId,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
    });
    console.error('pushGoogleSheets: done');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { getApiKey, loadMeta, apiCall, sleep, getNestedValue, collectRecords, flattenRecord, toCSV, writeOutput, displayQuickAnswer, fetchAll, pushWebhook, pushAirtable, postSlack, slackSummary, pushS3, pushFTP, pushGoogleSheets };
