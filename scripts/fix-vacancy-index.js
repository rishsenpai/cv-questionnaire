// Drops the old sparse unique index on { externalId, source } so Mongoose can
// recreate it with partialFilterExpression (only indexes when externalId is a
// string). Without this, sparse-indexed docs with externalId: null collide.
//
// Run once after deploying the new Vacancy schema:
//   node scripts/fix-vacancy-index.js

const path = require('path');
const fs = require('fs');

function loadEnv() {
    const candidates = ['.env.production.local', '.env.local', '.env'];
    for (const name of candidates) {
        const full = path.join(process.cwd(), 'next-app', name);
        if (fs.existsSync(full)) {
            for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
                const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
                if (m && !process.env[m[1]]) {
                    let v = m[2];
                    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                        v = v.slice(1, -1);
                    }
                    process.env[m[1]] = v;
                }
            }
            console.log(`Loaded env from next-app/${name}`);
            return;
        }
    }
    console.log('No .env file found in next-app/, expecting env from shell');
}

async function main() {
    loadEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI not set');
        process.exit(1);
    }
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(uri);
    await client.connect();
    try {
        const db = client.db();
        const coll = db.collection('vacancies');

        const indexes = await coll.indexes();
        const target = indexes.find(i => i.name === 'externalId_1_source_1');
        if (!target) {
            console.log('No externalId_1_source_1 index found — nothing to drop.');
            return;
        }
        console.log('Existing index:', JSON.stringify(target, null, 2));
        await coll.dropIndex('externalId_1_source_1');
        console.log('Dropped externalId_1_source_1.');

        await coll.createIndex(
            { externalId: 1, source: 1 },
            {
                unique: true,
                partialFilterExpression: { externalId: { $type: 'string' } },
                name: 'externalId_1_source_1',
            },
        );
        console.log('Recreated with partialFilterExpression (externalId must be a string).');

        const after = await coll.indexes();
        console.log('Indexes now:');
        for (const i of after) console.log(' -', i.name, JSON.stringify(i.key), i.partialFilterExpression || '');
    } finally {
        await client.close();
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
