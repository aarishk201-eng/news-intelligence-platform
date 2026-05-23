"use client";

import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './SentimentChart.module.css';
import { analyticsApi } from '@/lib/api';

interface SentimentChartProps {
  data?: { label: string; count: number }[];
}

const COLORS = {
  positive: '#10b981', // Emerald
  neutral: '#6b7280',  // Slate
  negative: '#ef4444', // Rose
};

const DEFAULT_DATA = [
  { label: 'positive', count: 62 },
  { label: 'neutral', count: 21 },
  { label: 'negative', count: 17 },
];

export function SentimentChart({ data: propData }: SentimentChartProps) {
  const { data: queryData, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsApi.getOverview().then(res => res.data.data),
    refetchInterval: 15000,
  });

  const data = propData || (queryData?.sentimentDist ? queryData.sentimentDist.map((item: any) => ({
    label: item._id,
    count: item.count
  })) : DEFAULT_DATA);

  if (isLoading) {
    return (
      <div className="surface-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        Loading sentiment...
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        No sentiment data available
      </div>
    );
  }

  // Transform data to ensure standard casing and calculate percentages
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  const chartData = data.map(item => ({
    name: item.label.charAt(0).toUpperCase() + item.label.slice(1),
    value: item.count,
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    color: COLORS[item.label.toLowerCase() as keyof typeof COLORS] || COLORS.neutral,
  }));

  // Ensure all 3 sentiments exist in UI even if 0
  const normalizedData = [
    { name: 'Positive', color: COLORS.positive, value: chartData.find(d => d.name === 'Positive')?.value || 0, percentage: chartData.find(d => d.name === 'Positive')?.percentage || 0 },
    { name: 'Neutral', color: COLORS.neutral, value: chartData.find(d => d.name === 'Neutral')?.value || 0, percentage: chartData.find(d => d.name === 'Neutral')?.percentage || 0 },
    { name: 'Negative', color: COLORS.negative, value: chartData.find(d => d.name === 'Negative')?.value || 0, percentage: chartData.find(d => d.name === 'Negative')?.percentage || 0 },
  ].filter(d => d.value > 0); // Only show segments with data

  if (normalizedData.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        No sentiment data available
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl p-6 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-lg font-heading font-semibold text-foreground">Sentiment Analysis</h3>
        <p className="text-sm text-muted-foreground">Overall tone of published articles</p>
      </div>
      
      <div className="flex-1 min-h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={normalizedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              animationBegin={200}
              animationDuration={1000}
            >
              {normalizedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [`${value} Articles`, 'Count']}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-foreground">{total}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-2">
        {normalizedData.map((s) => (
          <div key={s.name} className="text-center p-2 rounded-lg bg-background/50 border border-white/5">
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <p className={styles.sentimentValue} style={{ color: s.color }}>{s.percentage}%</p>
            <p className="text-xs text-muted-foreground">{s.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
