/**
 * Google Drive integration (service-account, read-only).
 *
 * Env vars:
 *   GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON  — full service account JSON, stringified
 *   GOOGLE_DRIVE_FOLDER_ID             — ID of the folder to sync (flat, non-recursive)
 *
 * Test mode (NODE_ENV=test) reads fixture data from a JSON file — no Drive calls.
 * Fixtures path: process.env.DRIVE_TEST_FIXTURES_FILE, default ./tests/fixtures/drive-fixtures.json
 *
 * Fixture file shape:
 * {
 *   "startPageToken": "1",
 *   "changes": { "<prevToken>": { "files": [...], "newPageToken": "..." } },
 *   "folderFiles": [{ "id", "name", "mimeType", "size" }, ...],
 *   "fileBodies": { "<id>": "base64string" }
 * }
 */

const fs = require('fs');
const path = require('path');
const { PDF_MIME, DOCX_MIME } = require('./cvTextExtract');

const SUPPORTED_MIMES = new Set([PDF_MIME, DOCX_MIME]);
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

function isTestMode() {
    return process.env.NODE_ENV === 'test';
}

function loadFixtures() {
    const p = process.env.DRIVE_TEST_FIXTURES_FILE
        || path.join(__dirname, '..', 'tests', 'fixtures', 'drive-fixtures.json');
    if (!fs.existsSync(p)) {
        return { startPageToken: '1', changes: {}, folderFiles: [], fileBodies: {} };
    }
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function getDriveClient() {
    if (isTestMode()) return null;
    const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
        throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not configured');
    }
    let creds;
    try {
        creds = JSON.parse(raw);
    } catch (err) {
        throw new Error('GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
    const { google } = require('googleapis');
    const auth = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: SCOPES
    });
    return google.drive({ version: 'v3', auth });
}

function getFolderId() {
    const id = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!id) throw new Error('GOOGLE_DRIVE_FOLDER_ID not configured');
    return id;
}

async function getStartPageToken() {
    if (isTestMode()) {
        return loadFixtures().startPageToken || '1';
    }
    const drive = getDriveClient();
    const res = await drive.changes.getStartPageToken();
    return res.data.startPageToken;
}

/**
 * List files currently in the target folder (used for first-run backfill).
 * Filters to supported mime types and non-trashed files.
 */
async function listFolderFiles(folderId) {
    if (isTestMode()) {
        const fx = loadFixtures();
        return (fx.folderFiles || []).filter(f => SUPPORTED_MIMES.has(f.mimeType));
    }
    const drive = getDriveClient();
    const results = [];
    let pageToken;
    const q = `'${folderId}' in parents and trashed = false`;
    do {
        const res = await drive.files.list({
            q,
            fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, parents)',
            pageSize: 100,
            pageToken,
            spaces: 'drive'
        });
        for (const f of res.data.files || []) {
            if (SUPPORTED_MIMES.has(f.mimeType)) results.push(f);
        }
        pageToken = res.data.nextPageToken;
    } while (pageToken);
    return results;
}

/**
 * Fetch changes since the given pageToken, filtered to supported mime types in the target folder.
 * Returns { files, newPageToken } where newPageToken is what to save for the next run.
 */
async function listChanges(pageToken, folderId) {
    if (isTestMode()) {
        const fx = loadFixtures();
        const entry = (fx.changes || {})[pageToken];
        if (!entry) return { files: [], newPageToken: pageToken };
        const files = (entry.files || []).filter(f => SUPPORTED_MIMES.has(f.mimeType));
        return { files, newPageToken: entry.newPageToken || pageToken };
    }
    const drive = getDriveClient();
    const files = [];
    let token = pageToken;
    let newStartPageToken;
    while (token) {
        const res = await drive.changes.list({
            pageToken: token,
            fields: 'nextPageToken, newStartPageToken, changes(removed, fileId, file(id, name, mimeType, size, trashed, parents))',
            pageSize: 100,
            spaces: 'drive'
        });
        for (const ch of res.data.changes || []) {
            if (ch.removed) continue;
            const f = ch.file;
            if (!f || f.trashed) continue;
            if (!SUPPORTED_MIMES.has(f.mimeType)) continue;
            if (!f.parents || !f.parents.includes(folderId)) continue;
            files.push(f);
        }
        if (res.data.nextPageToken) {
            token = res.data.nextPageToken;
        } else {
            newStartPageToken = res.data.newStartPageToken;
            token = null;
        }
    }
    return { files, newPageToken: newStartPageToken || pageToken };
}

/**
 * Download a Drive file's binary content and return a Buffer.
 */
async function downloadFile(fileId) {
    if (isTestMode()) {
        const fx = loadFixtures();
        const b64 = (fx.fileBodies || {})[fileId];
        if (!b64) throw new Error(`No test fixture body for fileId ${fileId}`);
        return Buffer.from(b64, 'base64');
    }
    const drive = getDriveClient();
    const res = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
    );
    return Buffer.from(res.data);
}

module.exports = {
    getDriveClient,
    getFolderId,
    getStartPageToken,
    listFolderFiles,
    listChanges,
    downloadFile,
    SUPPORTED_MIMES
};
