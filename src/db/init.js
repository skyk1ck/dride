import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database
const db = new Database('src/db/education.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Insert sample data
const sampleData = [
  // Sample users
  db.prepare(`INSERT OR IGNORE INTO users (username, email, password) VALUES (?, ?, ?)`),
  
  // Sample courses
  db.prepare(`
    INSERT OR IGNORE INTO courses (title, category, description, video_url) 
    VALUES (?, ?, ?, ?)
  `),
  
  // Sample news
  db.prepare(`INSERT OR IGNORE INTO news (title, content) VALUES (?, ?)`),
];

// Insert a sample user
sampleData[0].run('admin1', 'admin1@example.com', 'admin1');

// Insert a sample course
const courseId = sampleData[1].run(
  'Introduction to Web Development',
  'IT & Software',
  'Learn the basics of web development',
  'https://example.com/video'
).lastInsertRowid;

// Insert sample syllabus items
const syllabusStmt = db.prepare(`
  INSERT INTO syllabus_items (course_id, content, position) 
  VALUES (?, ?, ?)
`);

['HTML Basics', 'CSS Fundamentals', 'JavaScript Introduction'].forEach((item, index) => {
  syllabusStmt.run(courseId, item, index + 1);
});

// Insert sample news
sampleData[2].run(
  'New Course Available',
  'Check out our latest web development course!'
);

console.log('Database initialized with sample data!');