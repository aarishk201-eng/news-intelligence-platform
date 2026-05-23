# 🚀 Quick Reference Guide - Premium Components

## 5-Minute Setup

### 1. Import Components
```tsx
import {
  Navigation,
  SearchBar,
  NewsCard,
  FeaturedNewsCard,
  CompactNewsCard,
  AIInsights,
  EnhancedFooter,
} from '@/components';
```

### 2. Create Page Layout
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
        {/* Content here */}
      </main>
      
      <EnhancedFooter />
    </div>
  );
}
```

---

## Component Cheat Sheet

### Navigation
```tsx
<Navigation />
```
**Features:** Fixed navbar, mobile menu, search/notification/user buttons

---

### SearchBar
```tsx
<SearchBar
  isOpen={true}
  onClose={() => {}}
  onSearch={(query) => console.log(query)}
/>
```
**Features:** Modal search, suggestions, keyboard support

---

### NewsCard
```tsx
<NewsCard
  id="1"
  title="Headline"
  description="Description"
  category="Tech"
  source="TechCrunch"
  time="2 min ago"
  image="https://..."
  sentiment="positive"
  score={92}
  trending={true}
/>
```
**Best For:** 3-column grid layout

---

### FeaturedNewsCard
```tsx
<FeaturedNewsCard
  id="featured-1"
  title="Major Story"
  description="Detailed description"
  category="AI"
  source="Bloomberg"
  time="Just now"
  image="https://..."
  sentiment="positive"
  score={95}
/>
```
**Best For:** Hero/featured story display

---

### CompactNewsCard
```tsx
<CompactNewsCard
  id="compact-1"
  title="Quick news"
  category="Finance"
  source="Reuters"
  time="1 hr ago"
  sentiment="neutral"
  score={65}
/>
```
**Best For:** Lists and sidebars

---

### AIInsights
```tsx
<AIInsights
  insights={[
    {
      id: 'in-1',
      type: 'opportunity',
      title: 'Market Growth',
      description: 'Description...',
      confidence: 85,
      topics: ['Topic1', 'Topic2'],
    },
  ]}
  isLoading={false}
/>
```
**Best For:** Displaying multiple insights in grid

---

### AIInsightCard
```tsx
<AIInsightCard
  insight={{
    id: 'in-1',
    type: 'risk',
    title: 'Risk Alert',
    description: 'Description',
    confidence: 78,
    topics: ['Risk', 'Alert'],
  }}
  index={0}
/>
```
**Best For:** Individual insight display

---

### MinimalAIInsight
```tsx
<MinimalAIInsight
  title="Quick Update"
  content="Brief insight text"
  confidence={82}
/>
```
**Best For:** Inline dashboard cards

---

### EnhancedFooter
```tsx
<EnhancedFooter />
```
**Features:** Newsletter, links, social media

---

## Sentiment Types & Colors

| Type | Color | Hex |
|------|-------|-----|
| Positive | Green | #34D399 |
| Negative | Red | #F87171 |
| Neutral | Gray | #A1A1AA |

---

## Insight Types & Icons

| Type | Icon | Color |
|------|------|-------|
| Opportunity | ✓ | Green |
| Risk | ⚠ | Red |
| Trend | ↗ | Blue (#7C8CFF) |

---

## Common Patterns

### Featured Story + Grid
```tsx
<FeaturedNewsCard {...featured} />
<div className="grid md:grid-cols-3 gap-4">
  {articles.map(a => <NewsCard key={a.id} {...a} />)}
</div>
```

### Dashboard with Insights
```tsx
<div className="space-y-12">
  <section>
    <h2>Latest News</h2>
    <div className="grid md:grid-cols-2 gap-4">
      {articles.map(a => <CompactNewsCard key={a.id} {...a} />)}
    </div>
  </section>
  
  <AIInsights insights={insights} />
</div>
```

### Full Page
```tsx
<Navigation />
<SearchBar isOpen={search} onClose={() => setSearch(false)} />

