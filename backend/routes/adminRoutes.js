const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getAllUsers,
  deleteUser,
  blockUser,
  unblockUser,
  getAllFiles,
  deleteFile,
  getLogs,
  getStats,
} = require('../controllers/adminController');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/block/:id', blockUser);
router.patch('/users/unblock/:id', unblockUser);

router.get('/files', getAllFiles);
router.delete('/files/:id', deleteFile);
router.get('/logs', getLogs);

router.get('/stats', getStats);

module.exports = router;
