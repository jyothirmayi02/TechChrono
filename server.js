const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
// app.use(express.json()); // Only use JSON parser for JSON-only routes below
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Initialize MySQL database connection
const db = mysql.createConnection({
  host: '127.0.0.1', // replace with your MySQL host
  user: 'root', // replace with your MySQL user
  password: 'Simmi@123', // replace with your MySQL password
  database: 'realproject' // replace with your MySQL database name
});

db.connect((err) => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1);
  } else {
    console.log('Connected to MySQL database!');
  }
});

// Create tables if they don't exist
const createTables = () => {
  db.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    college VARCHAR(255),
    phone VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => { if (err) console.error('Error creating users table:', err); });

  db.query(`CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    is_paid BOOLEAN DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    max_participants INT,
    image_url VARCHAR(255),
    creator_id INT,
    category VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  )`, (err) => { if (err) console.error('Error creating events table:', err); });

  db.query(`CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_id INT,
    payment_status VARCHAR(50) DEFAULT 'pending',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  )`, (err) => { if (err) console.error('Error creating registrations table:', err); });

  db.query(`CREATE TABLE IF NOT EXISTS discussions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    user_id INT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, (err) => { if (err) console.error('Error creating discussions table:', err); });

  db.query(`CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`, (err) => { if (err) console.error('Error creating notifications table:', err); });
};

createTables();

/*--- Continue with the rest of your Express routes, replacing db.run/db.get/db.all with db.query ---

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    college TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Events table
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    is_paid BOOLEAN DEFAULT 0,
    price REAL DEFAULT 0,
    max_participants INTEGER,
    image_url TEXT,
    creator_id INTEGER,
    category TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users (id)
  )`);

  // Registrations table
  db.run(`CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event_id INTEGER,
    payment_status TEXT DEFAULT 'pending',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (event_id) REFERENCES events (id),
    UNIQUE(user_id, event_id)
  )`);

  // Discussions table
  db.run(`CREATE TABLE IF NOT EXISTS discussions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER,
    user_id INTEGER,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});*/

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Auth routes
app.post('/api/register', express.json(), async (req, res) => {
  try {
    const { username, email, password, fullName, college, phone } = req.body;
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, email, password, full_name, college, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, fullName, college, phone],
      (err, result) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }
        const userId = result.insertId;
        const token = jwt.sign({ userId, username }, JWT_SECRET);
        res.json({ token, user: { id: userId, username, email, fullName } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    const user = results && results.length > 0 ? results[0] : null;
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name
      }
    });
  });
});

// Event routes
app.get('/api/events', (req, res) => {
  const { search, category } = req.query;
  let query = `
    SELECT e.*, u.username as creator_name, u.full_name as creator_full_name,
           COUNT(r.id) as participant_count
    FROM events e 
    LEFT JOIN users u ON e.creator_id = u.id 
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  query += ' GROUP BY e.id ORDER BY e.date ASC';

  db.query(query, params, (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching events' });
    }
    res.json(events);
  });
});

app.get('/api/events/:id', (req, res) => {
  const eventId = req.params.id;
  
  db.query(`
    SELECT e.*, u.username as creator_name, u.full_name as creator_full_name,
           COUNT(r.id) as participant_count
    FROM events e 
    LEFT JOIN users u ON e.creator_id = u.id 
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.id = ?
    GROUP BY e.id
  `, [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching event' });
    }
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(results[0]);
  });
});

