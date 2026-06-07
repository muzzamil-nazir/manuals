const path = require('path');
const fs = require('fs').promises;
const {
  readUsers,
  writeUsers,
  findUserById,
} = require('../utils/userHelper');
const { readMetadata: readFiles, writeMetadata: writeFiles, removeFileById } = require('../utils/fileHelper');
const { readLogs, appendLog } = require('../utils/logHelper');
const { sendAccountBlockedEmail } = require('../utils/emailService');

async function getAllUsers(req, res, next) {
  try {
    const users = await readUsers();
    const sanitized = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      blocked: user.blocked || false,
      createdAt: user.createdAt,
    }));
    return res.json({ success: true, data: sanitized });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const users = await readUsers();
    const filtered = users.filter((u) => u.id !== id);
    await writeUsers(filtered);

    const files = await readFiles();
    const userFiles = files.filter((file) => file.userId === id);
    for (const file of userFiles) {
      const fileLocation = path.join(__dirname, '..', file.filePath);
      try {
        await fs.unlink(fileLocation);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }
    const filesAfter = files.filter((file) => file.userId !== id);
    await writeFiles(filesAfter);

    return res.json({ success: true, message: 'User and their files deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function blockUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    users[userIndex].blocked = true;
    await writeUsers(users);

    await appendLog({
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      action: 'block',
      details: { blockedBy: req.user.id },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    await sendAccountBlockedEmail(user.email, user.name, 'Your account was blocked by an administrator.');

    return res.json({ success: true, message: 'User blocked successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function unblockUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    const user = await findUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    users[userIndex].blocked = false;
    await writeUsers(users);

    await appendLog({
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      action: 'unblock',
      details: { unblockedBy: req.user.id },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    await sendAccountBlockedEmail(user.email, user.name, 'Your account has been unblocked by an administrator.', false);

    return res.json({ success: true, message: 'User unblocked successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getAllFiles(req, res, next) {
  try {
    const files = await readFiles();
    const users = await readUsers();
    const userMap = {};
    users.forEach((user) => {
      userMap[user.id] = user.name;
    });

    const enriched = files.map((file) => ({
      id: file.id,
      userId: file.userId,
      ownerName: userMap[file.userId] || 'Unknown',
      originalName: file.originalName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadDate: file.uploadDate,
    }));

    return res.json({ success: true, data: enriched });
  } catch (error) {
    return next(error);
  }
}

async function deleteFile(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'File ID is required.' });
    }

    const files = await readFiles();
    const file = files.find((f) => f.id === id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const fileLocation = path.join(__dirname, '..', file.filePath);
    try {
      await fs.unlink(fileLocation);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    await removeFileById(id);

    return res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const users = await readUsers();
    const files = await readFiles();

    const totalUsers = users.length;
    const totalFiles = files.length;
    const activeUsers = users.filter((u) => !u.blocked).length;
    const blockedUsers = users.filter((u) => u.blocked).length;
    const totalStorageUsed = files.reduce((sum, file) => sum + file.fileSize, 0);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalFiles,
        totalStorageUsed,
        activeUsers,
        blockedUsers,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getLogs(req, res, next) {
  try {
    const logs = await readLogs();
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.json({ success: true, data: sortedLogs });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllUsers,
  deleteUser,
  blockUser,
  unblockUser,
  getAllFiles,
  deleteFile,
  getStats,
  getLogs,
};
