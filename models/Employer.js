const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 12; // Industry standard, good balance of security and speed
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

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
    // Security: account lockout
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
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

// Check if account is currently locked
employerSchema.methods.isLocked = function() {
    return this.lockUntil && this.lockUntil > Date.now();
};

// Get remaining lock time in minutes
employerSchema.methods.getLockTimeRemaining = function() {
    if (!this.isLocked()) return 0;
    return Math.ceil((this.lockUntil - Date.now()) / 60000);
};

// Increment failed login attempts
employerSchema.methods.incLoginAttempts = async function() {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        await this.updateOne({
            $set: { failedLoginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
        return;
    }

    const updates = { $inc: { failedLoginAttempts: 1 } };

    // Lock account if max attempts reached
    if (this.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + LOCK_TIME };
        console.log(`[SECURITY] Account locked for employer: ${this.username}`);
    }

    await this.updateOne(updates);
};

// Reset failed attempts on successful login
employerSchema.methods.resetLoginAttempts = async function() {
    if (this.failedLoginAttempts > 0 || this.lockUntil) {
        await this.updateOne({
            $set: { failedLoginAttempts: 0 },
            $unset: { lockUntil: 1 }
        });
    }
};

module.exports = mongoose.model('Employer', employerSchema);
