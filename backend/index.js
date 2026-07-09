require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const { QueueEvents } = require('bullmq');
const db = require('./db');

// Run DB Migrations
(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS albums (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS album_media (
        album_id INTEGER REFERENCES albums(id) ON DELETE CASCADE,
        media_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (album_id, media_id)
      );
    `);
    console.log('Database initialized.');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
})();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased for dev
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Serve static files from uploads directory for development
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const albumsRoutes = require('./routes/albums');

app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/albums', albumsRoutes);

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'KinVault API is running' });
});

// Start transcoder worker
require('./workers/transcoder');

// Setup Queue Events for real-time Socket.io updates
const queueEvents = new QueueEvents('media-transcoding', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  if (returnvalue && returnvalue.userId && returnvalue.mediaId) {
    // Broadcast to the user's room that transcoding is done
    io.to(`user_${returnvalue.userId}`).emit('transcoding-ready', {
      mediaId: returnvalue.mediaId,
      status: 'ready'
    });
  }
});

io.on('connection', (socket) => {
  // Client joins their own user room to receive their specific updates
  socket.on('join-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined room user_${userId}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