<main className="container py-12">
  <FeaturedNewsCard {...featured} />
  <div className="grid md:grid-cols-3 gap-4">
    {articles.map(a => <NewsCard key={a.id} {...a} />)}
  </div>
  <AIInsights insights={insights} />
</main>

<EnhancedFooter />
```

---

## Responsive Breakpoints

- **Mobile:** `sm:` (640px)
- **Tablet:** `md:` (768px)
- **Desktop:** `lg:` (1024px)
- **Large:** `xl:` (1280px)

### Card Layouts

```tsx
// News Cards
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>

// AI Insights
<div className="grid md:grid-cols-2 gap-4">
  {/* Insights */}
</div>

// Compact Cards
<div className="grid md:grid-cols-2 gap-3">
  {/* Compacts */}
</div>
```

---

## Styling Tips

### Custom Colors
```tsx
<NewsCard
  {...props}
  className="rounded-lg shadow-lg"
/>
```

### Custom Sizing
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-2">
  {/* More columns = smaller cards */}
</div>
```

### Dark Mode (Already Applied)
All components use dark mode colors from:
- `--background`: #0A0A0A
- `--foreground`: #F5F5F5
- `--surface`: #111111

---

## File Locations

| Component | File |
|-----------|------|
| Navigation | `layout/Navigation.tsx` |
| SearchBar | `home/SearchBar.tsx` |
| NewsCard (all) | `news/NewsCard.tsx` |
| AIInsights (all) | `home/AIInsights.tsx` |
| EnhancedFooter | `layout/EnhancedFooter.tsx` |
| Exports | `index.ts` |

---

## Type Definitions

```tsx
// News Card
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

// AI Insight
interface InsightItem {
  id: string;
  type: 'opportunity' | 'risk' | 'trend';
  title: string;
  description: string;
  confidence: number;
  topics: string[];
}

// Search Bar
interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClose?: () => void;
  isOpen?: boolean;
}
```

---

## Animation Classes

All components use Framer Motion for:
- `whileHover` - Hover animations
- `whileInView` - Scroll animations
- `variants` - Complex animations
- `transition` - Timing control

**Common Effects:**
- Lift on hover: `y: -4`
- Scale on press: `0.95`
- Fade in: `opacity: 0 → 1`

---

## Performance Tips

1. **Memoize** component lists
   ```tsx
   const NewsList = memo(({ articles }) => (
     <div>{articles.map(a => <NewsCard key={a.id} {...a} />)}</div>
   ));
   ```

2. **Lazy load** images (already done)
   ```tsx
   // Already using Next.js Image component
   ```

3. **Code split** routes
   ```tsx
   const Component = dynamic(() => import('./Component'));
   ```

---

## Troubleshooting

**Components not styling?**
- Ensure `globals.css` is imported
- Check dark mode class is applied
- Verify Tailwind config includes component paths

**Animations not working?**
- Check `'use client'` directive is present
- Ensure Framer Motion is installed
- Verify browser supports CSS animations

**Images not showing?**
- Check URL is accessible
- Ensure image dimensions are reasonable
- Use `priority` prop for above-fold images

---

## Demo Pages

- **All Components:** `/components-showcase`
- **Live Examples:** Check the showcase page with mock data

---

## Documentation Files

1. **COMPLETION_REPORT.md** - Final status and metrics
2. **COMPONENTS_SUMMARY.md** - Detailed overview
3. **IMPLEMENTATION_GUIDE.md** - In-depth guide
4. **components/README.md** - API documentation
5. **This File** - Quick reference

---

## Support

For detailed help:
- See `IMPLEMENTATION_GUIDE.md` for patterns
- Check `components/README.md` for API details
- View `/components-showcase` for live examples
- Search code for usage examples

---

## Version Info

- **Components:** v1.0.0
- **React:** 18.3.1+
- **Next.js:** 15.0.3+
- **TypeScript:** 5.6+
- **Tailwind:** 3.4+
- **Framer Motion:** 11.9+

---

Happy building! 🎉
