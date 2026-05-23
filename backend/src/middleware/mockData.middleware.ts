import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const API = `/api/${env.API_VERSION}`;

export const mockDataMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV !== 'development') {
    return next();
  }

  const url = req.path;

  // 1. GET /api/v1/auth/me
  if (url === `${API}/auth/me` && req.method === 'GET') {
    return res.status(200).json({
      success: true,
      data: {
        _id: 'mock_user_123',
        name: 'Alex Mercer',
        email: 'alex@newsintel.ai',
        role: 'admin'
      }
    });
  }

  // 2. GET /api/v1/news
  if (url === `${API}/news` && req.method === 'GET') {
    const articles = [
      {
        _id: 'art_001',
        title: 'Global Semiconductor Market Braces for Sub-2nm Competition',
        slug: 'global-semiconductor-market-sub-2nm',
        description: 'Major fabrication facilities are accelerating transition to sub-2nm node processes amid growing regional tech rivalry.',
        source: { name: 'TechIntelligence Daily' },
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        media: { urlToImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60' },
        tags: ['Semiconductors', 'Geopolitics', 'Technology', 'Supply Chain'],
        sentiment: { label: 'neutral', score: 0.12 },
        aiAnalysis: {
          summary: 'The shift to sub-2nm semiconductor nodes marks a critical turning point in global industrial strategy.',
          keyInsights: ['Foundries are investing billions in new extreme ultraviolet (EUV) lithography systems.', 'Intellectual property control remains the primary battleground.'],
          readingTime: 4
        },
        category: { name: 'Technology', slug: 'technology', color: '#3b82f6', icon: 'Cpu' },
        isBreaking: true,
        isTrending: true,
        engagement: { views: 1240, saves: 89 }
      },
      {
        _id: 'art_002',
        title: 'Central Banks Signaling Cautious Optimism as Core Inflation Cools',
        slug: 'central-banks-cautious-optimism-inflation',
        description: 'New economic indicators suggest interest rate adjustments have begun stabilizing consumer price indexes.',
        source: { name: 'Macro Finance' },
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        media: { urlToImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60' },
        tags: ['Inflation', 'Interest Rates', 'Finance', 'Macroeconomics'],
        sentiment: { label: 'positive', score: 0.65 },
        aiAnalysis: {
          summary: 'Economic policy markers show clear indicators of success in controlling core inflation metrics.',
          keyInsights: ['Stabilization in food prices offsets persistent housing index heights.', 'Labor markets remain tight but are no longer overheating.'],
          readingTime: 3
        },
        category: { name: 'Finance', slug: 'finance', color: '#10b981', icon: 'TrendingUp' },
        isBreaking: false,
        isTrending: true,
        engagement: { views: 890, saves: 45 }
      },
      {
        _id: 'art_003',
        title: 'New Room-Temperature Superconductor Claims Under Scrutiny',
        slug: 'room-temperature-superconductor-claims-scrutiny',
        description: 'Research laboratories globally attempt to replicate experimental results of a novel copper-doped lead apatite compound.',
        source: { name: 'Science Frontiers' },
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        media: { urlToImage: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=500&auto=format&fit=crop&q=60' },
        tags: ['Superconductors', 'Physics', 'Science', 'R&D'],
        sentiment: { label: 'negative', score: -0.45 },
        aiAnalysis: {
          summary: 'Excitement around room-temperature superconductivity faces skepticism as multiple replication attempts report null findings.',
          keyInsights: ['Early magnetic susceptibility measurements indicate diamagnetism rather than zero resistance.', 'Peer reviews are pointing to sample impurity concerns.'],
          readingTime: 5
        },
        category: { name: 'Science', slug: 'science', color: '#8b5cf6', icon: 'Atom' },
        isBreaking: false,
        isTrending: false,
        engagement: { views: 2310, saves: 112 }
      }
    ];

    return res.status(200).json({
      success: true,
      message: 'Data retrieved successfully',
      data: articles,
      meta: {
        page: 1,
        limit: 12,
        total: articles.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
      },
      timestamp: new Date().toISOString()
    });
  }

  // 3. GET /api/v1/news/analytics
  if (url === `${API}/news/analytics` && req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'News analytics retrieved',
      data: {
        totalArticles: 142,
        topCategories: [
          { category: 'Technology', count: 45 },
          { category: 'Finance', count: 32 },
          { category: 'Geopolitics', count: 28 },
          { category: 'Energy', count: 22 },
          { category: 'Science', count: 15 }
        ],
        sentimentDist: [
          { label: 'positive', count: 58 },
          { label: 'neutral', count: 44 },
          { label: 'negative', count: 40 }
        ],
        topKeywords: [
          { keyword: 'AI', count: 25 },
          { keyword: 'Semiconductors', count: 18 },
          { keyword: 'Inflation', count: 14 },
          { keyword: 'Superconductors', count: 12 },
          { keyword: 'NATO', count: 11 }
        ]
      },
      timestamp: new Date().toISOString()
    });
  }

  // 4. GET /api/v1/ai/briefing
  if (url === `${API}/ai/briefing` && req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'AI executive briefing generated',
      data: {
        briefing: "### Executive Briefing\n\n**Key Developments:**\n1. **Semiconductor Race:** New advancements in sub-2nm chip manufacturing have intensified geopolitical competition between major economies.\n2. **Inflation Stabilizes:** Global central banks report moderate cooling of core inflation, though supply chain bottlenecks in critical minerals persist.\n3. **Artificial Intelligence Regulation:** International frameworks are tightening, with focus on model safety, copyright, and compute licensing.\n\n**Actionable Insights:**\n- Assess exposure to hardware supply chains.\n- Review compliance policies against new cross-border AI guidelines."
      },
      timestamp: new Date().toISOString()
    });
  }

  // 5. GET /api/v1/ai/trending
  if (url === `${API}/ai/trending` && req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Trending topics retrieved',
      data: [
        { topic: 'Quantum Computing', count: 12, sentiment: 'positive' },
        { topic: 'Federal Reserve Rate Cuts', count: 9, sentiment: 'neutral' },
        { topic: 'Lithium Battery Supply Chain', count: 8, sentiment: 'negative' }
      ],
      timestamp: new Date().toISOString()
    });
  }

  // 6. GET /api/v1/analytics/overview
  if (url === `${API}/analytics/overview` && req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Overview data retrieved',
      data: {
        articlesAnalyzed: 1240,
        averageSentiment: 0.15,
        alertsDispatched: 42,
        activeSensors: 8
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
};
