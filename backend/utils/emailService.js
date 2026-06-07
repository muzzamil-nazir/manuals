const nodemailer = require('nodemailer');

// Create transporter - using Ethereal Email for testing
// In production, replace with real SMTP (Gmail, SendGrid, etc.)
let transporter;

async function initializeEmailService() {
  // For demo/testing, create a test account
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Production email configuration
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

async function sendRegistrationEmail(email, userName) {
  try {
    if (!transporter) {
      await initializeEmailService();
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@manualupload.app',
      to: email,
      subject: 'Welcome to Manual Upload System!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Welcome to Manual Upload System</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p>Thank you for creating an account! Your account has been successfully activated.</p>
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #667eea;">Your Plan Details:</h3>
              <ul style="list-style: none; padding-left: 0;">
                <li>✓ Plan: <strong>Free</strong></li>
                <li>✓ Storage: <strong>100 MB</strong></li>
                <li>✓ File Types: PDF, Images, Documents</li>
                <li>✓ Support: Community</li>
              </ul>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>Upload and manage your files</li>
              <li>Download your files anytime</li>
              <li>Track your storage usage</li>
              <li>Upgrade to Premium for 5GB storage</li>
            </ul>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #666; font-size: 12px;">
                If you have any questions, please contact our support team.
              </p>
              <p style="color: #999; font-size: 11px;">
                © 2026 Manual Upload System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Registration email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send registration email:', error);
    return { success: false, error: error.message };
  }
}

async function sendPaymentSuccessEmail(email, userName, plan) {
  try {
    if (!transporter) {
      await initializeEmailService();
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@manualupload.app',
      to: email,
      subject: 'Payment Successful - Welcome to Premium!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>✓ Payment Successful!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p>Thank you for upgrading to Premium! Your account has been successfully upgraded.</p>
            
            <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #28a745;">New Premium Benefits:</h3>
              <ul style="list-style: none; padding-left: 0;">
                <li>✓ Storage: <strong>5,000 MB (5 GB)</strong></li>
                <li>✓ Priority File Processing</li>
                <li>✓ Faster Uploads</li>
                <li>✓ Extended File Retention</li>
                <li>✓ Priority Support</li>
              </ul>
            </div>
            
            <p><strong>Plan Details:</strong></p>
            <ul>
              <li>Plan: Premium</li>
              <li>Billing: Monthly</li>
              <li>Next Renewal: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
            </ul>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #666; font-size: 12px;">
                Thank you for supporting us!
              </p>
              <p style="color: #999; font-size: 11px;">
                © 2026 Manual Upload System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send payment email:', error);
    return { success: false, error: error.message };
  }
}

async function sendStorageWarningEmail(email, userName, usage, limit) {
  try {
    if (!transporter) {
      await initializeEmailService();
    }

    const percentage = Math.round((usage / limit) * 100);

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@manualupload.app',
      to: email,
      subject: `⚠️ Storage Warning - ${percentage}% Full`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f5a623 0%, #f5576c 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>⚠️ Storage Warning</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${userName}</strong>,</p>
            
            <p>Your storage is running low. You are using <strong>${percentage}%</strong> of your available storage.</p>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #856404;">Storage Status:</h3>
              <p>
                <strong>Used:</strong> ${usage.toFixed(1)} MB<br>
                <strong>Limit:</strong> ${limit} MB<br>
                <strong>Remaining:</strong> ${(limit - usage).toFixed(1)} MB
              </p>
            </div>
            
            <p>To continue uploading files, you have two options:</p>
            <ul>
              <li>Delete some existing files to free up space</li>
              <li>Upgrade to Premium for 5,000 MB storage</li>
            </ul>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #666; font-size: 12px;">
                This is an automated notification. Please don't reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Storage warning email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send storage warning email:', error);
    return { success: false, error: error.message };
  }
}

async function sendAccountBlockedEmail(email, userName, reason, blocked = true) {
  try {
    if (!transporter) {
      await initializeEmailService();
    }

    const subject = blocked ? 'Account Blocked - Action Required' : 'Account Unblocked and Restored';
    const headerText = blocked ? 'Account Blocked' : 'Account Restored';
    const primaryText = blocked
      ? 'Your account has been temporarily blocked by our admin team.'
      : 'Your account has been restored and is now active.';
    const detailText = blocked
      ? reason || 'Violation of terms of service.'
      : reason || 'Your account is now unblocked.';
    const actionText = blocked
      ? 'During this time, you will not be able to:'
      : 'You may now:';
    const listItems = blocked
      ? ['Login to your account', 'Upload new files', 'Download files']
      : ['Login to your account', 'Upload files', 'Download files'];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@manualupload.app',
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, ${blocked ? '#f5576c 0%, #c1163a' : '#22c55e 0%, #16a34a'} 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>${headerText}</h1>
          </div>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>${primaryText}</p>
            <div style="background: ${blocked ? '#f8d7da' : '#d1fae5'}; border-left: 4px solid ${blocked ? '#f5576c' : '#10b981'}; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: ${blocked ? '#721c24' : '#064e3b'};">Reason:</h3>
              <p>${detailText}</p>
            </div>
            <p>${actionText}</p>
            <ul>
              ${listItems.map((item) => `<li>${item}</li>`).join('')}
            </ul>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #666; font-size: 12px;">
                © 2026 Manual Upload System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Account blocked email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send account blocked email:', error);
    return { success: false, error: error.message };
  }
}

async function sendTestEmail(email) {
  try {
    if (!transporter) {
      await initializeEmailService();
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@manualupload.app',
      to: email,
      subject: 'Manual Upload System - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>Manual Upload System Email Test</h1>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>This is a test email confirming your notification system is working.</p>
            <p>If you received this message, your email settings are configured correctly.</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>Thank you for using Manual Upload System.</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeEmailService,
  sendRegistrationEmail,
  sendPaymentSuccessEmail,
  sendStorageWarningEmail,
  sendAccountBlockedEmail,
  sendTestEmail,
};
