'use client'

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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
} from 'recharts'
import { vaultApi } from '@/lib/api/vault-client'
import { queryKeys } from '@/lib/query/keys'
import { formatChartTick, formatDate, toTimestamp } from '@/lib/datetime'
import { chartTokens } from '@/components/ui/theme'
import { LoadingState, ErrorState, EmptyState } from '@/components/ui'

interface ApyDataPoint {
  date: string
  apy: number
  timestamp: number
}

interface YieldChartProps {
  vaultId?: string
  timeRange?: '7d' | '30d' | '90d' | 'all'
  height?: number
  showArea?: boolean
}

export const YieldChart: React.FC<YieldChartProps> = ({
  vaultId,
  timeRange = '30d',
  height = 300,
  showArea = true,
}) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.vaults.apy(vaultId, timeRange),
    queryFn: ({ signal }) => vaultApi.getApyHistory({ vaultId, timeRange, signal }),
  })

  const chartData: ApyDataPoint[] = useMemo(
    () =>
      (data ?? []).map((item) => ({
        date: formatChartTick(item.date),
        apy: item.apy || 0,
        timestamp: toTimestamp(item.date),
      })),
    [data],
  )

  const formatApy = (value: number) => `${value.toFixed(2)}%`

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{ payload: ApyDataPoint }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-green-600">APY: {formatApy(point.apy)}</p>
          <p className="text-xs text-gray-500">{formatDate(point.timestamp, 'PPP')}</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return <LoadingState variant="card" title="Loading yield chart" className="py-10" />
  }

  if (isError) {
    return (
      <ErrorState
        variant="inline"
        title="Failed to load chart data"
        description={error instanceof Error ? error.message : undefined}
        onAction={() => {
          void refetch()
        }}
      />
    )
  }

  if (chartData.length === 0) {
    return <EmptyState variant="no-data" title="No chart data" />
  }

  const ChartComponent = showArea ? AreaChart : LineChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showArea && (
          <defs>
            <linearGradient id="apyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartTokens.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartTokens.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTokens.grid} />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTokens.axis, fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTokens.axis, fontSize: 12 }}
          tickFormatter={formatApy}
          domain={['dataMin - 0.5', 'dataMax + 0.5']}
        />
        <Tooltip content={<CustomTooltip />} />
        {showArea ? (
          <Area
            type="monotone"
            dataKey="apy"
            stroke={chartTokens.primary}
            fillOpacity={1}
            fill="url(#apyGradient)"
            strokeWidth={2}
            name="APY"
          />
        ) : (
          <Line
            type="monotone"
            dataKey="apy"
            stroke={chartTokens.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: chartTokens.primary }}
            name="APY"
          />
        )}
      </ChartComponent>
    </ResponsiveContainer>
  )
}
