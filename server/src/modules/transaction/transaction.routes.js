import express from 'express';
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
} from './transaction.controller.js';

const router = express.Router();

router.route('/')
    .post(createTransaction)
    .get(getTransactions);

router.route('/:id')
    .put(updateTransaction)
    .delete(deleteTransaction);

export default router;
