import AuditLog from './audit.model.js';

export const getAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find({ tenantId: req.tenantId })
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .limit(50);
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching audit logs', error: error.message });
    }
};
