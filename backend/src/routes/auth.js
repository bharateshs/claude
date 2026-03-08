const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  let clientInfo = null;
  if (user.client_id) {
    clientInfo = db.prepare('SELECT * FROM clients WHERE id = ?').get(user.client_id);
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    client_id: user.client_id,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      client_id: user.client_id,
      client: clientInfo,
    },
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, client_id FROM users WHERE id = ?').get(req.user.id);
  let client = null;
  if (user.client_id) {
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(user.client_id);
  }
  res.json({ ...user, client });
});

router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
