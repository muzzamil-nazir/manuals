const fs = require('fs').promises;
const path = require('path');

const databaseDir = path.join(__dirname, '..', 'database');
const logsFile = path.join(databaseDir, 'logs.json');

async function ensureLogsExists() {
  try {
    await fs.mkdir(databaseDir, { recursive: true });
    try {
      await fs.access(logsFile);
    } catch (err) {
      await fs.writeFile(logsFile, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    throw new Error('Unable to initialize logs storage.');
  }
}

async function readLogs() {
  await ensureLogsExists();
  const raw = await fs.readFile(logsFile, 'utf-8');
  return JSON.parse(raw || '[]');
}

async function writeLogs(logs) {
  await ensureLogsExists();
  await fs.writeFile(logsFile, JSON.stringify(logs, null, 2), 'utf-8');
}

async function appendLog(logEntry) {
  if (!logEntry || typeof logEntry !== 'object') {
    throw new Error('Invalid log entry.');
  }
  const logs = await readLogs();
  logs.push(logEntry);
  await writeLogs(logs);
}

module.exports = {
  ensureLogsExists,
  readLogs,
  writeLogs,
  appendLog,
};
