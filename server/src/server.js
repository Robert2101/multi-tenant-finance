import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Implemented routes
import authRoutes from './modules/auth/auth.routes.js';
import tenantRoutes from './modules/tenant/tenant.routes.js';
import transactionRoutes from './modules/transaction/transaction.routes.js';
import reconRoutes from './modules/reconciliation/recon.routes.js';
import reportRoutes from './modules/reporting/report.routes.js';

// Middlewares
import { protect } from './middlewares/auth.middleware.js';
import { tenantMiddleware } from './middlewares/tenant.middleware.js';

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API is running' });
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenant', protect, tenantMiddleware, tenantRoutes);
app.use('/api/transactions', protect, tenantMiddleware, transactionRoutes);
app.use('/api/reconciliation', protect, tenantMiddleware, reconRoutes);
app.use('/api/reports', protect, tenantMiddleware, reportRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
