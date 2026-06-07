const express = require('express');
const { register, login } = require('../controllers/authController');
const {
  validateInput,
  loginLimiter,
  registerLimiter,
} = require('../middleware/securityMiddleware');

const router = express.Router();

router.post('/register', registerLimiter, validateInput, register);
router.post('/login', loginLimiter, validateInput, login);

module.exports = router;
