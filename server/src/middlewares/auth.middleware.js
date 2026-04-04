import jwt from 'jsonwebtoken';
import User from '../modules/auth/user.model.js';

export const protect = async (req, res, next) => {
    let token;

    // 1. Extract the token from cookies OR the Authorization header
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Early return if no token exists
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // 3. Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // 4. Attach the user to the request
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // 5. ATTACH THE TENANT ID
        // Using the decoded JWT payload (from the fix branch) is safer for multi-tenancy 
        // than hardcoding it to the User model (from the master branch)
        req.tenantId = decoded.tenantId;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// 6. Keep the Role-Based Authorization from the master branch!
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user ? req.user.role : 'Unknown'} is not authorized` 
            });
        }
        next();
    };
};