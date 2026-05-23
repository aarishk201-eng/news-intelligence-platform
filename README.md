<div align="center">
  <img src="https://via.placeholder.com/120x120?text=News+Intel" alt="News Intelligence Logo" width="120" height="120" />
  <h1>📰 AI-Powered News Intelligence Platform</h1>
  <p>A production-grade, full-stack application that aggregates, analyzes, and visualizes global news using OpenAI and advanced natural language processing.</p>

  <div>
    <img src="https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  </div>
</div>

<br />

## 📖 Overview

The **News Intelligence Platform** is an enterprise-ready system designed to combat information overload. It automatically ingests thousands of articles daily, utilizing AI to generate concise summaries, extract key insights, and classify sentiment. 

Built with a highly scalable microservice architecture, it features a responsive **Next.js 15** frontend and a highly optimized **Node.js/Express** backend backed by **MongoDB Atlas** and **Redis**.

## ✨ Key Features

- 🧠 **AI-Powered Analysis**: Automated sentiment classification (positive/neutral/negative), concise 2-sentence summaries, and key insight extraction using the OpenAI API.
- ⚡ **High-Performance Frontend**: Next.js 15 App Router with deep URL-state synchronization for bookmarkable, back-button-friendly advanced searches.
- 📊 **Analytics Dashboard**: Interactive data visualization using Recharts to track trending topics, sentiment distributions, and category analytics over time.
- 🔄 **Automated Ingestion Pipeline**: Robust Node.js cron jobs that fetch, deduplicate, and process articles from global sources (via NewsData.io) every 30 minutes.
- 🔒 **Enterprise-Grade Security**: Hardened API with tiered rate limiting (Redis-backed), pinned JWT authentication, HTTP Parameter Pollution prevention, and strict XSS/NoSQL injection guards.

---

## 🏗 Architecture & Tech Stack

### Frontend (Client-Side)
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Framer Motion (Animations)
- **UI Components**: shadcn/ui (Radix primitives)
- **State Management**: Zustand & URL Query Parameters
- **Data Fetching**: TanStack React Query (v5) + Axios
- **Visualization**: Recharts

### Backend (Server-Side)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose) with explicit indexing & full-text search
- **Caching**: Redis (Cache-aside strategy & rate limiting)
- **AI Integration**: OpenAI (`gpt-4o-mini`)
- **News Provider**: NewsData.io API
- **Task Scheduling**: `node-cron` with Redis Mutex for concurrency protection

---

## 📸 Screenshots

*(Replace placeholder URLs with actual screenshots of your deployed app)*

| News Dashboard | Analytics View |
| :---: | :---: |
| <img src="https://via.placeholder.com/500x300?text=Dashboard+Screenshot" alt="Dashboard" /> | <img src="https://via.placeholder.com/500x300?text=Analytics+Screenshot" alt="Analytics" /> |
| *Deep URL-linked advanced filtering & search* | *Real-time sentiment and category aggregation* |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x
- MongoDB (Local or Atlas)
- Redis (Local or Cloud)
- OpenAI API Key
- NewsData.io API Key

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/news-intelligence-platform.git
cd news-intelligence-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory (refer to `.env.example`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/news-intel
REDIS_URL=redis://localhost:6379

JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRE=7d
JWT_ISSUER=news-intelligence-api
JWT_AUDIENCE=news-intelligence-client

OPENAI_API_KEY=sk-your-openai-key
NEWSDATA_API_KEY=pub_your_newsdata_key
ALLOWED_ORIGINS=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_VERSION=v1
```

Start the frontend server:
```bash
npm run dev
```

Navigate to `http://localhost:3000` to view the application.

---

## 📡 API Endpoints

The API is versioned (`/api/v1`) and adheres to RESTful standards.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/news` | Fetch paginated news articles with advanced filtering |
| `GET` | `/news/analytics` | Retrieve aggregated sentiment and category statistics |
| `GET` | `/news/:id` | Fetch a single article by ID or slug |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Authenticate user and receive JWT |
| `POST` | `/admin/ingest` | Manually trigger the news ingestion pipeline |

*(Refer to the Postman collection in the repository for detailed request/response schemas).*

---

## 🌍 Deployment

This project is optimized for deployment on modern PaaS providers.

- **Frontend**: Zero-config deployment on [Vercel](https://vercel.com). Just link your GitHub repository and set the `NEXT_PUBLIC_API_URL`.
- **Backend**: Automated Infrastructure-as-Code deployment via the included `render.yaml` blueprint on [Render](https://render.com).
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) with a dedicated application user.

*(See `artifacts/deployment_guide.md` for a comprehensive step-by-step production rollout guide).*

---

## 🔮 Future Improvements

- **Personalized AI Briefings**: Generate custom daily digest emails based on user-selected tags and categories using OpenAI.
- **WebSocket Integration**: Push real-time "Breaking News" alerts to connected clients without requiring a page refresh.
- **Multi-language Support**: Implement localized AI summaries based on the user's browser locale.
- **Fact-Checking Module**: Cross-reference articles against known trusted sources to automatically flag potential misinformation.

---

<div align="center">
  <p>Built with ❤️ by a passionate Full-Stack Engineer.</p>
</div>
