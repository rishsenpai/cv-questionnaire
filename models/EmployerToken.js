const mongoose = require('mongoose');

const employerTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true
    },
    expires: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Auto-delete expired tokens
employerTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmployerToken', employerTokenSchema);
