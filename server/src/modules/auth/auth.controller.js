import jwt from 'jsonwebtoken';
import User from './user.model.js';
import Tenant from '../tenant/tenant.model.js';

const generateToken = (id, tenantId, role) => {
    return jwt.sign({ id, tenantId, role }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d',
    });
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, tenantName } = req.body;

        // 1. Create Tenant (since it's a new user registration, they get their own tenant)
        let tenant = await Tenant.findOne({ name: tenantName });
        if (!tenant) {
            tenant = await Tenant.create({ name: tenantName });
        }

        // 2. Check if user exists in this tenant
        const userExists = await User.findOne({ email, tenantId: tenant._id });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists in this tenant' });
        }

        // Note: In production you would hash the password using bcrypt here!
        const user = await User.create({
            name,
            email,
            password, // Storing in plain text for simplicity, add bcrypt in production
            tenantId: tenant._id,
            role: 'Admin' // First user becomes Admin
        });

        const token = generateToken(user._id, user.tenantId, user.role);

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email (globally unique per our compound index logic assumption, 
        // or effectively unique if users only sign up once)
        const user = await User.findOne({ email }).select('+password');

        if (user && user.password === password) {
            const token = generateToken(user._id, user.tenantId, user.role);

            // Set cookie
            res.cookie('jwt', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
