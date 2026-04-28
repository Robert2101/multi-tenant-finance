import express from 'express';
import { getPnl, getBalanceSheet, exportPnlCsv, getDashboardSummary } from './report.controller.js';

const router = express.Router();

// GET /api/reports/dashboard-summary
router.get('/dashboard-summary', getDashboardSummary);

// GET /api/reports/pnl
router.get('/pnl', getPnl);

// GET /api/reports/export/csv
router.get('/export/csv', exportPnlCsv);

// GET /api/reports/balance-sheet
router.get('/balance-sheet', getBalanceSheet);

export default router;
