const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const emailRoutes = require('./routes/emailRoutes');
const apiLimiter = require('./middleware/rateLimitMiddleware');
const { securityHeaders, setSecureHeaders } = require('./middleware/securityMiddleware');
const { ensureDatabaseExists } = require('./utils/fileHelper');
const { ensureUsersExists } = require('./utils/userHelper');
const { ensureLogsExists } = require('./utils/logHelper');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

async function startServer() {
  await ensureDatabaseExists();
  await ensureUsersExists();
  await ensureLogsExists();

  app.use(securityHeaders);
  app.use(setSecureHeaders);
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/payment', paymentRoutes);
  app.use('/api/email', emailRoutes);
  app.use('/api', fileRoutes);

  app.use((err, req, res, next) => {
    console.error(err);
    if (err.message && err.message.includes('Unsupported file type')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  });

  app.listen(PORT, () => {
    console.log(`Manual Upload backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
