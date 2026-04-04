// This middleware is optional if we trust req.tenantId from auth,
// but can be used for public routes where tenant is derived from URL/header
import Tenant from '../modules/tenant/tenant.model.js';

export const resolveTenant = async (req, res, next) => {
    // 1. Check if auth middleware already populated it
    if (req.tenantId) {
        return next();
    }

    // 2. Otherwise look for tenant domain/id in headers
    const tenantIdHeader = req.headers['x-tenant-id'];
    
    if (!tenantIdHeader) {
        return res.status(400).json({ message: 'Tenant context is missing. Please provide x-tenant-id header.' });
    }

    try {
        const tenant = await Tenant.findById(tenantIdHeader);
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        
        req.tenantId = tenant._id;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error resolving tenant context' });
    }
};
