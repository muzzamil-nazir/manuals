const {
  readUsers,
  writeUsers,
  findUserById,
} = require('../utils/userHelper');
const { appendLog } = require('../utils/logHelper');
const { sendPaymentSuccessEmail } = require('../utils/emailService');
const { readMetadata } = require('../utils/fileHelper');

async function getMe(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        plan: user.plan || 'free',
        storageLimitMB: user.storageLimitMB || 100,
        usedStorageMB: user.usedStorageMB || 0,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function upgradePlan(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.plan === 'premium') {
      return res.status(400).json({ success: false, message: 'Already on premium plan.' });
    }

    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === req.user.id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (users[userIndex].plan === 'premium') {
      return res.status(400).json({ success: false, message: 'Already on premium plan.' });
    }

    users[userIndex].plan = 'premium';
    users[userIndex].storageLimitMB = 5000;
    users[userIndex].updatedAt = new Date().toISOString();

    await writeUsers(users);
    const upgradedUser = users[userIndex];

    await appendLog({
      id: `${upgradedUser.id}-${Date.now()}`,
      userId: upgradedUser.id,
      action: 'upgrade',
      details: { plan: 'premium' },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    await sendPaymentSuccessEmail(upgradedUser.email, upgradedUser.name, 'Premium');

    return res.json({
      success: true,
      message: 'Successfully upgraded to Premium plan.',
      data: {
        plan: 'premium',
        storageLimitMB: 5000,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getMe,
  upgradePlan,
};
