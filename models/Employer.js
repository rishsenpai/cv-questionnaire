const mongoose = require('mongoose');
const crypto = require('crypto');

const employerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    contactEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    plan: {
        type: String,
        enum: ['basic', 'advanced', 'premium'],
        default: 'basic'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
employerSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (!this.password) return;
    // Simple hash for demo - in production use bcrypt
    this.password = crypto.createHash('sha256').update(this.password).digest('hex');
});

// Method to check password
employerSchema.methods.checkPassword = function(password) {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return this.password === hash;
};

module.exports = mongoose.model('Employer', employerSchema);
