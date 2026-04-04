const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a tenant/company name'],
        unique: true
    },
    domain: {
        type: String,
        unique: true,
        sparse: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'trial', 'suspended'],
        default: 'trial'
    }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
