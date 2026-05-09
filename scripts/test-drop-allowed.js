// Probe: does Atlas allow drop operations while the cluster is over quota?
// Target: admintokens (0 documents, safe to drop and auto-recreate).
// node -r dotenv/config scripts/test-drop-allowed.js dotenv_config_path=.env.diag

const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(uri, { bufferCommands: false });
    const db = mongoose.connection.db;

    const before = await db.command({ dbStats: 1, scale: 1 });
    console.log(`Before — dataSize: ${(before.dataSize / 1024 / 1024).toFixed(2)} MB`);

    const adminTokensCount = await db.collection('admintokens').countDocuments();
    console.log(`admintokens count (must be 0 for safe test): ${adminTokensCount}`);
    if (adminTokensCount !== 0) {
        console.error('ABORT: admintokens not empty.');
        process.exit(2);
    }

    console.log('\nAttempting db.admintokens.drop()...');
    try {
        const ok = await db.collection('admintokens').drop();
        console.log(`drop() returned: ${ok}`);
        console.log('\nDROP WORKS — workaround is viable.');
    } catch (e) {
        if (e.code === 26 || /ns not found/i.test(e.message)) {
            console.log('Collection did not exist; treating as success.');
            console.log('\nDROP WORKS — workaround is viable.');
        } else if (e.code === 8000 || /space quota/i.test(e.message)) {
            console.error(`drop BLOCKED by Atlas quota: ${e.message}`);
            console.error('\nWORKAROUND IMPOSSIBLE — upgrade required.');
            process.exitCode = 3;
        } else {
            console.error(`drop failed with unexpected error:`, e);
            process.exitCode = 4;
        }
    }

    const after = await db.command({ dbStats: 1, scale: 1 });
    console.log(`\nAfter  — dataSize: ${(after.dataSize / 1024 / 1024).toFixed(2)} MB`);

    await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
