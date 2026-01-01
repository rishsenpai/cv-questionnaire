const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    // Event type: pageview, cv_submission, cv_upload, vacancy_search, match, high_match
    eventType: {
        type: String,
        required: true,
        enum: ['pageview', 'cv_submission', 'cv_upload', 'cv_manual', 'vacancy_search', 'vacancy_match', 'language_change', 'high_match']
    },

    // Page path for pageviews
    page: {
        type: String
    },

    // Referrer
    referrer: {
        type: String
    },

    // User agent
    userAgent: {
        type: String
    },

    // Language preference
    language: {
        type: String
    },

    // Geolocation data
    geo: {
        ip: String,
        country: String,
        countryCode: String,
        city: String,
        region: String,
        lat: Number,
        lon: Number
    },

    // Session ID (anonymous tracking)
    sessionId: {
        type: String
    },

    // Additional metadata
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },

    // Timestamp
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Indexes for efficient queries
analyticsSchema.index({ eventType: 1, createdAt: -1 });
analyticsSchema.index({ 'geo.countryCode': 1 });
analyticsSchema.index({ page: 1 });
analyticsSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);
