import express from 'express';
import { 
    simulateBankFeed, 
    reconcileOne, 
    reconcileAll, 
    createLinkToken, 
    exchangePublicToken,
    syncTransactions
} from './recon.controller.js';

const router = express.Router();

// --- Plaid Integration Routes ---
router.post('/create-link-token', createLinkToken);
router.post('/exchange-public-token', exchangePublicToken);
router.post('/sync', syncTransactions);

// --- Simulation & Manual Routes ---
router.post('/simulate', simulateBankFeed);
router.patch('/reconcile/:id', reconcileOne);
router.post('/reconcile-all', reconcileAll);

export default router;
