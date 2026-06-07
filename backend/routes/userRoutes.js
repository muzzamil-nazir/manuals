const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getMe, upgradePlan } = require('../controllers/userController');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', getMe);
router.patch('/upgrade', upgradePlan);

module.exports = router;
