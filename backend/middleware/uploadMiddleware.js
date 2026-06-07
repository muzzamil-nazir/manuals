const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${extension}`;
    cb(null, uniqueName);
  },
});

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const blockedExtensions = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.scr', '.vbs', '.com', '.pif', '.msi', '.jar', '.app', '.deb', '.rpm', '.dmg', '.pkg',
];

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (blockedExtensions.includes(extension)) {
    return cb(new Error(`Executable files (${extension}) are not allowed.`));
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed types: PNG, JPG, JPEG, PDF, DOC, DOCX, TXT.'));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