app.post('/api/events', authenticateToken, upload.single('image'), (req, res) => {
  // Defensive: Check if req.body is undefined (middleware conflict or malformed request)
  if (!req.body) {
    console.error('req.body is undefined!');
    return res.status(400).json({ error: 'Malformed form data or middleware conflict' });
  }
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);
  console.log('USER:', req.user);
  const {
    title, description, location, date, time, is_paid, price,
    max_participants, category, contact_email, contact_phone
  } = req.body;

  // Convert empty strings to null for numeric fields
  const maxParticipantsValue = max_participants === '' ? null : max_participants;
  const priceValue = price === '' ? 0 : price;

  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.query(
    `INSERT INTO events (title, description, location, date, time, is_paid, price, 
                       max_participants, image_url, creator_id, category, contact_email, contact_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title, description, location, date, time, is_paid === 'true' ? 1 : 0, priceValue,
      maxParticipantsValue, imageUrl, req.user.userId, category, contact_email, contact_phone
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error creating event' });
      }
      res.json({ id: result.insertId, message: 'Event created successfully' });
    }
  );
});

app.put('/api/events/:id', authenticateToken, upload.single('image'), (req, res) => {
  const eventId = req.params.id;
  const {
    title, description, location, date, time, is_paid, price,
    max_participants, category, contact_email, contact_phone
  } = req.body;
  
  // Check if user owns the event
  db.query('SELECT creator_id FROM events WHERE id = ?', [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking event ownership' });
    }
    const event = results && results.length > 0 ? results[0] : null;
    if (!event || event.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }
    let query = `UPDATE events SET title = ?, description = ?, location = ?, date = ?, time = ?, is_paid = ?, price = ?, max_participants = ?, category = ?, contact_email = ?, contact_phone = ?`;
    let params = [
      title, description, location, date, time, is_paid === 'true' ? 1 : 0, price || 0,
      max_participants, category, contact_email, contact_phone
    ];
    if (req.file) {
      query += ', image_url = ?';
      params.push(`/uploads/${req.file.filename}`);
    }
    query += ' WHERE id = ?';
    params.push(eventId);
    db.query(query, params, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error updating event' });
      }
      res.json({ message: 'Event updated successfully' });
    });
  });
});

app.delete('/api/events/:id', authenticateToken, (req, res) => {
  const eventId = req.params.id;
  
  // Check if user owns the event
  db.query('SELECT creator_id FROM events WHERE id = ?', [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error checking event ownership' });
    }
    const event = results && results.length > 0 ? results[0] : null;
    if (!event || event.creator_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }
    db.query('DELETE FROM events WHERE id = ?', [eventId], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting event' });
      }
      res.json({ message: 'Event deleted successfully' });
    });
  });
});

// Registration routes
app.post('/api/events/:id/register', authenticateToken, (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.userId;
  
  db.query(
    'INSERT INTO registrations (user_id, event_id, payment_status) VALUES (?, ?, ?)',
    [userId, eventId, 'completed'],
    function(err) {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Already registered for this event' });
        }
        console.error('Error registering for event:', err);
        return res.status(500).json({ error: 'Error registering for event' });
      }
      res.json({ message: 'Successfully registered for event' });
    }
  );
});

app.delete('/api/events/:id/register', authenticateToken, (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.userId;
  
  db.query(
    'DELETE FROM registrations WHERE user_id = ? AND event_id = ?',
    [userId, eventId],
    function(err, result) {
      if (err) {
        return res.status(500).json({ error: 'Error unregistering from event' });
      }
      if (result.affectedRows === 0) {
        return res.status(400).json({ error: 'Not registered for this event' });
      }
      res.json({ message: 'Successfully unregistered from event' });
    }
  );
});

// User dashboard routes
app.get('/api/user/created-events', authenticateToken, (req, res) => {
  db.query(`
    SELECT e.*, COUNT(r.id) as participant_count
    FROM events e 
    LEFT JOIN registrations r ON e.id = r.event_id
    WHERE e.creator_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `, [req.user.userId], (err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching created events' });
    }

    if (events.length === 0) {
        return res.json([]);
    }

    const eventsWithParticipants = events.map(async (event) => {
        const participants = await new Promise((resolve, reject) => {
            db.query(`
                SELECT u.username 
                FROM registrations r
                JOIN users u ON r.user_id = u.id
                WHERE r.event_id = ?
            `, [event.id], (err, participants) => {
                if (err) return reject(err);
                resolve(participants);
            });
        });
        return { ...event, participants };
    });

    Promise.all(eventsWithParticipants)
        .then(results => res.json(results))
        .catch(err => res.status(500).json({ error: 'Error fetching participants' }));
  });
});

app.get('/api/user/registered-events', authenticateToken, (req, res) => {
  db.query(`
    SELECT e.*, r.registered_at, r.payment_status
    FROM events e 
    JOIN registrations r ON e.id = r.event_id
    WHERE r.user_id = ?
    ORDER BY r.registered_at DESC
  `, [req.user.userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching registered events' });
    }
    res.json(results);
  });
});

// Participants for an event
app.get('/api/events/:id/participants', authenticateToken, (req, res) => {
  const eventId = req.params.id;
  db.query(`
    SELECT u.username, u.email, r.registered_at
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    WHERE r.event_id = ?
    ORDER BY r.registered_at ASC
  `, [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching participants' });
    }
    res.json(results);
  });
});

// Discussions
app.get('/api/events/:id/discussions', (req, res) => {
  const eventId = req.params.id;
  
  db.query(`
    SELECT d.*, u.username, u.full_name
    FROM discussions d
    JOIN users u ON d.user_id = u.id
    WHERE d.event_id = ?
    ORDER BY d.created_at ASC
  `, [eventId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching discussions' });
    }
    res.json(results);
  });
});

app.post('/api/events/:id/discussions', authenticateToken, (req, res) => {
  const eventId = req.params.id;
  const { message } = req.body;
  
  db.query(
    'INSERT INTO discussions (event_id, user_id, message) VALUES (?, ?, ?)',
    [eventId, req.user.userId, message],
    function(err, result) {
      if (err) {
        return res.status(500).json({ error: 'Error posting discussion' });
      }
      res.json({ id: result.insertId, message: 'Discussion posted successfully' });
    }
  );
});

// Notifications
app.get('/api/notifications', authenticateToken, (req, res) => {
  db.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching notifications' });
      }
      res.json(results);
    }
  );
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/explore', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'explore.html'));
});

app.get('/create-event', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-event.html'));
});

app.get('/my-events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-events.html'));
});

app.get('/registered-events', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'registered-events.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.listen(PORT, () => {
  console.log(`TechChrono server running on port ${PORT}`);
});