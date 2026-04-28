import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    role: {
        type: String,
        enum: ['Admin', 'Editor', 'Viewer'],
        default: 'Editor'
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Auto-expire old invites using a TTL index
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Invite', inviteSchema);
