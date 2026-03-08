const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();
  res.json({ data: clients });
});

router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user.client_id !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json({ data: client });
});

module.exports = router;
