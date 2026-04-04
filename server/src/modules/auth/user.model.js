import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        select: false
    },
    role: {
        type: String,
        enum: ['Admin', 'Accountant', 'Viewer'],
        default: 'Viewer'
    }
}, { timestamps: true });

// Ensure email is unique within the same tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export default mongoose.model('User', userSchema);
