const mongoose = require('mongoose');

const adminTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    expires: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

adminTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AdminToken', adminTokenSchema);
