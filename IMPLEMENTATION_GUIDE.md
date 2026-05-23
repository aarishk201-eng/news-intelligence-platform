# Premium Components Implementation Guide

## Quick Start

### 1. Import Components
```tsx
import {
  Navigation,
  SearchBar,
  NewsCard,
  FeaturedNewsCard,
  CompactNewsCard,
  AIInsights,
  AIInsightCard,
  EnhancedFooter,
} from '@/components';
```

### 2. Basic Page Layout
```tsx
'use client';

import { useState } from 'react';
import { Navigation, SearchBar, NewsCard, AIInsights, EnhancedFooter } from '@/components';

export default function NewsPage() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      
      <main className="container py-12">
        {/* Your content here */}
      </main>
      
      <EnhancedFooter />
    </div>
  );
}
```

---

## Component Details & Examples

### Navigation
Premium fixed navbar with glassmorphism effects.

**Props:** None (uses internal state)

**Example:**
```tsx
<Navigation />
```

**Features:**
- Fixed positioning
- Logo with link to home
- Desktop navigation menu
- Mobile responsive hamburger
- Search, notifications, and user buttons
- Smooth animations on all interactions

---

### SearchBar
Modal search interface overlaying the page.

**Props:**
```tsx
interface SearchBarProps {
  isOpen?: boolean;
  onSearch?: (query: string) => void;
  onClose?: () => void;
  placeholder?: string;
}
```

**Example:**
```tsx
import { useState } from 'react';
import { SearchBar } from '@/components';

export default function Page() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <button onClick={() => setSearchOpen(true)}>Search</button>
      <SearchBar
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSearch={(query) => {
          console.log('Searching for:', query);
          setSearchOpen(false);
        }}
        placeholder="Search news..."
      />
    </>
  );
}
```

---

### NewsCard (Standard)
Grid-friendly card with image and metadata.

**Props:**
```tsx
interface NewsCardProps {
  id: string | number;
  title: string;
  description: string;
  category: string;
  source: string;
  time: string;
  image?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  trending?: boolean;
  onClick?: () => void;
}
```

**Example:**
```tsx
<NewsCard
  id="1"
  title="OpenAI Launches GPT-4.5"
  description="New model with improved reasoning capabilities"
  category="AI"
  source="TechCrunch"
  time="2 min ago"
  image="https://images.unsplash.com/..."
  sentiment="positive"
  score={92}
  trending={true}
  onClick={() => window.open('/news/1')}
/>
```

**Display:**
- 3-column grid on desktop
- 2-column grid on tablet
- Full width on mobile
- Hover lift animation

---

### FeaturedNewsCard
Large featured article with two-column layout.

**Props:** Same as NewsCard

**Example:**
```tsx
<FeaturedNewsCard
  id="featured-1"
  title="Major Technology Breakthrough"
  description="Researchers achieve quantum computing milestone..."
  category="Science"
  source="Nature"
  time="Just now"
  image="https://images.unsplash.com/..."
  sentiment="positive"
  score={95}
/>
```

**Display:**
- Two-column layout (image + content)
- Stacks vertically on mobile
- Large typography
- Featured badge
- "Read More" button

---

### CompactNewsCard
Minimal list-style card for sidebars and feeds.

**Props:** Same as NewsCard (but `image` is optional and rarely used)

**Example:**
```tsx
<CompactNewsCard
  id="compact-1"
  title="Market Update"
  category="Finance"
  source="Bloomberg"
  time="1 hr ago"
  sentiment="neutral"
  score={65}
  trending={false}
/>
```

**Display:**
- Minimal layout
- Single row or wrapped on mobile
- No image
- Trending indicator only if `trending={true}`

---

### AIInsights (Container)
Grid layout for displaying multiple insight cards with loading states.

**Props:**
```tsx
interface AIInsightsProps {
  insights: InsightItem[];
  isLoading?: boolean;
}

interface InsightItem {
  id: string;
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  confidence: number;
  topics: string[];
}
```

**Example:**
```tsx
const insights = [
  {
    id: 'in-1',
    type: 'opportunity',
    title: 'AI Investment Boom',
    description: 'Positive sentiment in AI sector following GPT-4.5...',
    confidence: 88,
    topics: ['AI', 'Investment', 'Technology'],
  },
  {
    id: 'in-2',
    type: 'risk',
    title: 'Climate Policy Risk',
    description: 'New regulations creating uncertainty...',
    confidence: 76,
    topics: ['Climate', 'Regulation'],
  },
];

<AIInsights insights={insights} isLoading={false} />
```

**Display:**
- 2-column grid on desktop
- Single column on mobile
- Loading skeleton state
- Staggered animations

---

### AIInsightCard
Individual insight card with type-specific styling.

**Props:**
```tsx
interface AIInsightCardProps {
  insight: InsightItem;
  index: number; // For staggered animation
}
```

**Example:**
```tsx
<AIInsightCard
  insight={{
    id: 'ins-1',
    type: 'opportunity',
    title: 'Market Growth',
    description: 'Description...',
    confidence: 85,
    topics: ['Topic1', 'Topic2', 'Topic3'],
  }}
  index={0}
/>
```

