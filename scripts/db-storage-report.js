// One-shot diagnostic: per-collection storage usage on the prod Mongo cluster.
// Run with: node -r dotenv/config scripts/db-storage-report.js dotenv_config_path=.env.diag

const mongoose = require('mongoose');

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(uri, { bufferCommands: false });
    const db = mongoose.connection.db;

    const dbStats = await db.command({ dbStats: 1, scale: 1 });
    const cols = await db.listCollections().toArray();

    const rows = [];
    for (const c of cols) {
        try {
            const s = await db.command({ collStats: c.name, scale: 1 });
            rows.push({
                name: c.name,
                count: s.count || 0,
                dataMB: ((s.size || 0) / 1024 / 1024).toFixed(2),
                indexMB: ((s.totalIndexSize || 0) / 1024 / 1024).toFixed(2),
                storageMB: ((s.storageSize || 0) / 1024 / 1024).toFixed(2),
            });
        } catch (e) {
            rows.push({ name: c.name, error: e.message });
        }
    }
    rows.sort((a, b) => parseFloat(b.dataMB || 0) - parseFloat(a.dataMB || 0));

    const fmtMB = (b) => (b / 1024 / 1024).toFixed(2);

    console.log(`\nDatabase: ${db.databaseName}`);
    console.log(`Total dataSize:    ${fmtMB(dbStats.dataSize)} MB`);
    console.log(`Total storageSize: ${fmtMB(dbStats.storageSize)} MB  (compressed on-disk)`);
    console.log(`Total indexSize:   ${fmtMB(dbStats.indexSize)} MB`);
    console.log(`Total fsUsed:      ${fmtMB(dbStats.fsUsedSize)} MB  (this is what Atlas counts)`);
    console.log(`Collections:       ${dbStats.collections}\n`);

    console.log('Per collection (sorted by data size):');
    console.table(rows);

    await mongoose.disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
