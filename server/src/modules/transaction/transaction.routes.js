import express from 'express';
import {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
} from './transaction.controller.js';
import { authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .post(authorize('Admin', 'Editor'), createTransaction)
    .get(getTransactions);

router.route('/:id')
    .put(authorize('Admin', 'Editor'), updateTransaction)
    .delete(authorize('Admin'), deleteTransaction);

export default router;
