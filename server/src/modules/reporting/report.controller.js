import Transaction from '../transaction/transaction.model.js';
import { Parser } from 'json2csv';

// NEW: Dashboard Summary — used by the Dashboard page
export const getDashboardSummary = async (req, res) => {
    try {
        const { tenantId } = req;

        const allTx = await Transaction.find({ tenantId });

        let totalIncome = 0;
        let totalExpense = 0;
        let reconciledCount = 0;
        let pendingCount = 0;

        allTx.forEach((tx) => {
            if (tx.type === 'income') totalIncome += tx.amount;
            else totalExpense += tx.amount;
            if (tx.status === 'reconciled') reconciledCount++;
            else pendingCount++;
        });

        const netProfit = totalIncome - totalExpense;

        return res.status(200).json({
            totalIncome,
            totalExpense,
            netProfit,
            reconciledCount,
            pendingCount,
            totalTransactions: allTx.length,
        });
    } catch (error) {
        console.error('Error generating dashboard summary:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getPnl = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }

        const pnlData = await Transaction.aggregate([
            {
                $match: {
                    tenantId: req.tenantId,
                    date: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    status: 'reconciled'
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        let totalIncome = 0;
        let totalExpense = 0;

        pnlData.forEach(item => {
            if (item._id === 'income') {
                totalIncome = item.total;
            } else if (item._id === 'expense') {
                totalExpense = item.total;
            }
        });

        const netProfit = totalIncome - totalExpense;

        return res.status(200).json({
            NetProfit: netProfit,
            totalCredit: totalIncome,
            totalDebit: totalExpense,
            breakdown: pnlData
        });
    } catch (error) {
        console.error('Error generating PnL report:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getBalanceSheet = async (req, res) => {
    try {
        const { endDate } = req.query;
        
        const dateFilter = endDate ? { $lte: new Date(endDate) } : { $lte: new Date() };

        const transactions = await Transaction.find({
            tenantId: req.tenantId,
            date: dateFilter
        });

        let totalAssets = 0;
        let totalLiabilities = 0;
        let equity = 0;

        transactions.forEach(tx => {
            if (tx.status === 'reconciled') {
                if (tx.type === 'income') {
                    totalAssets += tx.amount;
                    equity += tx.amount;
                } else if (tx.type === 'expense') {
                    totalAssets -= tx.amount;
                    equity -= tx.amount;
                }
            } else if (tx.status === 'pending') {
                if (tx.type === 'expense') {
                    totalLiabilities += tx.amount;
                } else if (tx.type === 'income') {
                    totalAssets += tx.amount; // Accounts Receivable
                    equity += tx.amount;
                }
            }
        });

        return res.status(200).json({
            assets: totalAssets,
            liabilities: totalLiabilities,
            equity: equity,
            breakdown: {
                cashAndReceivables: totalAssets,
                accountsPayable: totalLiabilities,
                retainedEarnings: equity
            }
        });
    } catch (error) {
        console.error('Error generating Balance Sheet:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const exportPnlCsv = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'startDate and endDate are required' });
        }

        const transactions = await Transaction.find({
            tenantId: req.tenantId,
            status: 'reconciled',
            date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).select('date type category amount description -_id').lean();

        if (transactions.length === 0) {
            return res.status(404).json({ message: 'No reconciled data to export for this period' });
        }

        const parser = new Parser({ fields: ['date', 'type', 'category', 'amount', 'description'] });
        const csv = parser.parse(transactions);

        res.header('Content-Type', 'text/csv');
        res.attachment('pnl-report.csv');
        return res.send(csv);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
