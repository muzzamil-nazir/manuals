const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const {
  readUsers,
  writeUsers,
  findUserByEmail,
} = require('../utils/userHelper');
const { appendLog } = require('../utils/logHelper');
const { sendRegistrationEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'manual-upload-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '1d';

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      blocked: false,
      plan: 'free',
      storageLimitMB: 100,
      usedStorageMB: 0,
      createdAt: new Date().toISOString(),
    };

    const users = await readUsers();
    users.push(newUser);
    await writeUsers(users);

    await appendLog({
      id: uuidv4(),
      userId: newUser.id,
      action: 'register',
      details: { email: newUser.email },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    await sendRegistrationEmail(newUser.email, newUser.name);

    return res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (user.blocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    await appendLog({
      id: uuidv4(),
      userId: user.id,
      action: 'login',
      details: { email: user.email },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.json({
      success: true,
      token,
      user: {
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

module.exports = {
  register,
  login,
};
