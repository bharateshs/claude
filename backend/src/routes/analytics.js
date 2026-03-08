const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Resolve effective client_id based on user role
function getClientId(req) {
  if (req.user.role === 'admin') {
    return req.query.client_id || 'client-1';
  }
  return req.user.client_id;
}

// GET /api/analytics/overview
router.get('/overview', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];

  const placeholders = platformList.map(() => '?').join(',');
  const params = [clientId, startDate, endDate, ...platformList];

  const totals = db.prepare(`
    SELECT
      SUM(impressions) as total_impressions,
      SUM(reach) as total_reach,
      SUM(engagement) as total_engagement,
      SUM(likes) as total_likes,
      SUM(comments) as total_comments,
      SUM(shares) as total_shares,
      SUM(clicks) as total_clicks,
      SUM(video_views) as total_video_views,
      SUM(post_count) as total_posts,
      MAX(followers) as total_followers
    FROM analytics_snapshots
    WHERE client_id = ? AND date BETWEEN ? AND ? AND platform IN (${placeholders})
  `).get(...params);

  // Previous period for comparison
  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - daysDiff);

  const prevParams = [clientId, prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0], ...platformList];
  const prevTotals = db.prepare(`
    SELECT
      SUM(impressions) as total_impressions,
      SUM(reach) as total_reach,
      SUM(engagement) as total_engagement,
      SUM(likes) as total_likes,
      SUM(comments) as total_comments,
      SUM(shares) as total_shares,
      SUM(clicks) as total_clicks
    FROM analytics_snapshots
    WHERE client_id = ? AND date BETWEEN ? AND ? AND platform IN (${placeholders})
  `).get(...prevParams);

  const calcChange = (curr, prev) => {
    if (!prev || prev === 0) return 0;
    return parseFloat(((curr - prev) / prev * 100).toFixed(1));
  };

  res.json({
    totals,
    changes: {
      impressions: calcChange(totals.total_impressions, prevTotals?.total_impressions),
      reach: calcChange(totals.total_reach, prevTotals?.total_reach),
      engagement: calcChange(totals.total_engagement, prevTotals?.total_engagement),
      clicks: calcChange(totals.total_clicks, prevTotals?.total_clicks),
    },
    period: { start: startDate, end: endDate },
  });
});

// GET /api/analytics/trends
router.get('/trends', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms, metric } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];
  const selectedMetric = metric || 'engagement';

  const data = {};
  for (const platform of platformList) {
    const rows = db.prepare(`
      SELECT date, ${selectedMetric}, impressions, reach, engagement, followers, likes, comments, shares, clicks, video_views
      FROM analytics_snapshots
      WHERE client_id = ? AND platform = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).all(clientId, platform, startDate, endDate);
    data[platform] = rows;
  }

  res.json({ data, metric: selectedMetric });
});

// GET /api/analytics/by-platform
router.get('/by-platform', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT
      platform,
      SUM(impressions) as impressions,
      SUM(reach) as reach,
      SUM(engagement) as engagement,
      SUM(likes) as likes,
      SUM(comments) as comments,
      SUM(shares) as shares,
      SUM(clicks) as clicks,
      SUM(video_views) as video_views,
      SUM(post_count) as posts,
      MAX(followers) as followers,
      ROUND(CAST(SUM(engagement) AS FLOAT) / NULLIF(SUM(reach), 0) * 100, 2) as engagement_rate
    FROM analytics_snapshots
    WHERE client_id = ? AND date BETWEEN ? AND ?
    GROUP BY platform
    ORDER BY engagement DESC
  `).all(clientId, startDate, endDate);

  res.json({ data: rows });
});

// GET /api/analytics/content-performance
router.get('/content-performance', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];
  const placeholders = platformList.map(() => '?').join(',');

  const rows = db.prepare(`
    SELECT date, platform, post_count, engagement, impressions, reach,
      ROUND(CAST(engagement AS FLOAT) / NULLIF(reach, 0) * 100, 2) as engagement_rate
    FROM analytics_snapshots
    WHERE client_id = ? AND date BETWEEN ? AND ? AND platform IN (${placeholders})
    ORDER BY date DESC
    LIMIT 100
  `).all(clientId, startDate, endDate, ...platformList);

  res.json({ data: rows });
});

// GET /api/analytics/follower-growth
router.get('/follower-growth', authenticateToken, (req, res) => {
  const clientId = getClientId(req);
  const { start_date, end_date, platforms } = req.query;

  const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = end_date || new Date().toISOString().split('T')[0];
  const platformList = platforms ? platforms.split(',') : ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];

  const data = {};
  for (const platform of platformList) {
    const rows = db.prepare(`
      SELECT date, followers
      FROM analytics_snapshots
      WHERE client_id = ? AND platform = ? AND date BETWEEN ? AND ?
      ORDER BY date ASC
    `).all(clientId, platform, startDate, endDate);
    data[platform] = rows;
  }

  res.json({ data });
});

module.exports = router;
