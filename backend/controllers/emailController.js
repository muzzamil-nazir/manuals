const { sendTestEmail } = require('../utils/emailService');
const validator = require('validator');

async function testEmail(req, res, next) {
  try {
    const requestEmail = (req.body.email || req.user?.email || '').trim().toLowerCase();
    if (!requestEmail || !validator.isEmail(requestEmail)) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const result = await sendTestEmail(requestEmail);
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Failed to send test email.', error: result.error });
    }

    return res.json({ success: true, message: 'Test email sent successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  testEmail,
};