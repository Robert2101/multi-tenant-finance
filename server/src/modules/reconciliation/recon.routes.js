import express from 'express';
import { syncTransactions } from './recon.controller.js';

const router = express.Router();

// Route: /api/reconciliation/sync
router.post('/sync', syncTransactions);

export default router;
