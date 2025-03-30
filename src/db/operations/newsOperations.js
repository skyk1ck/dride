import { getDb, saveToLocalStorage } from '../core';

export const getNews = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM news ORDER BY created_at DESC');
  const news = [];
  while (stmt.step()) {
    news.push(stmt.getAsObject());
  }
  stmt.free();
  return news;
};

export const createNews = (title, content) => {
  const db = getDb();
  try {
    db.run('INSERT INTO news (title, content) VALUES (?, ?)', [title, content]);
    saveToLocalStorage();
    return true;
  } catch (err) {
    console.error('Error creating news:', err);
    return false;
  }
};