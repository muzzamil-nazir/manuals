const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { testEmail } = require('../controllers/emailController');

const router = express.Router();
router.use(authMiddleware);
router.post('/test', testEmail);

module.exports = router;
