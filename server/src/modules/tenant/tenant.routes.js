import express from 'express';
import { getTenantDetails, updateTenant, createInvite, getInvites, getTenantUsers } from './tenant.controller.js';

const router = express.Router();

import { authorize } from '../../middlewares/auth.middleware.js';

// Both / and /me will now work to get workspace details
router.get('/', getTenantDetails);
router.get('/me', getTenantDetails); 

router.put('/', authorize('Admin'), updateTenant);

// User & Invite Management
router.post('/invites', createInvite);
router.get('/invites', getInvites);
router.get('/users', getTenantUsers);

export default router;
