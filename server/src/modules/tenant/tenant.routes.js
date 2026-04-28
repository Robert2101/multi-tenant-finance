import express from 'express';
import { getTenantDetails, updateTenant } from './tenant.controller.js';

const router = express.Router();

// Both / and /me will now work to get workspace details
router.get('/', getTenantDetails);
router.get('/me', getTenantDetails); 

router.put('/', updateTenant);

export default router;
