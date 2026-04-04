import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Please specify transaction type (income/expense)']
    },
    amount: {
        type: Number,
        required: [true, 'Please add an amount']
    },
    category: {
        type: String,
        required: [true, 'Please add a category (e.g., Software, Rent, Sales)']
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'reconciled'],
        default: 'pending'
    },
    receiptUrl: {
        type: String // Optional link to an S3 bucket or similar
    }
}, { timestamps: true });

// Index for faster queries within a tenant's dashboard
transactionSchema.index({ tenantId: 1, date: -1 });

export default mongoose.model('Transaction', transactionSchema);
