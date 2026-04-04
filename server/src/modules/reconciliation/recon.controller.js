import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import Tenant from '../tenant/tenant.model.js';
import Transaction from '../transaction/transaction.model.js';
import AuditLog from '../audit/audit.model.js';

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || 'mock_client_id',
            'PLAID-SECRET': process.env.PLAID_SECRET || 'mock_secret',
        },
    },
});
const plaidClient = new PlaidApi(configuration);

export const syncTransactions = async (req, res) => {
    try {
        const { tenantId } = req;
        const tenant = await Tenant.findById(tenantId);
        
        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        // We assume plaidAccessToken is stored after Plaid Link process
        if (!tenant.plaidAccessToken) {
            return res.status(400).json({ message: 'Plaid is not connected for this tenant.' });
        }

        let hasMore = true;
        let nextCursor = tenant.lastCursor || null;
        let added = [];
        let modified = [];
        let removed = [];

        // Ping Plaid
        while (hasMore) {
            const response = await plaidClient.transactionsSync({
                access_token: tenant.plaidAccessToken,
                cursor: nextCursor,
            });

            const data = response.data;
            added = added.concat(data.added);
            modified = modified.concat(data.modified);
            removed = removed.concat(data.removed);
            
            nextCursor = data.next_cursor;
            hasMore = data.has_more;
        }

        // Save the New Cursor immediately
        tenant.lastCursor = nextCursor;
        await tenant.save();

        let reconciledCount = 0;
        let unmatchedCount = 0;

        // The Auto-Match Loop
        for (const bankTx of added) {
            // Date boundaries: +/- 3 days
            const bankDate = new Date(bankTx.date);
            const minDate = new Date(bankDate);
            minDate.setDate(bankDate.getDate() - 3);
            const maxDate = new Date(bankDate);
            maxDate.setDate(bankDate.getDate() + 3);

            // We match the amount exactly and status 'pending'
            // Keep in mind Plaid amounts: positive values indicate money leaving the account (expenses), 
            // negative values indicate money entering (income). 
            // But let's assume we match absolute values or according to our db logic.
            // Based on user prompt: `amount == bankTransaction.amount`
            
            const match = await Transaction.findOne({
                tenantId: tenantId,
                status: 'pending',
                amount: bankTx.amount, // strict match per prompt
                date: { $gte: minDate, $lte: maxDate }
            });

            if (match) {
                // If found: Update status to 'reconciled' and attach transaction_id
                match.status = 'reconciled';
                match.plaidTransactionId = bankTx.transaction_id;
                await match.save();

                try {
                    await AuditLog.create({
                        tenantId: req.tenantId,
                        userId: req.user._id,
                        action: 'RECONCILE',
                        targetModel: 'Transaction',
                        targetId: match._id,
                        changes: { new_status: 'reconciled', plaidTransactionId: bankTx.transaction_id }
                    });
                } catch (err) {
                    console.error('AuditLog error during reconcile:', err);
                }

                reconciledCount++;
            } else {
                // If NOT found: Insert as new transaction but flag as requires_review: true
                const newTx = new Transaction({
                    tenantId: tenantId,
                    userId: req.user ? req.user._id : tenantId, // Using tenantId as fallback if userId from middleware is tricky
                    type: bankTx.amount >= 0 ? 'expense' : 'income',
                    amount: bankTx.amount,
                    category: bankTx.category ? bankTx.category.join(', ') : 'Uncategorized',
                    description: bankTx.name,
                    date: bankDate,
                    status: 'pending', // or 'reconciled'? Prompt says "flag it as requires_review: true"
                    requiresReview: true,
                    plaidTransactionId: bankTx.transaction_id
                });
                await newTx.save();
                unmatchedCount++;
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Reconciliation successful',
            summary: {
                reconciledCount,
                unmatchedCount,
                totalProcessed: added.length
            }
        });

    } catch (error) {
        console.error('Error during reconciliation sync:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