**Color Coding:**
- **Opportunity** (Green): `#34D399`
- **Risk** (Red): `#F87171`
- **Trend** (Blue): `#7C8CFF`

---

### MinimalAIInsight
Inline insight card for dashboard integration.

**Props:**
```tsx
interface MinimalAIInsightProps {
  title: string;
  content: string;
  confidence: number;
}
```

**Example:**
```tsx
<MinimalAIInsight
  title="Quick Update"
  content="Market showing strength in tech sector"
  confidence={82}
/>
```

---

### EnhancedFooter
Premium footer with newsletter signup and links.

**Props:** None (uses internal state)

**Example:**
```tsx
<EnhancedFooter />
```

**Sections:**
- Newsletter subscription
- Product, Company, Legal links
- Social media buttons
- Copyright information

---

## Common Patterns

### News Feed with Pagination
```tsx
'use client';

import { useState } from 'react';
import { NewsCard } from '@/components';

export default function NewsFeed() {
  const [articles, setArticles] = useState([...]);
  const [page, setPage] = useState(1);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {articles
        .slice((page - 1) * 9, page * 9)
        .map((article) => (
          <NewsCard key={article.id} {...article} />
        ))}
    </div>
  );
}
```

### Dashboard with Insights
```tsx
import { AIInsights, NewsCard, FeaturedNewsCard } from '@/components';

export default function Dashboard() {
  return (
    <div className="space-y-16">
      <section>
        <h2 className="text-2xl font-bold mb-4">Featured</h2>
        <FeaturedNewsCard {...featuredArticle} />
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Latest News</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {articles.map((a) => <NewsCard key={a.id} {...a} />)}
        </div>
      </section>

      <AIInsights insights={insights} />
    </div>
  );
}
```

### Search Integration
```tsx
'use client';

import { useState } from 'react';
import { Navigation, SearchBar, CompactNewsCard } from '@/components';

export default function Page() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async (query) => {
    const res = await fetch(`/api/search?q=${query}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <>
      <Navigation />
      <SearchBar isOpen={searchOpen} onSearch={handleSearch} onClose={() => setSearchOpen(false)} />

      <main className="container py-8">
        <div className="grid gap-2">
          {results.map((result) => (
            <CompactNewsCard key={result.id} {...result} />
          ))}
        </div>
      </main>
    </>
  );
}
```

---

## Styling & Customization

### Overriding Styles
```tsx
import { NewsCard } from '@/components';

<NewsCard
  {...props}
  className="rounded-lg shadow-lg" // Additional Tailwind classes
/>
```

### Theme Colors
Components use these CSS variables (defined in `globals.css`):
- `--primary`: Main brand color
- `--accent`: Accent color
- `--background`: Page background
- `--foreground`: Text color
- `--muted-foreground`: Secondary text

### Custom Sentiment Colors
To add custom sentiment colors, extend `sentimentConfig` in `NewsCard.tsx`:
```tsx
const sentimentConfig = {
  positive: { /* ... */ },
  negative: { /* ... */ },
  neutral: { /* ... */ },
  // Add custom:
  mixed: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
};
```

---

## Performance Tips

1. **Lazy Load Images**
   ```tsx
   import Image from 'next/image';
   // Components already use Image for optimization
   ```

2. **Memoize Lists**
   ```tsx
   import { memo } from 'react';
   const NewsCardList = memo(({ articles }) => (
     <div className="grid md:grid-cols-3 gap-4">
       {articles.map(a => <NewsCard key={a.id} {...a} />)}
     </div>
   ));
   ```

3. **Virtualize Long Lists**
   ```tsx
   // Use react-window for very long lists
   import { FixedSizeList } from 'react-window';
   ```

---

## Accessibility

- ✓ Semantic HTML structure
- ✓ Proper contrast ratios
- ✓ Keyboard navigation support
- ✓ ARIA labels where appropriate
- ✓ Icon descriptions in tooltips

**Best Practice:**
```tsx
<button
  onClick={handleClick}
  aria-label="Read more about this article"
  title="Read more"
>
  Read
</button>
```

---

## Browser Support

- Chrome/Edge: ✓ Latest 2 versions
- Firefox: ✓ Latest 2 versions
- Safari: ✓ Latest 2 versions
- Mobile browsers: ✓ All modern versions

---

## Troubleshooting

### Components not styling?
- Ensure `globals.css` is imported in layout
- Check Tailwind config includes component paths
- Verify dark mode class is set on `<html>` or `<body>`

### Animations not working?
- Check Framer Motion is installed: `npm list framer-motion`
- Ensure component uses `'use client'` directive
- Check browser supports CSS animations

### Images not loading?
- Verify image URLs are accessible
- Check Next.js Image optimization limits (size < 4200px)
- Use `priority` prop for above-the-fold images

---

## Related Documentation
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com/)
- [Next.js](https://nextjs.org/)
- [Lucide Icons](https://lucide.dev)
