// One-off cleanup of test CVs left over by the Playwright suite when it ran against prod.
// Safe to keep around; matches only the synthetic emails the tests use.
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const CV = mongoose.model('CV', new mongoose.Schema({}, { strict: false }));
    const filter = {
        $or: [
            { email: { $regex: /^api-test-\d+@playwright\.com$/i } },
            { email: { $regex: /^match-\d+@test\.com$/i } },
            { email: { $regex: /^recruiter-\d+@test\.com$/i } },
            { email: { $regex: /^upload-\d+@test\.com$/i } }
        ]
    };
    const targets = await CV.find(filter, { fullName: 1, email: 1, createdAt: 1 });
    console.log('Will delete', targets.length, 'CVs:');
    targets.forEach(c => console.log(' -', c._id.toString(), '|', c.fullName, '|', c.email));
    if (process.argv.includes('--apply')) {
        const r = await CV.deleteMany(filter);
        console.log('Deleted:', r.deletedCount);
    } else {
        console.log('\n(dry run — pass --apply to actually delete)');
    }
    await mongoose.disconnect();
})();
