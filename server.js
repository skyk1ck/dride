import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  }
});

const uploadDir = path.join(__dirname, 'uploads');
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true,
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'education_platform',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL.');
});

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

dotenv.config();

// JWT Token Generation
const generateToken = (user) => {
  console.log('Generating token for user:', user);

  const payload = {
    id: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60),  
  };

  console.log('Payload:', payload);

  const secret = process.env.JWT_SECRET;

  const token = jwt.sign(payload, secret);

  console.log('Generated Token:', token);

  return token;
};


const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  console.log('Auth header:', req.headers['authorization']);
  console.log('Extracted token:', token);

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  const secret = process.env.JWT_SECRET || 'fallbackSecret';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.log('Token verification error:', err);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    req.user = decoded;
    console.log('Token verified successfully. User:', decoded);
    next();
  });
};




const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user; 

    if (!user || !user.role) {
      return res.status(400).json({ message: 'User role is missing or user is not authenticated' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();  
  };
};



app.post('/api/register', async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [existing] = await db.promise().query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length) return res.status(409).json({ message: 'Username exists' });

    const [result] = await db.promise().query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );
    const token = generateToken(result.insertId, role);
    res.status(201).json({ message: 'Registered', token });
  } catch (err) {
    res.status(500).json({ message: 'Registration error' });
  }
});


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    
    const [users] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);

    
    if (!users.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

   
    const valid = await bcrypt.compare(password, user.password);

   
    if (!valid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = generateToken(user);
    
    // Respond with the success message, token, and user data
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err); 
    res.status(500).json({ message: 'Login error' });
  }
});



app.get('/api/users', authenticateJWT, checkRole('admin'), async (req, res) => {
  try {
    const [users] = await db.promise().query('SELECT id, username, email, role, created_at FROM users');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});


app.get('/api/news', async (req, res) => {
  try {
    const [news] = await db.promise().query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching news' });
  }
});


app.post('/api/news', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    console.error('[API] Missing title or content.');
    return res.status(400).json({ error: 'Title and content required' });
  }

  try {
    console.log('[API] Received news data:', { title, content });

    const [result] = await db.promise().query(
      'INSERT INTO news (title, content) VALUES (?, ?)',
      [title, content]
    );

    console.log('[API] News added with ID:', result.insertId); 
    res.status(201).json({ message: 'News added', id: result.insertId });
  } catch (err) {
    // Log the error details, including SQL error specifics
    console.error('[API] Error adding news:', err);

    if (err.sqlMessage) {
      console.error('[API] SQL Error Message:', err.sqlMessage);
      console.error('[API] SQL State:', err.sqlState);
      console.error('[API] SQL Code:', err.code);
    } else {
      console.error('[API] General Error:', err.message);
    }

    res.status(500).json({ error: 'Error adding news' });
  }
});







app.delete('/api/news/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query('DELETE FROM news WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'News not found' });
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting news' });
  }
});



app.get('/api/courses', async (req, res) => {
  try {
   
    const [courses] = await db.promise().query('SELECT * FROM courses');

    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses found' });
    }

    
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ message: 'Error fetching courses' });
  }
});

app.post('/api/courses', authenticateJWT, checkRole('admin'), async (req, res) => {
  const { title, category, description, video_url, syllabus, instructors } = req.body;

  // Validate required fields
  if (!title || !category || !description || !video_url || !syllabus || !instructors) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
   
    const [result] = await db.promise().query(
      'INSERT INTO courses (title, category, description, video_url, syllabus, instructors) VALUES (?, ?, ?, ?, ?, ?)',
      [title, category, description, video_url, syllabus, instructors]
    );

   
    res.status(201).json({
      message: 'Course created successfully',
      courseId: result.insertId
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Error creating course' });
  }
});







app.delete('/api/courses/:id', async (req, res) => {
  const courseId = req.params.id;

  try {
    const [result] = await db.promise().query('DELETE FROM courses WHERE id = ?', [courseId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ message: 'Error deleting course' });
  }
});


app.get('/api/courses/:id', async (req, res) => {
  const courseId = req.params.id;

  try {
    const [course] = await db.promise().query('SELECT * FROM courses WHERE id = ?', [courseId]);

    if (course.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course[0]);
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ message: 'Error fetching course' });
  }
});
app.post('/api/courses/:id/comments', (req, res) => {
  const courseId = req.params.id;
  const { username, text } = req.body;
});

