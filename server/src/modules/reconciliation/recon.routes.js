import express from 'express';
import { 
    simulateBankFeed, 
    reconcileOne, 
    reconcileAll, 
    autoReconcile,
    createLinkToken, 
    exchangePublicToken,
    syncTransactions
} from './recon.controller.js';


import { createSetuConsent, fetchSetuData } from './setu.controller.js';
import { authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Only Admins and Editors can perform reconciliation actions
router.use(authorize('Admin', 'Editor'));

// --- Setu (Indian Bank) Routes ---
router.post('/setu/consent', createSetuConsent);
router.post('/setu/fetch', fetchSetuData);

// --- Plaid Integration Routes ---
router.post('/create-link-token', createLinkToken);
router.post('/exchange-public-token', exchangePublicToken);
router.post('/sync', syncTransactions);

// --- Simulation & Manual Routes ---
router.post('/simulate', simulateBankFeed);
router.patch('/reconcile/:id', reconcileOne);
router.post('/reconcile-all', reconcileAll);
router.post('/auto-reconcile', autoReconcile);


export default router;
