import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['Profit and Loss', 'Balance Sheet', 'Cash Flow'],
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // Storing the snapshot of the report data (e.g., total income, total expenses)
        required: true
    },
    periodStart: {
        type: Date,
        required: true
    },
    periodEnd: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
