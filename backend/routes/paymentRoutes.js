const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { processPaymentUpgrade } = require('../controllers/paymentController');

const router = express.Router();
router.use(authMiddleware);
router.post('/upgrade', processPaymentUpgrade);

module.exports = router;
