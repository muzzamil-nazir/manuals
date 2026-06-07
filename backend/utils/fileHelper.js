const fs = require('fs').promises;
const path = require('path');

const databaseDir = path.join(__dirname, '..', 'database');
const databaseFile = path.join(databaseDir, 'files.json');

async function ensureDatabaseExists() {
  try {
    await fs.mkdir(databaseDir, { recursive: true });
    try {
      await fs.access(databaseFile);
    } catch (err) {
      await fs.writeFile(databaseFile, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    throw new Error('Unable to initialize database storage.');
  }
}

async function readMetadata() {
  await ensureDatabaseExists();
  const raw = await fs.readFile(databaseFile, 'utf-8');
  return JSON.parse(raw || '[]');
}

async function writeMetadata(metadata) {
  await ensureDatabaseExists();
  await fs.writeFile(databaseFile, JSON.stringify(metadata, null, 2), 'utf-8');
}

async function findFileById(id) {
  const files = await readMetadata();
  return files.find((item) => item.id === id);
}

async function removeFileById(id) {
  const files = await readMetadata();
  const filtered = files.filter((item) => item.id !== id);
  await writeMetadata(filtered);
  return filtered.length !== files.length;
}

module.exports = {
  databaseDir,
  databaseFile,
  ensureDatabaseExists,
  readMetadata,
  writeMetadata,
  findFileById,
  removeFileById,
};
