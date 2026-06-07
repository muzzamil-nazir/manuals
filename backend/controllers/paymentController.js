const { v4: uuidv4 } = require('uuid');
const { readUsers, writeUsers, findUserById } = require('../utils/userHelper');
const { appendLog } = require('../utils/logHelper');
const { sendPaymentSuccessEmail } = require('../utils/emailService');

function getRequestIp(req) {
  return (req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress || '').split(',')[0].trim();
}

async function upgradeUserPlan(user) {
  const users = await readUsers();
  const userIndex = users.findIndex((u) => u.id === user.id);
  if (userIndex === -1) {
    throw new Error('User not found.');
  }

  users[userIndex].plan = 'premium';
  users[userIndex].storageLimitMB = 5000;
  users[userIndex].updatedAt = new Date().toISOString();
  await writeUsers(users);
  return users[userIndex];
}

async function processPaymentUpgrade(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.plan === 'premium') {
      return res.status(400).json({ success: false, message: 'Already on premium plan.' });
    }

    const upgradedUser = await upgradeUserPlan(user);

    await appendLog({
      id: uuidv4(),
      userId: upgradedUser.id,
      action: 'payment',
      details: { plan: 'premium', gateway: 'simulated' },
      timestamp: new Date().toISOString(),
      ip: getRequestIp(req),
    });

    await sendPaymentSuccessEmail(upgradedUser.email, upgradedUser.name, 'Premium');

    return res.json({
      success: true,
      message: 'Payment successful, upgraded to Premium.',
      data: {
        plan: upgradedUser.plan,
        storageLimitMB: upgradedUser.storageLimitMB,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  processPaymentUpgrade,
};