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

import Invite from './invite.model.js';
import User from '../auth/user.model.js';
import crypto from 'crypto';

export const createInvite = async (req, res) => {
    try {
        const { email, role } = req.body;
        
        // Ensure user is Admin to invite
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Only Admins can invite users' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email, tenantId: req.tenantId });
        if (existingUser) {
            return res.status(400).json({ message: 'User already in this tenant' });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        
        const invite = await Invite.create({
            tenantId: req.tenantId,
            email,
            role: role || 'Editor',
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });

        res.status(201).json({ 
            message: 'Invite created', 
            inviteLink: `http://localhost:5173/join/${token}` // Hardcoded for this demo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getInvites = async (req, res) => {
    try {
        const invites = await Invite.find({ tenantId: req.tenantId });
        res.status(200).json(invites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTenantUsers = async (req, res) => {
    try {
        const users = await User.find({ tenantId: req.tenantId }).select('-password');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
