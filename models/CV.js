const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false, // Not required for uploaded CVs without email
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    birthDate: {
        type: String,
        trim: true
    },
    jobTitle: {
        type: String,
        trim: true
    },
    summary: {
        type: String,
        trim: true
    },
    languages: {
        type: String,
        trim: true
    },
    experience: {
        type: String,
        trim: true
    },
    education: {
        type: String,
        trim: true
    },
    skills: {
        type: String,
        trim: true
    },
    achievements: {
        type: String,
        trim: true
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    // Full text for searching
    fullText: {
        type: String  // All text extracted from PDF for search
    },
    // File upload fields
    fileName: {
        type: String,
        trim: true
    },
    fileData: {
        type: String  // Base64 encoded file
    },
    fileType: {
        type: String,
        trim: true
    },
    fileSize: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CV', cvSchema);
