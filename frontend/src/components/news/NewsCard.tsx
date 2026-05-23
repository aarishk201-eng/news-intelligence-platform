'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { enterFadeUp, hoverLift, hoverScale, hoverSlideX } from '@/lib/motion';
import { Parallax } from '@/components/ui/Parallax';
import { TrendingUp, Clock, Globe, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import styles from './NewsCard.module.css';

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

const sentimentConfig = {
  positive: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  negative: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' },
  neutral: { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
};

export function NewsCard({
  id,
  title,
  description,
  category,
  source,
  time,
  image,
  sentiment,
  score,
  trending = false,
  onClick,
}: NewsCardProps) {
  const reduceMotion = useReducedMotion();
  const sentimentStyle = sentimentConfig[sentiment];

  return (
    <motion.article
      layoutId={`news-${id}`}
      onClick={onClick}
      className="group surface-card rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
      {...enterFadeUp(0, reduceMotion)}
      {...hoverLift(-2, reduceMotion)}
    >
      <div className="relative overflow-hidden">
        {/* Image */}
        {image && (
          <div className="relative h-48 sm:h-56 w-full overflow-hidden">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Trending Badge */}
            {trending && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-accent/20 border border-brand-accent/40">
                <TrendingUp className="w-3 h-3 text-brand-accent" />
                <span className="text-xs font-semibold text-brand-accent">Trending</span>
              </div>
            )}

            {/* Category Badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-xs font-semibold text-foreground">{category}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Headline */}
          <h3 className="text-base sm:text-lg font-semibold leading-snug text-foreground line-clamp-3 group-hover:text-brand-accent transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>

          {/* Sentiment Score */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sentimentStyle.bg} border ${sentimentStyle.border}`}>
            <span className={`text-xs font-semibold ${sentimentStyle.color}`}>
              {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
            </span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              {/* eslint-disable-next-line react/forbid-dom-props */}
              <div
                className={`h-full ${sentimentStyle.color.replace('text', 'bg')} ${styles.sentimentBar}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-xs font-semibold ${sentimentStyle.color}`}>{score}%</span>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between pt-3 border-t border-white/8">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>{source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{time}</span>
              </div>
            </div>
            <motion.button
              className="p-1.5 rounded-lg text-muted-foreground hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
              {...hoverScale(1.03, reduceMotion)}
            >
              <MessageCircle className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function FeaturedNewsCard({
  id,
  title,
  description,
  category,
  source,
  time,
  image,
  sentiment,
  score,
}: NewsCardProps) {
  const reduceMotion = useReducedMotion();
  const sentimentStyle = sentimentConfig[sentiment];

  return (
    <motion.article
      layoutId={`featured-${id}`}
      className="surface-card rounded-3xl overflow-hidden group cursor-pointer"
      {...enterFadeUp(0, reduceMotion)}
      {...hoverLift(-2, reduceMotion)}
    >
      <div className="grid md:grid-cols-2 gap-0 min-h-96">
        {/* Image */}
        {image && (
          <Parallax y={-14} scrub={0.9} className="h-full">
            <div className="relative h-full overflow-hidden min-h-64 md:min-h-auto">
              <Image
                src={image}
                alt={title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </div>
          </Parallax>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 flex flex-col justify-between">
          {/* Top Badges */}
          <div className="flex items-center gap-2 mb-6">
            <div className="px-3 py-1.5 rounded-lg bg-brand-accent/20 border border-brand-accent/40">
              <span className="text-xs font-semibold text-brand-accent">Featured</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20">
              <span className="text-xs font-semibold text-foreground">{category}</span>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
              {title}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed line-clamp-3">
              {description}
            </p>

            {/* Sentiment */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg w-fit ${sentimentStyle.bg} border ${sentimentStyle.border}`}>
              <span className={`text-xs font-semibold ${sentimentStyle.color}`}>
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} Sentiment
              </span>
              <div className="flex-1 w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                {/* eslint-disable-next-line react/forbid-dom-props */}
                <div
                  className={`h-full ${sentimentStyle.color.replace('text', 'bg')} ${styles.sentimentBar}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={`text-xs font-semibold ${sentimentStyle.color}`}>{score}%</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between pt-6 border-t border-white/8">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                <span>{source}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{time}</span>
              </div>
            </div>
            <motion.button
              className="px-4 py-2 rounded-lg text-foreground bg-brand-accent/20 border border-brand-accent/40 hover:bg-brand-accent/30 transition-colors text-sm font-medium"
              {...hoverScale(1.02, reduceMotion)}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            >
              Read More
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function CompactNewsCard({
  id,
  title,
  description,
  category,
  source,
  time,
  sentiment,
  score,
  trending = false,
}: Omit<NewsCardProps, 'image'> & { image?: string }) {
  const reduceMotion = useReducedMotion();
  const sentimentStyle = sentimentConfig[sentiment];

  return (
    <motion.div
      className="group surface-card rounded-xl p-4 cursor-pointer border border-white/8 hover:border-brand-accent/30 transition-colors"
      {...enterFadeUp(0, reduceMotion)}
      {...hoverSlideX(2, reduceMotion)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-brand-accent transition-colors">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground">
              <span>{source}</span> • <span>{time}</span>
            </p>
          </div>
          {trending && (
            <TrendingUp className="w-4 h-4 text-brand-accent flex-shrink-0 mt-1" />
          )}
        </div>

        <div className={`flex items-center gap-1.5 px-2 py-1 rounded w-fit text-xs font-semibold ${sentimentStyle.bg} border ${sentimentStyle.border}`}>
          <span className={sentimentStyle.color}>{sentiment}</span>
          <span className={`${sentimentStyle.color}`}>{score}%</span>
        </div>
      </div>
    </motion.div>
  );
}
