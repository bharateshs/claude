const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '../data/analytics.db'));

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'client',
      client_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT,
      industry TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_accounts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_id TEXT,
      access_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      date TEXT NOT NULL,
      followers INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      engagement INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      video_views INTEGER DEFAULT 0,
      post_count INTEGER DEFAULT 0,
      story_views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_spends (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      date TEXT NOT NULL,
      campaign_name TEXT,
      spend REAL DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      cpm REAL DEFAULT 0,
      cpc REAL DEFAULT 0,
      ctr REAL DEFAULT 0,
      roas REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      platform TEXT,
      insight_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@dashboard.com');
  if (!adminExists) {
    const hashedPwd = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)').run(
      uuidv4(), 'admin@dashboard.com', hashedPwd, 'Super Admin', 'admin'
    );
  }

  // Seed clients
  const clients = [
    { id: 'client-1', name: 'TechCorp Inc.', industry: 'Technology' },
    { id: 'client-2', name: 'RetailBrand Co.', industry: 'Retail' },
    { id: 'client-3', name: 'FinanceHub Ltd.', industry: 'Finance' },
  ];

  for (const client of clients) {
    const exists = db.prepare('SELECT id FROM clients WHERE id = ?').get(client.id);
    if (!exists) {
      db.prepare('INSERT INTO clients (id, name, industry) VALUES (?, ?, ?)').run(client.id, client.name, client.industry);

      // Create client user
      const hashedPwd = bcrypt.hashSync('client123', 10);
      db.prepare('INSERT OR IGNORE INTO users (id, email, password, name, role, client_id) VALUES (?, ?, ?, ?, ?, ?)').run(
        uuidv4(), `${client.name.toLowerCase().replace(/[^a-z]/g, '')}@client.com`, hashedPwd,
        `${client.name} Manager`, 'client', client.id
      );
    }
  }

  // Seed analytics data for last 90 days
  seedAnalyticsData();
  seedMediaSpends();
}

function seedAnalyticsData() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM analytics_snapshots').get();
  if (existing.count > 0) return;

  const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];
  const clientIds = ['client-1', 'client-2', 'client-3'];

  const baseMetrics = {
    instagram: { followers: 45000, impressions: 120000, reach: 80000, engagement: 3200 },
    facebook: { followers: 82000, impressions: 200000, reach: 150000, engagement: 4100 },
    linkedin: { followers: 12000, impressions: 45000, reach: 30000, engagement: 1200 },
    twitter: { followers: 28000, impressions: 95000, reach: 60000, engagement: 2800 },
    youtube: { followers: 15000, impressions: 55000, reach: 40000, engagement: 3500 },
  };

  const insert = db.prepare(`
    INSERT INTO analytics_snapshots
    (id, client_id, platform, date, followers, impressions, reach, engagement, likes, comments, shares, clicks, video_views, post_count, story_views)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const clientId of clientIds) {
      const multiplier = clientId === 'client-1' ? 1 : clientId === 'client-2' ? 0.7 : 0.5;
      for (const platform of platforms) {
        const base = baseMetrics[platform];
        for (let i = 89; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const trend = 1 + (89 - i) * 0.002;
          const noise = () => 0.85 + Math.random() * 0.3;
          const followers = Math.round(base.followers * multiplier * trend * (1 + (89 - i) * 0.001));
          const impressions = Math.round(base.impressions * multiplier * noise());
          const reach = Math.round(base.reach * multiplier * noise());
          const engagement = Math.round(base.engagement * multiplier * noise());
          const likes = Math.round(engagement * 0.6);
          const comments = Math.round(engagement * 0.15);
          const shares = Math.round(engagement * 0.15);
          const clicks = Math.round(impressions * 0.02 * noise());
          const videoViews = platform === 'youtube' ? Math.round(impressions * 0.4 * noise()) : Math.round(impressions * 0.1 * noise());
          const postCount = Math.floor(Math.random() * 4) + 1;
          const storyViews = platform === 'instagram' ? Math.round(reach * 0.3 * noise()) : 0;

          insert.run(uuidv4(), clientId, platform, dateStr, followers, impressions, reach, engagement, likes, comments, shares, clicks, videoViews, postCount, storyViews);
        }
      }
    }
  });

  insertMany();
}

function seedMediaSpends() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM media_spends').get();
  if (existing.count > 0) return;

  const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'];
  const clientIds = ['client-1', 'client-2', 'client-3'];
  const campaigns = {
    instagram: ['Brand Awareness', 'Product Launch', 'Retargeting'],
    facebook: ['Lead Gen', 'Traffic Campaign', 'Conversion'],
    linkedin: ['B2B Outreach', 'Thought Leadership', 'Job Ads'],
    twitter: ['Trend Hijacking', 'Promoted Tweets', 'Event Campaign'],
    youtube: ['Pre-roll Ads', 'Bumper Ads', 'Discovery Ads'],
  };

  const insert = db.prepare(`
    INSERT INTO media_spends
    (id, client_id, platform, date, campaign_name, spend, impressions, clicks, conversions, cpm, cpc, ctr, roas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction(() => {
    for (const clientId of clientIds) {
      const budget = clientId === 'client-1' ? 5000 : clientId === 'client-2' ? 3500 : 2000;
      for (const platform of platforms) {
        const platformCampaigns = campaigns[platform];
        for (let i = 89; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const campaign = platformCampaigns[Math.floor(Math.random() * platformCampaigns.length)];
          const spend = parseFloat((budget / 5 / 30 * (0.7 + Math.random() * 0.6)).toFixed(2));
          const impressions = Math.round(spend * (80 + Math.random() * 40));
          const clicks = Math.round(impressions * (0.01 + Math.random() * 0.03));
          const conversions = Math.round(clicks * (0.02 + Math.random() * 0.05));
          const cpm = parseFloat((spend / impressions * 1000).toFixed(2));
          const cpc = clicks > 0 ? parseFloat((spend / clicks).toFixed(2)) : 0;
          const ctr = parseFloat(((clicks / impressions) * 100).toFixed(2));
          const roas = parseFloat((conversions * 50 / spend).toFixed(2));

          insert.run(uuidv4(), clientId, platform, dateStr, campaign, spend, impressions, clicks, conversions, cpm, cpc, ctr, roas);
        }
      }
    }
  });

  insertMany();
}

module.exports = { db, initDatabase };
