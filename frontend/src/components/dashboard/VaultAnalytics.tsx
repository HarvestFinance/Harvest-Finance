'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui';

interface VaultAnalyticsProps {
  data: any[];
  title: string;
  type?: 'line' | 'bar' | 'area';
}

export const VaultAnalytics: React.FC<VaultAnalyticsProps> = ({ 
  data, 
  title,
  type = 'line'
}) => {
  return (
    <Card variant="default" className="h-[400px]">
      <CardHeader title={title} />
      <CardBody className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="deposits" 
                stroke="#10B981" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Deposits"
              />
              <Line 
                type="monotone" 
                dataKey="withdrawals" 
                stroke="#EF4444" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                name="Withdrawals"
              />
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                 contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="growth" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorGrowth)" 
                strokeWidth={3}
                name="Seasonal Growth"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                 contentStyle={{ 
                  borderRadius: '12px', 
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar 
                dataKey="value" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
                name="Performance"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
