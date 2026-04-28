import dotenv from 'dotenv';
dotenv.config(); // MUST BE AT THE VERY TOP

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Implemented routes
import authRoutes from './modules/auth/auth.routes.js';
import tenantRoutes from './modules/tenant/tenant.routes.js';
import transactionRoutes from './modules/transaction/transaction.routes.js';
import reconRoutes from './modules/reconciliation/recon.routes.js';
import reportRoutes from './modules/reporting/report.routes.js';

// Middlewares
import { protect } from './middlewares/auth.middleware.js';
import { resolveTenant } from './middlewares/tenant.middleware.js';

connectDB();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running' });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', protect, resolveTenant, tenantRoutes);
app.use('/api/transactions', protect, resolveTenant, transactionRoutes);
app.use('/api/reconciliation', protect, resolveTenant, reconRoutes);
app.use('/api/reports', protect, resolveTenant, reportRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
