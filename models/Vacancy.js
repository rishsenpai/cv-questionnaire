const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    location: {
        type: String,
        trim: true
    },
    requirements: {
        type: String,
        trim: true
    },
    // Full text for matching
    fullText: {
        type: String
    },
    // File upload fields (for PDF vacancies)
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
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Vacancy', vacancySchema);
