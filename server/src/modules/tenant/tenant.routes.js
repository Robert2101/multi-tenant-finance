const express = require('express');
const router = express.Router();
const { getTenantDetails, updateTenant } = require('./tenant.controller');

// We will need to apply auth middleware here later to protect these routes
// For example:
// const { protect, authorize } = require('../../middlewares/auth.middleware');
// router.use(protect);

router.get('/', getTenantDetails);

// Only admin should update tenant settings
// router.put('/', authorize('Admin'), updateTenant);
router.put('/', updateTenant);

module.exports = router;
