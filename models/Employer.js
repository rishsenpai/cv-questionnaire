const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 12; // Industry standard, good balance of security and speed

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
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CV'
    }],
    notes: [{
        cvId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CV',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Check if password is already bcrypt hashed
function isBcryptHash(str) {
    return str && (str.startsWith('$2b$') || str.startsWith('$2a$'));
}

// Hash password before saving
employerSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (!this.password) return;

    // Skip if already bcrypt hashed (e.g., during migration)
    if (isBcryptHash(this.password)) return;

    // Hash with bcrypt
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

// Method to check password (supports both old SHA-256 and new bcrypt)
employerSchema.methods.checkPassword = async function(password) {
    if (isBcryptHash(this.password)) {
        // New bcrypt hash
        return bcrypt.compare(password, this.password);
    } else {
        // Legacy SHA-256 hash - check and migrate
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
        if (this.password === sha256Hash) {
            // Password correct - migrate to bcrypt
            this.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
            await this.save();
            console.log(`[SECURITY] Migrated password to bcrypt for employer: ${this.username}`);
            return true;
        }
        return false;
    }
};

module.exports = mongoose.model('Employer', employerSchema);
