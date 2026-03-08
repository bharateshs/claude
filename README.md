# Social Media Analytics Dashboard

A real-time, multi-client social media analytics dashboard with AI-powered insights.

## Features

- **Multi-Platform Tracking**: Instagram, Facebook, LinkedIn, X/Twitter, YouTube
- **Real-time Updates**: Live data via Socket.io (updates every 30s)
- **Media Spends**: Full campaign & spend tracking with ROI metrics (CPM, CPC, CTR, ROAS)
- **AI Insights**: Claude-powered recommendations, learnings, and insights
- **Advanced Filters**: Date ranges, platform selectors, client switcher (admin)
- **Exports**: XLSX, PDF, PPT formats
- **Role-based Access**: Admin (all clients) + Client-specific logins

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dashboard.com | admin123 |
| TechCorp | techcorpinc@client.com | client123 |
| RetailBrand | retailbrandco@client.com | client123 |
| FinanceHub | financehubltd@client.com | client123 |

## Setup

### Backend

```bash
cd backend
npm install
# Set ANTHROPIC_API_KEY in .env for AI features
node src/index.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Full stack (from root)

```bash
npm install -g concurrently
npm run dev
```

## Tech Stack

**Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts + Zustand
**Backend**: Node.js + Express + SQLite (better-sqlite3) + Socket.io
**AI**: Anthropic Claude API (claude-sonnet-4-6)
**Exports**: xlsx, jsPDF, PptxGenJS

## Environment Variables

### Backend (.env)
```
PORT=3001
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:5173
ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## Dashboard Sections

1. **Overview** — KPI cards, engagement trends, platform share pie chart, summary table
2. **Trends** — Daily/weekly metrics by platform, follower growth
3. **Platforms** — Per-platform deep dive, radar comparison, content performance
4. **Media Spends** — Spend by platform, campaign ROAS, CPM/CPC/CTR analysis
5. **Insights & AI** — Claude-generated insights, learnings, recommendations
