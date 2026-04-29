import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import Transaction from '../transaction/transaction.model.js';
import Tenant from '../tenant/tenant.model.js';
import AuditLog from '../audit/audit.model.js';

// Initialize Plaid Client Lazily
let plaidClient;
const getPlaidClient = () => {
    if (!plaidClient) {
        const configuration = new Configuration({
            basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                    'PLAID-SECRET': process.env.PLAID_SECRET,
                },
            },
        });
        plaidClient = new PlaidApi(configuration);
    }
    return plaidClient;
};

// 1. Create a Link Token
export const createLinkToken = async (req, res) => {
    try {
        const client = getPlaidClient();
        const response = await client.linkTokenCreate({
            user: { client_user_id: req.user._id.toString() },
            client_name: 'FinancePro Multi-Tenant',
            products: ['transactions'],
            country_codes: ['US'],
            language: 'en',
            // Add this if you have a redirect URI configured in Plaid Dashboard
            // redirect_uri: 'http://localhost:5173/dashboard/reconciliation', 
        });
        res.json(response.data);
    } catch (error) {
        console.error('Plaid Link Token Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Could not create Plaid link token' });
    }
};

// ... remaining controller functions (exchangePublicToken, syncTransactions, etc.) ...
// 2. Exchange Public Token for Access Token
export const exchangePublicToken = async (req, res) => {
    try {
        const { publicToken, metadata } = req.body;
        const client = getPlaidClient();
        const response = await client.itemPublicTokenExchange({ public_token: publicToken });
        
        const accessToken = response.data.access_token;
        const itemId = response.data.item_id;
        const institutionName = metadata?.institution?.name || 'Connected Bank';

        // Save to Tenant
        await Tenant.findByIdAndUpdate(req.tenantId, {
            plaidAccessToken: accessToken,
            plaidItemId: itemId,
            plaidInstitutionName: institutionName
        });

        res.json({ message: `Connected to ${institutionName} successfully!` });
    } catch (error) {
        console.error('Plaid Token Exchange Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Could not connect bank account' });
    }
};

export const syncTransactions = async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.tenantId);
        if (!tenant.plaidAccessToken) {
            return res.status(400).json({ message: 'Plaid not connected' });
        }

        const client = getPlaidClient();
        const response = await client.transactionsSync({
            access_token: tenant.plaidAccessToken,
            cursor: tenant.lastCursor || null,
        });

        const { added, next_cursor } = response.data;
        const txs = added.map(tx => ({
            tenantId: req.tenantId,
            userId: req.user._id,
            type: tx.amount > 0 ? 'expense' : 'income',
            amount: Math.abs(tx.amount),
            category: tx.category ? tx.category[0] : 'Transfer',
            description: tx.name,
            date: new Date(tx.date),
            status: 'pending',
            plaidTransactionId: tx.transaction_id
        }));

        if (txs.length > 0) await Transaction.insertMany(txs);
        tenant.lastCursor = next_cursor;
        await tenant.save();

        res.json({ message: `Synced ${txs.length} transactions`, count: txs.length });
    } catch (error) {
        console.error('Plaid Sync Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error syncing with Plaid' });
    }
};

export const simulateBankFeed = async (req, res) => {
    try {
        const samples = [
            { type: 'income', amount: 2500, category: 'Sales', description: 'Stripe Payout', date: new Date() },
            { type: 'expense', amount: 142, category: 'Software', description: 'AWS Hosting', date: new Date() },
        ];
        const created = await Transaction.insertMany(samples.map(s => ({ ...s, tenantId: req.tenantId, userId: req.user._id, status: 'pending' })));
        res.status(201).json({ message: `Simulated ${created.length} transactions`, count: created.length });
    } catch (e) { res.status(500).json({ message: 'Simulation failed' }); }
};

export const reconcileOne = async (req, res) => {
    try {
        const tx = await Transaction.findOneAndUpdate({ _id: req.params.id, tenantId: req.tenantId }, { status: 'reconciled' }, { new: true });
        if (!tx) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({ message: 'Reconciled', transaction: tx });
    } catch (e) { res.status(500).json({ message: 'Failed' }); }
};

export const reconcileAll = async (req, res) => {
    try {
        const result = await Transaction.updateMany({ tenantId: req.tenantId, status: 'pending' }, { $set: { status: 'reconciled' } });
        res.json({ message: `Reconciled ${result.modifiedCount} items` });
    } catch (e) { res.status(500).json({ message: 'Failed' }); }
};

// Auto-reconcile: match bank-imported transactions against manual entries
export const autoReconcile = async (req, res) => {
    try {
        const { tenantId } = req;

        // Bank-sourced: imported from Plaid or Setu
        const bankTxns = await Transaction.find({
            tenantId,
            status: 'pending',
            $or: [
                { plaidTransactionId: { $ne: null } },
                { category: 'Bank Import' }
            ]
        });

        // Manually entered: no plaid ID and not a bank import
        const manualTxns = await Transaction.find({
            tenantId,
            status: 'pending',
            plaidTransactionId: null,
            category: { $ne: 'Bank Import' }
        });

        const matchedBankIds = new Set();
        const matchedManualIds = new Set();
        let matchedCount = 0;

        for (const bankTx of bankTxns) {
            if (matchedBankIds.has(bankTx._id.toString())) continue;

            for (const manualTx of manualTxns) {
                if (matchedManualIds.has(manualTx._id.toString())) continue;

                // Matching rules:
                // 1. Same type (income / expense)
                // 2. Amount within 5% tolerance (handles rounding/fees)
                // 3. Date within ±3 days
                const sameType = bankTx.type === manualTx.type;
                const amountTolerance = manualTx.amount * 0.05;
                const amountMatch = Math.abs(bankTx.amount - manualTx.amount) <= amountTolerance;
                const daysDiff = Math.abs(
                    new Date(bankTx.date).getTime() - new Date(manualTx.date).getTime()
                ) / (1000 * 60 * 60 * 24);
                const dateMatch = daysDiff <= 3;

                if (sameType && amountMatch && dateMatch) {
                    await Transaction.findByIdAndUpdate(bankTx._id, {
                        status: 'reconciled',
                        matchedTransactionId: manualTx._id
                    });
                    await Transaction.findByIdAndUpdate(manualTx._id, {
                        status: 'reconciled',
                        matchedTransactionId: bankTx._id
                    });

                    matchedBankIds.add(bankTx._id.toString());
                    matchedManualIds.add(manualTx._id.toString());
                    matchedCount++;
                    break; // One-to-one matching — move to next bank tx
                }
            }
        }

        res.json({
            message: `Auto-reconciled ${matchedCount} transaction pair${matchedCount !== 1 ? 's' : ''}. ${bankTxns.length - matchedCount} bank records had no match.`,
            matchedCount,
            unmatchedBankCount: bankTxns.length - matchedCount,
            unmatchedManualCount: manualTxns.length - matchedCount
        });
    } catch (error) {
        console.error('Auto-reconcile error:', error);
        res.status(500).json({ message: 'Auto-reconciliation failed' });
    }
};
