// Rescue the cvs collection from Atlas over-quota state.
// Strategy: stream-export all cvs (minus fileData) to a local JSONL, drop the
// collection (allowed even when over quota), then bulk-insert the slim docs back.
// node -r dotenv/config scripts/rescue-cvs-collection.js dotenv_config_path=.env.diag

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DUMP_PATH = path.resolve(process.cwd(), 'cvs-backup.jsonl');
const BATCH = 200;

function mb(bytes) { return (bytes / 1024 / 1024).toFixed(2); }

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(uri, { bufferCommands: false });
    const db = mongoose.connection.db;
    const cvs = db.collection('cvs');

    const expectedCount = await cvs.countDocuments();
    console.log(`Found ${expectedCount} CV documents.\n`);

    // ---- 1. EXPORT (read-only, allowed under quota) ----
    if (fs.existsSync(DUMP_PATH)) {
        console.error(`ABORT: ${DUMP_PATH} already exists. Move/delete it before re-running.`);
        process.exit(2);
    }
    console.log(`[1/3] Exporting to ${DUMP_PATH} (excluding fileData)...`);
    const out = fs.createWriteStream(DUMP_PATH, { flags: 'wx' });
    const cursor = cvs.find({}, { projection: { fileData: 0 } });
    let exported = 0;
    let lastLog = Date.now();
    for await (const doc of cursor) {
        out.write(JSON.stringify(doc) + '\n');
        exported++;
        if (Date.now() - lastLog > 2000) {
            console.log(`  ... exported ${exported}/${expectedCount}`);
            lastLog = Date.now();
        }
    }
    await new Promise((res) => out.end(res));
    console.log(`Export complete: ${exported} docs, file size ${mb(fs.statSync(DUMP_PATH).size)} MB`);

    if (exported !== expectedCount) {
        console.error(`ABORT: exported ${exported} != expected ${expectedCount}`);
        process.exit(3);
    }

    // ---- 2. DROP (allowed even over quota) ----
    console.log(`\n[2/3] Dropping cvs collection...`);
    const stats1 = await db.command({ dbStats: 1, scale: 1 });
    console.log(`  dataSize before drop: ${mb(stats1.dataSize)} MB`);
    await cvs.drop();
    const stats2 = await db.command({ dbStats: 1, scale: 1 });
    console.log(`  dataSize after drop:  ${mb(stats2.dataSize)} MB  (freed ${mb(stats1.dataSize - stats2.dataSize)} MB)`);

    // ---- 3. RESTORE (writes now work because we're under quota) ----
    console.log(`\n[3/3] Restoring docs from ${DUMP_PATH}...`);
    const cvs2 = db.collection('cvs');
    const lines = fs.readFileSync(DUMP_PATH, 'utf8').split('\n').filter(Boolean);
    let inserted = 0;
    for (let i = 0; i < lines.length; i += BATCH) {
        const batch = lines.slice(i, i + BATCH).map((l) => {
            const obj = JSON.parse(l);
            // Restore proper ObjectId / Date types
            if (obj._id && obj._id.$oid) obj._id = new mongoose.Types.ObjectId(obj._id.$oid);
            else if (typeof obj._id === 'string') obj._id = new mongoose.Types.ObjectId(obj._id);
            for (const k of ['createdAt', 'updatedAt', 'recruiterRequestedAt']) {
                if (obj[k] && typeof obj[k] === 'string') obj[k] = new Date(obj[k]);
            }
            if (obj.externalJobsCache && obj.externalJobsCache.fetchedAt && typeof obj.externalJobsCache.fetchedAt === 'string') {
                obj.externalJobsCache.fetchedAt = new Date(obj.externalJobsCache.fetchedAt);
            }
            return obj;
        });
        await cvs2.insertMany(batch, { ordered: false });
        inserted += batch.length;
        if (i % (BATCH * 5) === 0) console.log(`  ... inserted ${inserted}/${lines.length}`);
    }

    const finalCount = await cvs2.countDocuments();
    console.log(`\nFinal cvs count: ${finalCount} (expected ${expectedCount})`);

    const stats3 = await db.command({ dbStats: 1, scale: 1 });
    console.log(`Final dataSize:    ${mb(stats3.dataSize)} MB`);
    console.log(`Final storageSize: ${mb(stats3.storageSize)} MB`);

    if (finalCount !== expectedCount) {
        console.error(`\nWARNING: count mismatch — leaving backup at ${DUMP_PATH} for manual inspection.`);
        process.exitCode = 5;
    } else {
        console.log(`\nSuccess. Backup file kept at ${DUMP_PATH} until you confirm.`);
    }

    await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
