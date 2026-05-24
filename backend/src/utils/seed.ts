import Category from '../models/Category.model';
import Article from '../models/Article.model';
import { createLogger } from '../utils/logger';

const log = createLogger('Seed');

const CATEGORIES = [
  { name: 'Technology', slug: 'technology', color: '#3B82F6', icon: '💻', description: 'Tech news and innovation' },
  { name: 'Finance', slug: 'finance', color: '#10B981', icon: '💰', description: 'Markets, banking, crypto' },
  { name: 'Politics', slug: 'politics', color: '#EF4444', icon: '🏛️', description: 'Government and policy' },
  { name: 'Science', slug: 'science', color: '#8B5CF6', icon: '🔬', description: 'Research and discovery' },
  { name: 'Health', slug: 'health', color: '#F59E0B', icon: '🏥', description: 'Medicine and wellness' },
  { name: 'World', slug: 'world', color: '#06B6D4', icon: '🌍', description: 'International affairs' },
];

const ARTICLES = [
  {
    title: 'OpenAI Releases GPT-5 with Revolutionary Reasoning Capabilities',
    description: 'OpenAI has unveiled GPT-5, its most advanced language model yet, featuring breakthrough chain-of-thought reasoning that significantly outperforms previous generations across academic and professional benchmarks.',
    content: 'In a landmark announcement that sent ripples through the tech industry, OpenAI today released GPT-5, its next-generation large language model...',
    url: 'https://example.com/gpt5-release',
    source: { name: 'TechCrunch', url: 'https://techcrunch.com' },
    author: 'Sarah Chen',
    publishedAt: new Date(),
    language: 'en',
    status: 'published',
    isTrending: true,
    isBreaking: true,
    tags: ['AI', 'OpenAI', 'GPT-5', 'Machine Learning'],
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.92,
      credibilityScore: 88,
      keyPoints: ['GPT-5 outperforms GPT-4 by 40% on reasoning benchmarks', 'Available to Plus subscribers immediately', 'New multimodal capabilities included'],
      summary: 'OpenAI releases GPT-5 with major reasoning improvements and multimodal capabilities.',
      topics: ['Artificial Intelligence', 'Technology', 'Machine Learning'],
      entities: ['OpenAI', 'GPT-5'],
      readingTime: 4,
    },
    engagement: { views: 45200, shares: 3100, comments: 890 },
    categorySlug: 'technology',
  },
  {
    title: 'Federal Reserve Holds Rates Steady, Signals Potential Cut in September',
    description: 'The Federal Reserve kept its benchmark interest rate unchanged at 5.25%-5.50% but signaled a possible rate cut at its September meeting, citing progress on inflation and a cooling labor market.',
    content: 'The Federal Open Market Committee concluded its two-day policy meeting today with a widely anticipated decision to hold rates steady...',
    url: 'https://example.com/fed-rates-hold',
    source: { name: 'Bloomberg', url: 'https://bloomberg.com' },
    author: 'Michael Torres',
    publishedAt: new Date(Date.now() - 2 * 3600000),
    language: 'en',
    status: 'published',
    isTrending: true,
    tags: ['Federal Reserve', 'Interest Rates', 'Economy', 'Inflation'],
    aiAnalysis: {
      sentiment: 'neutral',
      sentimentScore: 0.15,
      credibilityScore: 95,
      keyPoints: ['Rates held at 5.25%-5.50%', 'September cut increasingly likely', 'Inflation approaching 2% target'],
      summary: 'Fed holds rates but opens door to September cut as inflation cools.',
      topics: ['Economics', 'Federal Reserve', 'Monetary Policy'],
      entities: ['Federal Reserve', 'FOMC'],
      readingTime: 6,
    },
    engagement: { views: 38900, shares: 2400, comments: 1200 },
    categorySlug: 'finance',
  },
  {
    title: 'European Union Passes Landmark AI Regulation Framework',
    description: 'The EU Parliament has approved the AI Act, the world\'s first comprehensive legal framework for artificial intelligence, establishing risk-based rules that will reshape how AI systems are developed and deployed globally.',
    content: 'In a historic vote today, the European Parliament overwhelmingly approved the Artificial Intelligence Act...',
    url: 'https://example.com/eu-ai-act',
    source: { name: 'Reuters', url: 'https://reuters.com' },
    author: 'Anna Kowalski',
    publishedAt: new Date(Date.now() - 4 * 3600000),
    language: 'en',
    status: 'published',
    isTrending: true,
    tags: ['EU', 'AI Regulation', 'Policy', 'Technology'],
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.45,
      credibilityScore: 92,
      keyPoints: ['First comprehensive AI law globally', 'Risk-based classification system', 'Heavy fines for non-compliance up to €35M'],
      summary: 'EU approves groundbreaking AI Act establishing global regulatory precedent.',
      topics: ['Regulation', 'Artificial Intelligence', 'European Union'],
      entities: ['European Parliament', 'EU'],
      readingTime: 7,
    },
    engagement: { views: 29700, shares: 4500, comments: 670 },
    categorySlug: 'politics',
  },
  {
    title: 'CRISPR Gene Therapy Shows 94% Efficacy in Sickle Cell Disease Trial',
    description: 'A Phase 3 clinical trial of a CRISPR-based gene therapy for sickle cell disease has reported a remarkable 94% efficacy rate, with patients remaining symptom-free for over two years post-treatment.',
    content: 'Researchers at the National Institutes of Health announced today the results of their landmark Phase 3 trial...',
    url: 'https://example.com/crispr-sickle-cell',
    source: { name: 'Nature', url: 'https://nature.com' },
    author: 'Dr. James Liu',
    publishedAt: new Date(Date.now() - 6 * 3600000),
    language: 'en',
    status: 'published',
    tags: ['CRISPR', 'Gene Therapy', 'Medical Research', 'Sickle Cell'],
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.96,
      credibilityScore: 97,
      keyPoints: ['94% efficacy rate in Phase 3 trial', 'Patients symptom-free for 2+ years', 'FDA fast-track designation expected'],
      summary: 'CRISPR gene therapy achieves breakthrough results for sickle cell disease.',
      topics: ['Medicine', 'Gene Therapy', 'Clinical Trials'],
      entities: ['NIH', 'CRISPR', 'FDA'],
      readingTime: 5,
    },
    engagement: { views: 52100, shares: 8200, comments: 430 },
    categorySlug: 'science',
  },
  {
    title: 'Global Cybersecurity Breach Exposes 340 Million Records',
    description: 'A massive data breach affecting a major cloud services provider has exposed approximately 340 million user records across multiple enterprise clients, making it one of the largest breaches in history.',
    content: 'Security researchers discovered the breach earlier this week when anomalous data transfers were detected...',
    url: 'https://example.com/cyber-breach-340m',
    source: { name: 'Wired', url: 'https://wired.com' },
    author: 'Kevin Park',
    publishedAt: new Date(Date.now() - 8 * 3600000),
    language: 'en',
    status: 'published',
    isBreaking: true,
    tags: ['Cybersecurity', 'Data Breach', 'Cloud Computing', 'Privacy'],
    aiAnalysis: {
      sentiment: 'negative',
      sentimentScore: -0.85,
      credibilityScore: 81,
      keyPoints: ['340 million records exposed', 'Multiple enterprise clients affected', 'Investigation ongoing with FBI involvement'],
      summary: 'Major cloud provider suffers historic data breach exposing hundreds of millions of records.',
      topics: ['Cybersecurity', 'Data Privacy', 'Cloud Computing'],
      entities: ['FBI', 'CISA'],
      readingTime: 4,
    },
    engagement: { views: 67300, shares: 12400, comments: 2100 },
    categorySlug: 'technology',
  },
  {
    title: 'WHO Declares End to Global Mpox Emergency',
    description: 'The World Health Organization has officially declared the end of the global mpox public health emergency of international concern, citing declining case counts and successful vaccination campaigns.',
    content: 'WHO Director-General Dr. Tedros Adhanom Ghebreyesus announced today the formal end of the mpox emergency...',
    url: 'https://example.com/who-mpox-end',
    source: { name: 'BBC News', url: 'https://bbc.com' },
    author: 'Rachel Adams',
    publishedAt: new Date(Date.now() - 10 * 3600000),
    language: 'en',
    status: 'published',
    tags: ['WHO', 'Mpox', 'Public Health', 'Vaccines'],
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.72,
      credibilityScore: 94,
      keyPoints: ['Emergency officially over', 'Vaccination campaigns credited', 'Continued surveillance recommended'],
      summary: 'WHO ends mpox global emergency after successful containment efforts.',
      topics: ['Public Health', 'World Health Organization', 'Epidemiology'],
      entities: ['WHO', 'Dr. Tedros'],
      readingTime: 3,
    },
    engagement: { views: 23400, shares: 1800, comments: 340 },
    categorySlug: 'health',
  },
  {
    title: 'India and Japan Sign $42 Billion Infrastructure Partnership',
    description: 'India and Japan have signed a landmark $42 billion infrastructure development agreement covering high-speed rail, semiconductor fabrication plants, and renewable energy projects across South Asia.',
    content: 'Prime Ministers of India and Japan met in Tokyo today to formalize the largest bilateral infrastructure deal...',
    url: 'https://example.com/india-japan-deal',
    source: { name: 'Financial Times', url: 'https://ft.com' },
    author: 'Priya Sharma',
    publishedAt: new Date(Date.now() - 12 * 3600000),
    language: 'en',
    status: 'published',
    isTrending: true,
    tags: ['India', 'Japan', 'Infrastructure', 'Geopolitics', 'Trade'],
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.78,
      credibilityScore: 90,
      keyPoints: ['$42B deal signed', 'Covers rail, semiconductors, renewables', 'Strengthens Indo-Pacific partnership'],
      summary: 'India-Japan sign historic $42B infrastructure deal strengthening bilateral ties.',
      topics: ['Geopolitics', 'Infrastructure', 'International Trade'],
      entities: ['India', 'Japan'],
      readingTime: 5,
    },
    engagement: { views: 18900, shares: 2100, comments: 560 },
    categorySlug: 'world',
  },
  {
    title: 'Tesla Unveils Affordable $25,000 Electric Vehicle for 2026',
    description: 'Tesla has officially announced its long-awaited affordable EV model, priced at $25,000 before incentives, set to begin production in late 2025 with deliveries starting Q1 2026.',
    content: 'At a special event at its Fremont factory, Tesla CEO Elon Musk unveiled the companys most affordable vehicle to date...',
    url: 'https://example.com/tesla-25k-ev',
    source: { name: 'The Verge', url: 'https://theverge.com' },
    author: 'David Kim',
    publishedAt: new Date(Date.now() - 14 * 3600000),
    language: 'en',
    status: 'published',
    isTrending: true,
    tags: ['Tesla', 'Electric Vehicles', 'Automotive', 'Elon Musk'],
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.68,
      credibilityScore: 82,
      keyPoints: ['$25,000 starting price', 'Production starts late 2025', '300-mile range claimed'],
      summary: 'Tesla announces $25K EV aimed at mass market adoption.',
      topics: ['Electric Vehicles', 'Automotive', 'Technology'],
      entities: ['Tesla', 'Elon Musk'],
      readingTime: 4,
    },
    engagement: { views: 89200, shares: 15600, comments: 4300 },
    categorySlug: 'technology',
  },
];

