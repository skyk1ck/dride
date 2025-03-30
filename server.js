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

// Create an express app
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const uploadDir = path.join(__dirname, 'uploads');

// Create the server and attach Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:5173', // Allow requests from your frontend
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  }
});

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow requests from your frontend
  methods: ['GET', 'POST', 'DELETE'], // Allow DELETE method
  credentials: true,
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // MySQL username
  password: '', // MySQL password
  database: 'education_platform',
});

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create uploads directory if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Connect to MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the MySQL database:', err);
    process.exit(1); // Exit if the DB connection fails
  }
  console.log('Connected to the MySQL database.');
});

// Helper functions for JWT generation and authentication
const generateToken = (id, isAdmin = false) => {
  return jwt.sign({ id, isAdmin }, 'your-secret-key', { expiresIn: '7d' });
};

const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Token is missing or malformed. Please provide a valid token.',
    });
  }

  const actualToken = token.split(' ')[1]; // Extract token after 'Bearer '

  // Verify the token
  jwt.verify(actualToken, 'your-secret-key', (err, user) => {
    if (err) {
      console.log('Invalid token:', err);
      return res.status(403).json({
        message: 'Invalid token. Please provide a valid token.',
      });
    }
    req.user = user; // Attach user info to the request object
    next(); // Continue to the next middleware
  });
};

// Users fetch (for admin access only)
app.get('/api/users', authenticateJWT, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  try {
    const [users] = await db.promise().query('SELECT id, username, email, created_at FROM users');
    res.status(200).json(users); // Send users data in the response
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Register user route
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error registering user');
    }
    const token = generateToken(result.insertId);
    res.status(201).json({ message: 'User registered successfully', token });
  });
});

// Login user route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Error logging in');
    }
    if (results.length === 0) {
      return res.status(404).send('User not found');
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).send('Invalid credentials');
    }

    const token = generateToken(user.id, user.isAdmin); // Pass user.isAdmin flag
    res.status(200).json({ message: 'Login successful', token, user });
  });
});

// Fetch all news articles
app.get('/api/news', async (req, res) => {
  try {
    const [news] = await db.promise().query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(news);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Error fetching news' });
  }
});

// Add a new news article
app.post('/api/news', authenticateJWT, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Both title and content are required' });
  }

  try {
    const query = 'INSERT INTO news (title, content) VALUES (?, ?)';
    const [result] = await db.promise().query(query, [title, content]);
    res.status(201).json({ message: 'News added successfully', id: result.insertId });
  } catch (err) {
    console.error('Error adding news:', err);
    res.status(500).json({ error: 'Error adding news' });
  }
});

// POST request to save a new chat message
app.post('/api/chat_messages', authenticateJWT, async (req, res) => {
  const { message } = req.body; // The message content sent by the client
  const { user_id } = req.user || {}; // Get the user_id from the authenticated user (if any)

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    // Insert the message into the chat_messages table
    const query = 'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)';
    const [result] = await db.promise().query(query, [user_id || null, message.trim()]);

    // Respond with the saved message and its details
    res.status(201).json({
      message: 'Chat message saved successfully',
      data: {
        id: result.insertId,
        user_id: user_id || null, // If the user is a guest, user_id will be null
        message: message.trim(),
        created_at: new Date().toISOString(),
      },
    });

    // Emit the new message to all connected clients via socket
    io.emit('message', {
      id: result.insertId,
      user_id: user_id || null,
      message: message.trim(),
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: 'Error saving chat message' });
  }
});

// Delete a news article
app.delete('/api/news/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  if (!req.user.isAdmin) {
    return res.status(403).send('Permission denied');
  }

  try {
    const result = await db.promise().query('DELETE FROM news WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }
    res.status(200).json({ message: 'News deleted successfully' });
  } catch (err) {
    console.error('Error deleting news:', err);
    res.status(500).json({ error: 'Error deleting news' });
  }
});

// Fetch courses with optional category filter
app.get('/api/courses', async (req, res) => {
  const { category } = req.query; // Get category from query parameter
  
  try {
    let query = 'SELECT * FROM courses';
    let queryParams = [];

    if (category) {
      query += ' WHERE category = ?';
      queryParams.push(category);
    }

    query += ' ORDER BY created_at DESC';

    const [courses] = await db.promise().query(query, queryParams);
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Error fetching courses' });
  }
});

// Add a new course (with category and video_url)
app.post('/api/courses', authenticateJWT, async (req, res) => {
  const { title, description, category, video_url } = req.body;

  if (!title || !description || !category || !video_url) {
    return res.status(400).json({ error: 'Title, description, category, and video_url are required' });
  }

  try {
    const query = 'INSERT INTO courses (title, description, category, video_url) VALUES (?, ?, ?, ?)';
    const [result] = await db.promise().query(query, [title, description, category, video_url]);
    res.status(201).json({ message: 'Course added successfully', id: result.insertId });
  } catch (err) {
    console.error('Error adding course:', err);
    res.status(500).json({ error: 'Error adding course' });
  }
});

// Delete a course
app.delete('/api/courses/:id', authenticateJWT, async (req, res) => {
  const { id } = req.params;

  if (!req.user.isAdmin) {
    return res.status(403).send('Permission denied');
  }

  try {
    const result = await db.promise().query('DELETE FROM courses WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Error deleting course' });
  }
});

// Starting the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

































