"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CategoryChartProps {
  data: { category: string; count: number }[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-6 h-full flex flex-col items-center justify-center text-muted-foreground">
        No category data available
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl p-6 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-foreground">Top Categories</h3>
        <p className="text-sm text-muted-foreground">Distribution of articles by category</p>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted))" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="category" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              width={100}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [value, 'Articles']}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]} 
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
