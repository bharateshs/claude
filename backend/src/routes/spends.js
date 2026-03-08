const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function getClientId(req) {
  if (req.user.role === 'admin') {
    return req.query.client_id || 'client-1';
  }
  return req.user.client_id;
}

// GET /api/spends/overview
router.get('/overview', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];
  const placeholders = platformList.map(() => '?').join(',');

  const totals = db.prepare(`
    SELECT
      SUM(spend) as total_spend,
      SUM(impressions) as total_impressions,
      SUM(clicks) as total_clicks,
      SUM(conversions) as total_conversions,
      ROUND(AVG(cpm), 2) as avg_cpm,
      ROUND(AVG(cpc), 2) as avg_cpc,
      ROUND(AVG(ctr), 2) as avg_ctr,
      ROUND(AVG(roas), 2) as avg_roas
    FROM media_spends
    WHERE client_id = ? AND date BETWEEN ? AND ? AND platform IN (${placeholders})
  `).get(clientId, startDate, endDate, ...platformList);

  res.json({ totals });
});

// GET /api/spends/by-platform
router.get('/by-platform', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT
      platform,
      ROUND(SUM(spend), 2) as spend,
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      SUM(conversions) as conversions,
      ROUND(AVG(cpm), 2) as avg_cpm,
      ROUND(AVG(cpc), 2) as avg_cpc,
      ROUND(AVG(ctr), 2) as avg_ctr,
      ROUND(AVG(roas), 2) as avg_roas
    FROM media_spends
    WHERE client_id = ? AND date BETWEEN ? AND ?
    GROUP BY platform
    ORDER BY spend DESC
  `).all(clientId, startDate, endDate);

  res.json({ data: rows });
});

// GET /api/spends/trends
router.get('/trends', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];

  const data = {};
  for (const platform of platformList) {
    const rows = db.prepare(`
      SELECT date, ROUND(SUM(spend), 2) as spend, SUM(impressions) as impressions,
        SUM(clicks) as clicks, SUM(conversions) as conversions, ROUND(AVG(roas), 2) as roas
      FROM media_spends
      WHERE client_id = ? AND platform = ? AND date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `).all(clientId, platform, startDate, endDate);
    data[platform] = rows;
  }

  res.json({ data });
});

// GET /api/spends/campaigns
router.get('/campaigns', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];
  const placeholders = platformList.map(() => '?').join(',');

  const rows = db.prepare(`
    SELECT
      platform,
      campaign_name,
      ROUND(SUM(spend), 2) as spend,
      SUM(impressions) as impressions,
      SUM(clicks) as clicks,
      SUM(conversions) as conversions,
      ROUND(AVG(cpm), 2) as avg_cpm,
      ROUND(AVG(cpc), 2) as avg_cpc,
      ROUND(AVG(ctr), 2) as avg_ctr,
      ROUND(AVG(roas), 2) as avg_roas
    FROM media_spends
    WHERE client_id = ? AND date BETWEEN ? AND ? AND platform IN (${placeholders})
    GROUP BY platform, campaign_name
    ORDER BY spend DESC
  `).all(clientId, startDate, endDate, ...platformList);

  res.json({ data: rows });
});

module.exports = router;
