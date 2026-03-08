require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const spendsRoutes = require('./routes/spends');
const insightsRoutes = require('./routes/insights');
const clientsRoutes = require('./routes/clients');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/spends', spendsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/clients', clientsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Real-time updates via Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', ({ clientId, platforms }) => {
    socket.join(`client-${clientId}`);
    console.log(`Socket ${socket.id} subscribed to client ${clientId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate real-time data updates every 30 seconds
function broadcastLiveUpdates() {
  const { db } = require('./database');
  const clients = db.prepare('SELECT id FROM clients').all();
  const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];

  for (const client of clients) {
    const liveData = {};
    for (const platform of platforms) {
      const latest = db.prepare(`
        SELECT * FROM analytics_snapshots
        WHERE client_id = ? AND platform = ?
        ORDER BY date DESC LIMIT 1
      `).get(client.id, platform);

      if (latest) {
        liveData[platform] = {
          followers: latest.followers + Math.floor(Math.random() * 10),
          impressions: latest.impressions + Math.floor(Math.random() * 500),
          engagement: latest.engagement + Math.floor(Math.random() * 20),
          reach: latest.reach + Math.floor(Math.random() * 300),
          timestamp: new Date().toISOString(),
        };
      }
    }

    io.to(`client-${client.id}`).emit('live-update', {
      clientId: client.id,
      data: liveData,
      timestamp: new Date().toISOString(),
    });
  }
}

setInterval(broadcastLiveUpdates, 30000);

// Initialize DB and start server
initDatabase();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
