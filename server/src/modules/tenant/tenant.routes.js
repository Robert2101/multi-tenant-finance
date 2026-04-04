import express from 'express';
import { getTenantDetails, updateTenant } from './tenant.controller.js';

const router = express.Router();

router.get('/', getTenantDetails);
router.put('/', updateTenant);

export default router;
