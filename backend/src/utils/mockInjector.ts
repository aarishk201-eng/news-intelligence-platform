import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env';
import Article from '../models/Article.model';
import Category from '../models/Category.model';

const MOCK_ARTICLES = [
  {
    title: 'OpenAI Releases New GPT-4 Update',
    description: 'OpenAI has announced a major update to its GPT-4 model, significantly improving reasoning capabilities and reducing latency. The update is rolling out to all Plus users this week.',
    content: 'Full article content about OpenAI...',
    url: 'https://example.com/ai-update',
    source: { name: 'TechCrunch' },
    author: 'Sarah Drasner',
    publishedAt: new Date(),
    language: 'en',
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.85,
      keyPoints: ['Improved reasoning', 'Lower latency', 'Available this week'],
      summary: 'OpenAI updates GPT-4 with better reasoning and speed.',
      topics: ['AI', 'OpenAI', 'Technology'],
      entities: ['OpenAI', 'GPT-4']
    }
  },
  {
    title: 'Global Markets Rally on Tech Earnings',
    description: 'Stock markets around the world saw significant gains today following better-than-expected earnings reports from major technology companies, easing fears of an economic slowdown.',
    content: 'Full article content about markets...',
    url: 'https://example.com/markets-rally',
    source: { name: 'Bloomberg' },
    author: 'John Doe',
    publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
    language: 'en',
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.9,
      keyPoints: ['Markets rally', 'Tech earnings exceed expectations', 'Economic fears ease'],
      summary: 'Tech earnings drive global market rally.',
      topics: ['Finance', 'Stock Market', 'Technology'],
      entities: ['Bloomberg']
    }
  },
  {
    title: 'New Climate Policy Faces Backlash',
    description: 'A controversial new climate policy aimed at reducing industrial emissions is facing heavy pushback from manufacturing unions who argue it will cost thousands of jobs.',
    content: 'Full article content about climate...',
    url: 'https://example.com/climate-backlash',
    source: { name: 'Reuters' },
    author: 'Jane Smith',
    publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
    language: 'en',
    aiAnalysis: {
      sentiment: 'negative',
      sentimentScore: -0.6,
      keyPoints: ['New climate policy proposed', 'Unions protest job losses', 'Industrial emissions targeted'],
      summary: 'Proposed emissions policy faces union backlash over job concerns.',
      topics: ['Politics', 'Climate Change', 'Economy'],
      entities: ['Reuters', 'Manufacturing Unions']
    }
  },
  {
    title: 'Breakthrough in Quantum Computing',
    description: 'Researchers at MIT have achieved a major breakthrough in quantum error correction, bringing stable, commercially viable quantum computers one step closer to reality.',
    content: 'Full article content about quantum...',
    url: 'https://example.com/quantum-breakthrough',
    source: { name: 'Wired' },
    author: 'Alice Johnson',
    publishedAt: new Date(Date.now() - 10800000), // 3 hours ago
    language: 'en',
    aiAnalysis: {
      sentiment: 'positive',
      sentimentScore: 0.95,
      keyPoints: ['Quantum error correction improved', 'MIT researchers lead study', 'Commercial viability closer'],
      summary: 'MIT researchers make significant progress in quantum error correction.',
      topics: ['Science', 'Quantum Computing', 'Technology'],
      entities: ['MIT', 'Wired']
    }
  },
  {
    title: 'Central Bank Keeps Rates Steady',
    description: 'In a highly anticipated decision, the Central Bank announced today that it will leave interest rates unchanged, citing stabilizing inflation and steady employment numbers.',
    content: 'Full article content about interest rates...',
    url: 'https://example.com/rates-steady',
    source: { name: 'Wall Street Journal' },
    author: 'Bob Williams',
    publishedAt: new Date(Date.now() - 14400000), // 4 hours ago
    language: 'en',
    aiAnalysis: {
      sentiment: 'neutral',
      sentimentScore: 0.1,
      keyPoints: ['Interest rates unchanged', 'Inflation stabilizing', 'Employment remains steady'],
      summary: 'Central bank maintains current interest rates amid economic stability.',
      topics: ['Finance', 'Economy', 'Policy'],
      entities: ['Central Bank', 'Wall Street Journal']
    }
  },
  {
    title: 'Major Security Flaw Found in Popular Browser',
    description: 'Cybersecurity experts have discovered a zero-day vulnerability in a widely used web browser, urging users to update immediately to prevent potential data theft.',
    content: 'Full article content about security...',
    url: 'https://example.com/browser-flaw',
    source: { name: 'The Hacker News' },
    author: 'Charlie Brown',
    publishedAt: new Date(Date.now() - 18000000), // 5 hours ago
    language: 'en',
    aiAnalysis: {
      sentiment: 'negative',
      sentimentScore: -0.8,
      keyPoints: ['Zero-day vulnerability found', 'Update required immediately', 'Risk of data theft'],
      summary: 'Critical security flaw discovered in popular web browser requires urgent update.',
      topics: ['Cybersecurity', 'Technology', 'Software'],
      entities: ['The Hacker News']
    }
  }
];

const run = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected.');

    // Fetch categories to assign randomly
    const categories = await Category.find();
    if (categories.length === 0) {
      console.log('No categories found. Run seed script first.');
      process.exit(1);
    }

    console.log('Clearing old mock articles...');
    await Article.deleteMany({});

    console.log('Injecting mock articles...');
    for (const article of MOCK_ARTICLES) {
      // Assign a random category
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      await Article.create({
        ...article,
        category: randomCategory._id,
      });
    }

    console.log(`Successfully injected ${MOCK_ARTICLES.length} mock articles!`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

void run();
