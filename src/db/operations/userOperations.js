import { getDb, saveToLocalStorage } from '../core';

export const getUsers = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users');
  const users = [];
  while (stmt.step()) {
    users.push(stmt.getAsObject());
  }
  stmt.free();
  return users;
};

export const getUserByCredentials = (username, password) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
  stmt.bind([username, password]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
};

export const createUser = (username, email, password) => {
  const db = getDb();
  try {
    db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password]);
    saveToLocalStorage();
    return true;
  } catch (err) {
    console.error('Error creating user:', err);
    return false;
  }
};