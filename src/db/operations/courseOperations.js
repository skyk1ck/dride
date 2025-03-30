import { getDb, saveToLocalStorage } from '../core';

export const getCourses = () => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM courses');
  const courses = [];
  while (stmt.step()) {
    courses.push(stmt.getAsObject());
  }
  stmt.free();
  return courses;
};

export const createCourse = (course) => {
  const db = getDb();
  try {
    const { title, category, description, videoUrl } = course;
    db.run(
      'INSERT INTO courses (title, category, description, video_url) VALUES (?, ?, ?, ?)',
      [title, category, description, videoUrl]
    );
    saveToLocalStorage();
    return true;
  } catch (err) {
    console.error('Error creating course:', err);
    return false;
  }
};