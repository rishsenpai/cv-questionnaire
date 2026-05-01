const mongoose = require('mongoose');

/**
 * Generic key/value state store for sync integrations.
 * Used by the Google Drive cron (pageToken, lastSyncStats) and reusable
 * for future cursors (Adzuna/JSearch etc).
 *
 * Keys are namespaced, e.g.:
 *   'drive:pageToken'       -> string
 *   'drive:lastSyncStats'   -> { runAt, processed, created, skipped, errors }
 */
const syncStateSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SyncState', syncStateSchema);
