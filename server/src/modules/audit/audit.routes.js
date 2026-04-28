import express from 'express';
import { getAuditLogs } from './audit.controller.js';
import { authorize } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Only Admins can view audit logs
router.route('/')
    .get(authorize('Admin'), getAuditLogs);

export default router;
