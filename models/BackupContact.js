const mongoose = require('mongoose');

const backupContactSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    cvId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV',
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'cv_submitted', 'abandoned'],
        default: 'pending'
    }
}, {
    timestamps: true
});

// Index for efficient lookups
backupContactSchema.index({ email: 1 });
backupContactSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BackupContact', backupContactSchema);
