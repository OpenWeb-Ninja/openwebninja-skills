'use strict';

const { pushWebhook, pushS3, pushFTP } = require('./lib/utils');
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Sample records to push
const records = [
    { name: 'Test Business 1', city: 'San Francisco', rating: 4.8, email: 'test1@example.com' },
    { name: 'Test Business 2', city: 'Los Angeles', rating: 4.2, email: 'test2@example.com' },
    { name: 'Test Business 3', city: 'New York', rating: 4.5, email: 'test3@example.com' },
];

async function testWebhook() {
    console.log('\n=== WEBHOOK TEST ===');
    const url = 'https://webhook.site/65593ad6-28a0-47cc-accd-51abb3a08265';
    try {
        // Test batch mode
        await pushWebhook(records, { url, batchMode: true });
        console.log('✓ Batch mode: OK');
        // Test per-record mode
        await pushWebhook(records.slice(0, 1), { url, batchMode: false });
        console.log('✓ Per-record mode: OK');
    } catch (e) {
        console.error('✗ Webhook failed:', e.message);
    }
}

async function testS3() {
    console.log('\n=== S3 TEST ===');
    const bucket = 'own-scraper-test-1774883969';
    const region = 'us-east-1';
    try {
        // Test JSON upload
        const jsonContent = JSON.stringify(records, null, 2);
        await pushS3(jsonContent, { bucket, key: 'test/records.json', region, contentType: 'application/json' });
        console.log('✓ JSON upload: OK');
        // Test CSV upload
        const csvContent = 'name,city,rating,email\n' + records.map(r => `${r.name},${r.city},${r.rating},${r.email}`).join('\n');
        await pushS3(csvContent, { bucket, key: 'test/records.csv', region, contentType: 'text/csv' });
        console.log('✓ CSV upload: OK');
    } catch (e) {
        console.error('✗ S3 failed:', e.message);
    }
}

async function testFTP() {
    console.log('\n=== FTP TEST ===');

    // Start local FTP server via python
    const ftpServer = spawn('python3', ['-c', `
import asyncio, os, tempfile
from pyftpdlib.handlers import FTPHandler
from pyftpdlib.servers import FTPServer
from pyftpdlib.authorizers import DummyAuthorizer

tmpdir = tempfile.mkdtemp()
auth = DummyAuthorizer()
auth.add_user('testuser', 'testpass', tmpdir, perm='elradfmwMT')
handler = FTPHandler
handler.authorizer = auth
handler.passive_ports = range(60000, 60100)
server = FTPServer(('127.0.0.1', 2121), handler)
print(f'FTP server running at 127.0.0.1:2121, root: {tmpdir}', flush=True)
server.serve_forever()
`], { stdio: ['ignore', 'pipe', 'pipe'] });

    // Wait for server to start
    await new Promise((resolve) => {
        ftpServer.stdout.on('data', (d) => {
            if (d.toString().includes('FTP server running')) {
                console.log('  Local FTP server started');
                resolve();
            }
        });
        setTimeout(resolve, 2000); // fallback
    });

    // Write a local test file
    const localFile = path.join('/tmp', 'ftp_test_records.json');
    fs.writeFileSync(localFile, JSON.stringify(records, null, 2));

    try {
        await pushFTP(localFile, {
            host: '127.0.0.1',
            port: 2121,
            user: 'testuser',
            pass: 'testpass',
            remotePath: '/ftp_test_records.json',
        });
        console.log('✓ FTP upload: OK');
    } catch (e) {
        console.error('✗ FTP failed:', e.message);
    } finally {
        ftpServer.kill();
        console.log('  Local FTP server stopped');
        fs.unlinkSync(localFile);
    }
}

async function main() {
    await testWebhook();
    await testS3();
    await testFTP();
    console.log('\n=== ALL TESTS COMPLETE ===\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
