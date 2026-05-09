// One-shot: remove the base64 fileData blob from every CV.
// node -r dotenv/config scripts/drop-cv-filedata.js dotenv_config_path=.env.diag

const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(uri, { bufferCommands: false });
    const db = mongoose.connection.db;
    const cvs = db.collection('cvs');

    const before = await db.command({ dbStats: 1, scale: 1 });
    const withFileData = await cvs.countDocuments({ fileData: { $exists: true } });
    console.log(`CVs with fileData: ${withFileData}`);
    console.log(`Before — dataSize: ${(before.dataSize / 1024 / 1024).toFixed(2)} MB`);

    const result = await cvs.updateMany({ fileData: { $exists: true } }, { $unset: { fileData: '' } });
    console.log(`Updated ${result.modifiedCount} documents.`);

    // Compact the collection so storage actually shrinks (not just freelist).
    try {
        await db.command({ compact: 'cvs', force: true });
        console.log('Compacted cvs collection.');
    } catch (e) {
        console.warn('compact skipped:', e.message);
    }

    const after = await db.command({ dbStats: 1, scale: 1 });
    console.log(`After  — dataSize: ${(after.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`         storageSize: ${(after.storageSize / 1024 / 1024).toFixed(2)} MB`);

    await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
