// db.js
import { getDb } from './core'; // Исправляем путь к core.js

export const getUsers = async () => {
  try {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM users');
    const users = stmt.all();
    return users;
  } catch (err) {
    console.error('Failed to load users:', err);
    throw new Error('Failed to load users');
  }
};
