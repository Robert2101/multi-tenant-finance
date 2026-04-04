import express from 'express';
import { getPnl, getBalanceSheet } from './report.controller.js';

const router = express.Router();

// GET /api/reports/pnl
router.get('/pnl', getPnl);

// GET /api/reports/balance-sheet
router.get('/balance-sheet', getBalanceSheet);

export default router;
