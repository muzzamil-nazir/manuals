const fs = require('fs').promises;
const path = require('path');

const databaseDir = path.join(__dirname, '..', 'database');
const usersFile = path.join(databaseDir, 'users.json');

async function ensureUsersExists() {
  try {
    await fs.mkdir(databaseDir, { recursive: true });
    try {
      await fs.access(usersFile);
    } catch (err) {
      await fs.writeFile(usersFile, JSON.stringify([]), 'utf-8');
    }
  } catch (err) {
    throw new Error('Unable to initialize users storage.');
  }
}

async function readUsers() {
  await ensureUsersExists();
  const raw = await fs.readFile(usersFile, 'utf-8');
  return JSON.parse(raw || '[]');
}

async function writeUsers(users) {
  await ensureUsersExists();
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf-8');
}

async function findUserByEmail(email) {
  const users = await readUsers();
  return users.find((user) => user.email === email.toLowerCase());
}

async function findUserById(id) {
  const users = await readUsers();
  return users.find((user) => user.id === id);
}

module.exports = {
  ensureUsersExists,
  readUsers,
  writeUsers,
  findUserByEmail,
  findUserById,
};
