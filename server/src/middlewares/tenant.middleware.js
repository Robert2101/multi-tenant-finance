import Tenant from '../modules/tenant/tenant.model.js';

export const resolveTenant = async (req, res, next) => {
    try {
        // 1. Find the tenant ID (Prefers Auth middleware, falls back to header)
        const currentTenantId = req.tenantId || req.headers['x-tenant-id'];

        if (!currentTenantId) {
            return res.status(400).json({ 
                message: 'Tenant context is missing. Authenticate or provide x-tenant-id header.' 
            });
        }

        // 2. Fetch the tenant from DB to ensure it actually exists
        const tenant = await Tenant.findById(currentTenantId);
        
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // 3. Keep the crucial business logic from the fix branch!
        if (tenant.subscriptionStatus === 'suspended') {
            return res.status(403).json({ message: 'Tenant subscription is suspended' });
        }

        // 4. Attach both the ID and the full object so downstream controllers have everything
        req.tenantId = tenant._id;
        req.tenant = tenant;
        
        next();
    } catch (error) {
        console.error('Tenant middleware error:', error);
        return res.status(500).json({ message: 'Internal Server Error while resolving tenant' });
    }
};