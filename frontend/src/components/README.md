# Premium UI Components - NewsIntel Platform

A comprehensive suite of luxury-designed, high-performance React components for the AI-powered News Intelligence Platform. Built with Next.js, Tailwind CSS, Framer Motion, and Radix UI.

## 📦 Components Overview

### 1. **Navigation** (`components/layout/Navigation.tsx`)
Premium fixed top navigation bar with glassmorphism styling and responsive design.

**Features:**
- Fixed positioning with glassmorphic backdrop blur effect
- Responsive desktop and mobile navigation
- Search trigger button with overlay support
- Notification badge with pulse indicator
- User profile menu trigger
- Mobile hamburger menu with smooth animations

**Usage:**
```tsx
import { Navigation } from '@/components/layout/Navigation';

export default function App() {
  return (
    <>
      <Navigation />
      {/* Page content */}
    </>
  );
}
```

**Styling:**
- Uses `surface-card` class for glassmorphism effect
- Accent color: `brand-accent` (#7C8CFF)
- Responsive breakpoints: `md:` prefix for desktop hiding

---

### 2. **SearchBar** (`components/home/SearchBar.tsx`)
Modal search interface with trending suggestions and recent searches.

**Features:**
- Overlay search modal with blur background
- Auto-focus on input when opened
- Recent searches display
- Trending suggestions with icons
- Keyboard navigation (ESC to close, ENTER to search)
- Clear button for input
- Smooth animations with Framer Motion

**Usage:**
```tsx
import { SearchBar } from '@/components/home/SearchBar';
import { useState } from 'react';

export default function Page() {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearch = (query: string) => {
    console.log('Search:', query);
  };

  return (
    <SearchBar
      isOpen={searchOpen}
      onClose={() => setSearchOpen(false)}
      onSearch={handleSearch}
      placeholder="Search news..."
    />
  );
}
```

**Props:**
- `isOpen?: boolean` - Controls visibility
- `onSearch?: (query: string) => void` - Search callback
- `onClose?: () => void` - Close callback
- `placeholder?: string` - Input placeholder text

---

### 3. **News Cards** (`components/news/NewsCard.tsx`)
Three variants of news cards: Featured, Standard, and Compact.

#### **NewsCard (Standard)**
Grid-friendly news card with image, sentiment indicator, and metadata.

**Usage:**
```tsx
import { NewsCard } from '@/components/news/NewsCard';

<NewsCard
  id="1"
  title="Breaking News Title"
  description="Short article description"
  category="Technology"
  source="TechCrunch"
  time="2 min ago"
  image="https://..."
  sentiment="positive"
  score={92}
  trending={true}
  onClick={() => console.log('clicked')}
/>
```

**Features:**
- Image with hover zoom effect
- Trending badge with icon
- Category badge
- Sentiment score with progress bar
- Source and timestamp metadata
- Comment button trigger
- Hover lift animation

#### **FeaturedNewsCard**
Large featured article card with two-column layout (image + content).

**Usage:**
```tsx
import { FeaturedNewsCard } from '@/components/news/NewsCard';

<FeaturedNewsCard
  id="featured-1"
  title="Major Technology Announcement"
  description="Detailed description..."
  category="AI"
  source="Bloomberg"
  time="Just now"
  image="https://..."
  sentiment="positive"
  score={95}
/>
```

**Features:**
- Responsive two-column layout (stacks on mobile)
- Large typography for headlines
- Featured badge
- Sentiment indicator with confidence display
- "Read More" call-to-action button
- Full image coverage with gradient overlay

#### **CompactNewsCard**
Minimal list-style card for news feeds and sidebars.

**Usage:**
```tsx
import { CompactNewsCard } from '@/components/news/NewsCard';

<CompactNewsCard
  id="compact-1"
  title="Quick news title"
  description="Optional description"
  category="Tech"
  source="Reuters"
  time="1 hr ago"
  sentiment="neutral"
  score={65}
  trending={false}
/>
```

**Features:**
- Minimal design for list displays
- Optional trending indicator
- Compact metadata display
- Hover slide animation
- Space-efficient layout

---

### 4. **AI Insights** (`components/home/AIInsights.tsx`)
Premium insight cards categorized by type (opportunity, risk, trend).

#### **AIInsights (Container)**
Grid layout component for displaying multiple insight cards.

**Usage:**
```tsx
import { AIInsights } from '@/components/home/AIInsights';

const insights = [
  {
    id: 'insight-1',
    type: 'opportunity',
    title: 'Market Opportunity',
    description: 'Description of the insight...',
    confidence: 88,
    topics: ['AI', 'Tech', 'Investment'],
  },
  // ... more insights
];

<AIInsights insights={insights} isLoading={false} />
```

#### **AIInsightCard**
Individual insight card with type-specific styling.

**Types:**
- **Opportunity**: Green (#34D399) - Positive business opportunities
- **Risk**: Red (#F87171) - Potential risks or concerns
- **Trend**: Brand Accent (#7C8CFF) - Emerging trends

**Features:**
- Type-specific icon and color coding
- Confidence percentage badge
- Detailed description with line clamping
- Topic tags (up to 3 shown, +N for remainder)
- "Explore Insight" call-to-action
- Staggered animation on render

**Usage:**
```tsx
import { AIInsightCard } from '@/components/home/AIInsights';

<AIInsightCard
  insight={{
    id: 'ins-1',
    type: 'opportunity',
    title: 'Title',
    description: 'Description',
    confidence: 85,
    topics: ['Topic1', 'Topic2'],
  }}
  index={0}
/>
```

#### **MinimalAIInsight**
Compact inline insight card for dashboards.

**Usage:**
```tsx
import { MinimalAIInsight } from '@/components/home/AIInsights';

<MinimalAIInsight
  title="Quick Insight"
  content="Brief insight text"
  confidence={82}
/>
```

---

### 5. **Enhanced Footer** (`components/layout/EnhancedFooter.tsx`)
Premium footer with newsletter signup, link sections, and social media.

**Features:**
- Newsletter subscription form with email validation
- Organized link sections (Product, Company, Legal)
- Social media buttons (Twitter, GitHub, LinkedIn, Email)
- Copyright information
- Responsive layout
- Newsletter success confirmation
- Smooth hover animations

**Usage:**
```tsx
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';

export default function App() {
  return (
    <>
      {/* Page content */}
      <EnhancedFooter />
    </>
  );
}
```

---

## 🎨 Design System

### Color Palette
- **Background**: `#0A0A0A`
- **Surface**: `#111111`
- **Elevated Surface**: `#181818`
- **Primary Accent**: `#7C8CFF`
- **Secondary Accent**: `#A8B3CF`
- **Primary Text**: `#F5F5F5`
- **Secondary Text**: `#A1A1AA`
- **Muted Text**: `#71717A`

### Typography
- **Display Font**: Plus Jakarta Sans (headings)
- **Body Font**: Inter (content)
- **Monospace**: UI Monospace (code)

### Spacing & Radius
- **Border Radius**: 1rem (16px) by default
- **Padding**: 20-24px for cards
- **Gap**: 16-20px between elements

### Effects
- **Glassmorphism**: `backdrop-filter: blur(18px)`
- **Shadow Elevation 1**: Subtle depth
- **Shadow Elevation 2**: Strong depth on hover
- **Soft Border**: `rgba(255,255,255,0.08)`

---

## 🚀 Getting Started

### Installation
Components use existing dependencies. Ensure these are installed:
```bash
npm install framer-motion lucide-react next-themes
```

### Import Pattern
```tsx
import { ComponentName } from '@/components/[path]/ComponentName';
```

### Integration Example
```tsx
'use client';

import { Navigation } from '@/components/layout/Navigation';
import { NewsCard } from '@/components/news/NewsCard';
import { AIInsights } from '@/components/home/AIInsights';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container py-12">
        <section className="space-y-6">
          <h1 className="text-4xl font-bold font-display">Dashboard</h1>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* News cards */}
          </div>
          
          <AIInsights insights={[...]} />
        </section>
      </main>
      
      <EnhancedFooter />
    </div>
  );
}
```

---

## 📱 Responsive Design

All components are fully responsive:
- **Mobile**: Single column, optimized touch targets
- **Tablet**: Multi-column grid layouts
- **Desktop**: Full multi-column with enhanced spacing

Breakpoints used:
- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1400px

---

## ✨ Animation & Interactions

### Framer Motion Features
- **Page Transitions**: Fade-in on load
- **Hover Effects**: Lift, scale, and color changes
- **Stagger Animations**: Cascading reveal of cards
- **Viewport Triggers**: In-view animations on scroll
- **Button Feedback**: Press animations

### CSS Animations
- **Pulse**: Notification indicators
- **Shimmer**: Loading placeholders
- **Fade**: Smooth transitions
- **Spin**: Loading spinners

---

## 🔧 Customization

### Theming
Colors are defined in `globals.css` and `tailwind.config.js`:
```css
:root {
  --background: 240 9% 3%;
  --foreground: 0 0% 96%;
  --primary: 232 100% 74%;
  --accent: 232 100% 74%;
  /* ... more colors */
}
```

### Component Props
All components accept standard HTML attributes and additional custom props for behavior control.

---

## 📚 Component Showcase
Visit `/components-showcase` route to see all components in action with mock data.

---

## 🎯 Best Practices

1. **Always use `'use client'`** for components with interactivity
2. **Import from correct paths** using the `@/` alias
3. **Pass required props** and provide sensible defaults
4. **Use Tailwind classes** for styling, not inline CSS
5. **Leverage Framer Motion** for micro-interactions
6. **Test responsive** layouts on all breakpoints
7. **Maintain color contrast** for accessibility
8. **Use semantic HTML** for better SEO

---

## 📝 License
Part of the NewsIntel Platform. All rights reserved.
