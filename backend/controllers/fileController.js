const path = require('path');
const fs = require('fs').promises;
const {
  readMetadata,
  writeMetadata,
  findFileById,
  removeFileById,
} = require('../utils/fileHelper');
const {
  readUsers,
  writeUsers,
  findUserById,
} = require('../utils/userHelper');
const { appendLog } = require('../utils/logHelper');
const { sendStorageWarningEmail } = require('../utils/emailService');

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Check storage limit
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const fileSizeMB = Math.round(req.file.size / 1024 / 1024 * 100) / 100;
    const currentUsedMB = user.usedStorageMB || 0;
    const limitMB = user.storageLimitMB || 100;

    if (currentUsedMB + fileSizeMB > limitMB) {
      // Delete the uploaded file since it won't be stored
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        // Ignore deletion errors
      }
      const remainingMB = (limitMB - currentUsedMB).toFixed(1);
      return res.status(413).json({
        success: false,
        message: `Storage limit exceeded. You have ${remainingMB}MB remaining. Upgrade to Premium for more storage.`,
      });
    }

    const metadata = {
      id: req.file.filename.split('.')[0],
      userId: req.user.id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: Math.round(req.file.size / 1024),
      fileSizeMB: fileSizeMB,
      filePath: path.join('uploads', req.file.filename),
      uploadDate: new Date().toISOString(),
    };

    const files = await readMetadata();
    files.push(metadata);
    await writeMetadata(files);

    // Update user's used storage
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === req.user.id);
    let updatedUser;
    if (userIndex !== -1) {
      users[userIndex].usedStorageMB = parseFloat((currentUsedMB + fileSizeMB).toFixed(2));
      updatedUser = users[userIndex];
      await writeUsers(users);
    }

    await appendLog({
      id: `${metadata.id}-${Date.now()}`,
      userId: req.user.id,
      action: 'upload',
      details: {
        fileName: metadata.originalName,
        fileSizeMB,
      },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    if (updatedUser) {
      const usage = updatedUser.usedStorageMB || 0;
      const limit = updatedUser.storageLimitMB || 100;
      if (usage / limit >= 0.8) {
        await sendStorageWarningEmail(updatedUser.email, updatedUser.name, usage, limit);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: metadata,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAllFiles(req, res, next) {
  try {
    const files = await readMetadata();
    const userFiles = files.filter((file) => file.userId === req.user.id);
    const sortedFiles = userFiles.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    return res.json({ success: true, data: sortedFiles });
  } catch (error) {
    return next(error);
  }
}

async function getFileById(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'File ID is required.' });
    }

    const file = await findFileById(id);
    if (!file || file.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    return res.json({ success: true, data: file });
  } catch (error) {
    return next(error);
  }
}

async function downloadFile(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'File ID is required.' });
    }

    const file = await findFileById(id);
    if (!file || file.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const fileLocation = path.join(__dirname, '..', file.filePath);
    try {
      await fs.access(fileLocation);
    } catch (err) {
      return res.status(404).json({ success: false, message: 'Stored file is missing.' });
    }

    return res.download(fileLocation, file.originalName, (err) => {
      if (err) {
        next(err);
      }
    });
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

    const file = await findFileById(id);
    if (!file || file.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const fileLocation = path.join(__dirname, '..', file.filePath);
    try {
      await fs.unlink(fileLocation);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        return next(err);
      }
    }

    await removeFileById(id);

    await appendLog({
      id: `${file.id}-${Date.now()}`,
      userId: req.user.id,
      action: 'delete',
      details: {
        fileName: file.originalName,
        fileSizeMB: file.fileSizeMB || Math.round(file.fileSize / 1024 / 1024 * 100) / 100,
      },
      timestamp: new Date().toISOString(),
      ip: req.ip,
    });

    // Subtract file size from user's used storage
    const user = await findUserById(req.user.id);
    if (user) {
      const fileSizeMB = file.fileSizeMB || Math.round(file.fileSize / 1024 / 1024 * 100) / 100;
      const currentUsedMB = user.usedStorageMB || 0;
      const newUsedMB = Math.max(0, currentUsedMB - fileSizeMB);

      const users = await readUsers();
      const userIndex = users.findIndex((u) => u.id === req.user.id);
      if (userIndex !== -1) {
        users[userIndex].usedStorageMB = parseFloat(newUsedMB.toFixed(2));
        await writeUsers(users);
      }
    }

    return res.json({ success: true, message: 'File deleted successfully.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadFile,
  getAllFiles,
  getFileById,
  downloadFile,
  deleteFile,
};
