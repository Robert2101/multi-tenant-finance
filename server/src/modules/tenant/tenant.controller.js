import Tenant from './tenant.model.js';

export const getTenantDetails = async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.tenantId);
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        res.status(200).json(tenant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTenant = async (req, res) => {
    try {
        const { name, domain } = req.body;
        const tenant = await Tenant.findByIdAndUpdate(
            req.tenantId,
            { name, domain },
            { new: true, runValidators: true }
        );
        res.status(200).json(tenant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
