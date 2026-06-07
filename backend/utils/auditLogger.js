const fs = require('fs').promises;
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'database');
const LOGS_FILE = path.join(LOGS_DIR, 'logs.json');

async function ensureLogsExist() {
  try {
    await fs.access(LOGS_FILE);
  } catch (err) {
    await fs.writeFile(LOGS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readLogs() {
  try {
    const data = await fs.readFile(LOGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

async function writeLogs(logs) {
  try {
    await fs.writeFile(LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write logs:', err);
  }
}

async function logAction(userId, action, details = {}, ip = null) {
  try {
    await ensureLogsExist();
    const logs = await readLogs();

    const logEntry = {
      id: require('uuid').v4(),
      userId: userId || 'system',
      action: action,
      details: details,
      timestamp: new Date().toISOString(),
      ip: ip || null,
    };

    logs.push(logEntry);
    await writeLogs(logs);

    return logEntry;
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}

async function getLogs(filter = {}) {
  try {
    let logs = await readLogs();

    if (filter.userId) {
      logs = logs.filter((log) => log.userId === filter.userId);
    }

    if (filter.action) {
      logs = logs.filter((log) => log.action === filter.action);
    }

    if (filter.startDate) {
      logs = logs.filter((log) => new Date(log.timestamp) >= new Date(filter.startDate));
    }

    if (filter.endDate) {
      logs = logs.filter((log) => new Date(log.timestamp) <= new Date(filter.endDate));
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Failed to get logs:', error);
    return [];
  }
}

async function getSuspiciousActivity() {
  try {
    const logs = await readLogs();
    const failedLogins = logs.filter((log) => log.action === 'login_failed');
    const suspiciousIPs = {};
    const suspiciousUsers = {};

    // Count failed logins by IP
    failedLogins.forEach((log) => {
      if (log.ip) {
        suspiciousIPs[log.ip] = (suspiciousIPs[log.ip] || 0) + 1;
      }
      if (log.userId && log.userId !== 'system') {
        suspiciousUsers[log.userId] = (suspiciousUsers[log.userId] || 0) + 1;
      }
    });

    return {
      failedLoginCount: failedLogins.length,
      suspiciousIPs: Object.entries(suspiciousIPs)
        .filter(([, count]) => count > 5)
        .map(([ip, count]) => ({ ip, failureCount: count })),
      suspiciousUsers: Object.entries(suspiciousUsers)
        .filter(([, count]) => count > 3)
        .map(([userId, count]) => ({ userId, failureCount: count })),
    };
  } catch (error) {
    console.error('Failed to get suspicious activity:', error);
    return { failedLoginCount: 0, suspiciousIPs: [], suspiciousUsers: [] };
  }
}

module.exports = {
  ensureLogsExist,
  readLogs,
  writeLogs,
  logAction,
  getLogs,
  getSuspiciousActivity,
};
