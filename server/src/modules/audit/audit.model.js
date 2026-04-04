import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE', 'RECONCILE'], required: true },
    targetModel: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    changes: { type: mongoose.Schema.Types.Mixed }, 
    timestamp: { type: Date, default: Date.now }
});

// Index to quickly fetch audit logs by tenant
auditLogSchema.index({ tenantId: 1, timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
