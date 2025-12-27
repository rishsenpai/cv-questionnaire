const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CV', cvSchema);
