const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
    // For employer-uploaded vacancies
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: false  // Not required for external vacancies
    },

    // Basic info
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

    // Company info (for external vacancies)
    company: {
        type: String,
        trim: true
    },
    companyLogo: {
        type: String,
        trim: true
    },

    // External job fields
    externalId: {
        type: String,
        trim: true,
        index: true  // For duplicate checking
    },
    source: {
        type: String,
        trim: true,
        default: 'internal'  // 'internal', 'jsearch', 'indeed', etc.
    },
    applyLink: {
        type: String,
        trim: true
    },
    employmentType: {
        type: String,
        trim: true  // 'FULLTIME', 'PARTTIME', 'CONTRACT', etc.
    },
    isRemote: {
        type: Boolean,
        default: false
    },
    salary: {
        min: Number,
        max: Number,
        currency: String,
        period: String
    },
    postedAt: {
        type: Date
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
    },

    // AI Embedding for semantic search
    embedding: {
        type: [Number],
        select: false  // Don't include in queries by default (large array)
    },
    embeddingModel: {
        type: String,
        default: 'text-embedding-3-small'
    }
}, {
    timestamps: true
});

// Index for finding duplicates
vacancySchema.index({ externalId: 1, source: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Vacancy', vacancySchema);
