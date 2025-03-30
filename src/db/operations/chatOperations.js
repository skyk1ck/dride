import { getDb, saveToLocalStorage } from '../core';

export const getMessages = () => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT m.*, u.username, u.avatar
    FROM chat_messages m
    JOIN users u ON m.user_id = u.id
    ORDER BY m.created_at DESC
    LIMIT 100
  `);
  const messages = [];
  while (stmt.step()) {
    messages.push(stmt.getAsObject());
  }
  stmt.free();
  return messages;
};

export const createMessage = (userId, message) => {
  const db = getDb();
  try {
    db.run('INSERT INTO chat_messages (user_id, message) VALUES (?, ?)', [userId, message]);
    saveToLocalStorage();
    return true;
  } catch (err) {
    console.error('Error creating message:', err);
    return false;
  }
};