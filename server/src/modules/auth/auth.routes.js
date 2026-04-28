import express from 'express';
import { registerUser, loginUser } from './auth.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Logout: clear the JWT cookie
router.post('/logout', (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

export default router;
