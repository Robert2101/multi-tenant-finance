import Transaction from './transaction.model.js';

export const createTransaction = async (req, res) => {
    try {
        const { type, amount, category, description, date, receiptUrl } = req.body;

        const transaction = await Transaction.create({
            tenantId: req.tenantId,  // Extracted from auth middleware
            userId: req.user._id,    // Extracted from auth middleware
            type,
            amount,
            category,
            description,
            date: date || Date.now(),
            receiptUrl
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getTransactions = async (req, res) => {
    try {
        // Only fetch transactions that belong to this tenant
        const transactions = await Transaction.find({ tenantId: req.tenantId })
            .sort({ date: -1 })
            .populate('userId', 'name email');

        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ _id: req.params.id, tenantId: req.tenantId });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found or does not belong to this tenant' });
        }

        const updatedTransaction = await Transaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedTransaction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findOne({ _id: req.params.id, tenantId: req.tenantId });

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found or does not belong to this tenant' });
        }

        await transaction.deleteOne();
        res.status(200).json({ message: 'Transaction removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