export async function seedDatabase(): Promise<void> {
  try {
    // Check if already seeded
    const articleCount = await Article.countDocuments();
    if (articleCount > 0) {
      log.info(`Database already has ${articleCount} articles — skipping seed`);
      return;
    }

    log.info('Seeding database with categories and articles...');

    // Create categories
    const categoryDocs: Record<string, any> = {};
    for (const cat of CATEGORIES) {
      const doc = await Category.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      categoryDocs[cat.slug] = doc;
    }
    log.info(`✅ ${CATEGORIES.length} categories ready`);

    // Create articles
    for (const article of ARTICLES) {
      const { categorySlug, ...articleData } = article;
      const category = categoryDocs[categorySlug];

      // Extract sentiment from aiAnalysis and set as top-level field
      const sentimentLabel = articleData.aiAnalysis?.sentiment || 'neutral';
      const sentimentScore = articleData.aiAnalysis?.sentimentScore || 0;

      await Article.create({
        ...articleData,
        category: category?._id,
        sentiment: {
          label: sentimentLabel,
          score: sentimentScore,
          confidence: Math.abs(sentimentScore),
          magnitude: Math.abs(sentimentScore),
        },
      });
    }
    log.info(`✅ ${ARTICLES.length} articles seeded`);

  } catch (err) {
    log.error('Seed error:', err);
  }
}
