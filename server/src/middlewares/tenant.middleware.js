import Tenant from '../modules/tenant/tenant.model.js';

export const tenantMiddleware = async (req, res, next) => {
    try {
        if (!req.tenantId) {
            return res.status(400).json({ message: 'Tenant ID is missing. Need to authenticate first.' });
        }

        const tenant = await Tenant.findById(req.tenantId);
        
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        if (tenant.subscriptionStatus === 'suspended') {
            return res.status(403).json({ message: 'Tenant subscription is suspended' });
        }

        req.tenant = tenant;
        next();
    } catch (error) {
        console.error('Tenant middleware error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