app.get('/api/courses/:id/comments', async (req, res) => {
  const courseId = req.params.id;

  try {
    const [comments] = await db.promise().query('SELECT * FROM comments WHERE course_id = ?', [courseId]);

    res.status(200).json(comments);
  } catch (err) {
    console.error('Error fetching course comments:', err);
    res.status(500).json({ message: 'Error fetching course comments' });
  }
});
app.post('/api/courses/:courseId/rate', authenticateJWT, (req, res) => {
  const { courseId } = req.params;
  const { rating } = req.body;

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
  }

  const course = courses.find(course => course.id === parseInt(courseId));
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }

  course.ratings.push(rating);
  course.rating = course.ratings.reduce((sum, r) => sum + r, 0) / course.ratings.length;

  res.status(200).json({ courseId: course.id, newRating: course.rating });
});


app.get('/api/courses/:id/saved', authenticateJWT, async (req, res) => {
  const courseId = parseInt(req.params.id);
  const userId = req.user.id;

  console.log(`Checking saved status for user ${userId} and course ${courseId}`);

  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM saved_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    console.log('Query result:', rows);

    res.json({ saved: rows.length > 0 });
  } catch (error) {
    console.error('Error checking saved status:', error);
    res.status(500).json({ message: 'Error checking saved status' });
  }
});

app.get('/api/courses/:id/saved-count', async (req, res) => {
  const courseId = parseInt(req.params.id);

  try {
    const [rows] = await db.promise().query(
      'SELECT COUNT(*) AS count FROM saved_courses WHERE course_id = ?',
      [courseId]
    );

    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error getting saved count:', error);
    res.status(500).json({ message: 'Error getting saved count' });
  }
});

app.get('/api/users/saved-courses', authenticateJWT, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.promise().query(
      `SELECT courses.* 
       FROM saved_courses 
       JOIN courses ON saved_courses.course_id = courses.id 
       WHERE saved_courses.user_id = ?`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching saved courses:', error);
    res.status(500).json({ message: 'Error fetching saved courses' });
  }
});


app.post('/api/courses/:id/save', authenticateJWT, async (req, res) => {
  const courseId = parseInt(req.params.id);
  const userId = req.user.id;  

  try {
    const [course] = await db.promise().query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) {
      return res.status(404).send('Course not found');
    }

    const [user] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).send('User not found');
    }

    const [existingSavedCourse] = await db.promise().query(
      'SELECT * FROM saved_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    if (existingSavedCourse.length > 0) {
      return res.status(400).json({ message: 'Course already saved' });
    }

    await db.promise().query(
      'INSERT INTO saved_courses (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    );

    return res.status(200).json({ message: 'Course saved successfully' });

  } catch (err) {
    console.error('Error saving course:', err);
    res.status(500).json({ message: 'Error saving course' });
  }
});
app.delete('/api/courses/:id/save', authenticateJWT, async (req, res) => {
  const courseId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM saved_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Course not saved' });
    }

    res.status(200).json({ message: 'Course unsaved successfully' });
  } catch (err) {
    console.error('Error unsaving course:', err);
    res.status(500).json({ message: 'Error unsaving course' });
  }
});



app.post('/api/courses/:id/enroll', authenticateJWT, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.id;

  try {
    const [existing] = await db.promise().query(
      'SELECT * FROM enrolled_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    if (existing.length) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    await db.promise().query(
      'INSERT INTO enrolled_courses (user_id, course_id) VALUES (?, ?)',
      [userId, courseId]
    );

    res.status(201).json({ message: 'Successfully enrolled in course' });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ error: 'Error enrolling in course' });
  }
});


app.post('/api/courses/:id/unenroll', authenticateJWT, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.id;

  try {
    const [result] = await db.promise().query(
      'DELETE FROM enrolled_courses WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json({ message: 'Successfully unenrolled from course' });
  } catch (err) {
    console.error('Error unenrolling from course:', err);
    res.status(500).json({ error: 'Error unenrolling from course' });
  }
});



app.get('/api/chat_messages', async (req, res) => {
  try {
    const [messages] = await db.promise().query(`
      SELECT chat_messages.*, users.username, users.avatar
      FROM chat_messages
      LEFT JOIN users ON chat_messages.user_id = users.id
      ORDER BY chat_messages.created_at ASC
    `);
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

app.post('/api/chat_messages', async (req, res) => {
  const { message } = req.body;
  
  const user_id = req.user?.id || null; 

  // Validate message
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  try {
   
    const [result] = await db.promise().query(
      'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)', 
      [user_id, message.trim()]
    );

    
    const [rows] = await db.promise().query(
      `SELECT chat_messages.*, users.username, users.avatar 
       FROM chat_messages 
       LEFT JOIN users ON chat_messages.user_id = users.id 
       WHERE chat_messages.id = ?`, [result.insertId]
    );

    const newMsg = rows[0];

    
    io.emit('message', newMsg);

    
    res.status(201).json({ message: 'Message saved', data: newMsg });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Error saving message' });
  }
});




const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});






































