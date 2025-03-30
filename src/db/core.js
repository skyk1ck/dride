// core.js
import initSqlJs from 'sql.js';
import schema from './schema'; // Импортируем схему из файла schema.js в той же папке

let db = null;
let initialized = false;

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

export const saveToLocalStorage = () => {
  if (!db) return;
  const data = db.export();
  const buffer = new Uint8Array(data);
  const blob = new Blob([buffer]);
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem('education_db', reader.result);
  };
  reader.readAsDataURL(blob);
};

const loadFromLocalStorage = async () => {
  const data = localStorage.getItem('education_db');
  if (!data) return false;

  try {
    const SQL = await initSqlJs({
      locateFile: file => `https://sql.js.org/dist/${file}`
    });
    
    const binary = atob(data.split(',')[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      array[i] = binary.charCodeAt(i);
    }
    
    db = new SQL.Database(array);
    initialized = true;
    return true;
  } catch (err) {
    console.error('Error loading database:', err);
    return false;
  }
};

export const initDB = async () => {
  if (initialized) return;

  const SQL = await initSqlJs({
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  db = new SQL.Database();
  db.run(schema);
  
  // Insert sample data
  db.run(`
    INSERT OR IGNORE INTO users (username, email, password)
    VALUES ('admin1', 'admin1@example.com', 'admin1')
  `);

  initialized = true;
  saveToLocalStorage();
};

// Initialize database
(async () => {
  const loaded = await loadFromLocalStorage();
  if (!loaded) {
    await initDB();
  }
})();
