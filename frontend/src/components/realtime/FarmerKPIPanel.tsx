"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Coins, Sprout, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { Card, CardBody, Stack } from "@/components/ui";
import type { FarmerMetrics, CropYield } from "@/hooks/useRealtimeAnalytics";

interface FarmerKPIPanelProps {
  metrics: FarmerMetrics | null;
  connected: boolean;
}

function fmt(n: number) {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

const PROGRESS_COLOR = (pct: number) =>
  pct >= 75 ? "#16a34a" : pct >= 40 ? "#d97706" : "#2563eb";

export const FarmerKPIPanel: React.FC<FarmerKPIPanelProps> = ({
  metrics,
  connected,
}: FarmerKPIPanelProps) => {
  return (
    <Stack gap="lg">
      <div className="flex items-center gap-2 text-sm">
        {connected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="font-medium text-green-600">Live</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400">Connecting...</span>
          </>
        )}
      </div>

      {metrics ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardBody className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <Coins className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Savings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {fmt(metrics.totalSavings)}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border-none shadow-sm">
              <CardBody className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Rewards</p>
                  <p className="text-xl font-bold text-gray-900">
                    {fmt(metrics.totalRewards)}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card className="border-none shadow-sm">
              <CardBody className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Sprout className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Active Farm Vaults</p>
                  <p className="text-xl font-bold text-gray-900">
                    {metrics.activeFarmVaults}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>

          {metrics.cropYields.length > 0 && (
            <Card className="border-none shadow-sm">
              <CardBody>
                <p className="mb-4 text-sm font-semibold text-gray-700">
                  Crop Yield Progress
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={metrics.cropYields}
                    layout="vertical"
                    margin={{ left: 8, right: 24 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value ?? 0}%`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => [
                        `${typeof value === "number" ? value : Number(value ?? 0)}% - projected yield: ${fmt(
                          item?.payload?.projectedYield ?? 0,
                        )}`,
                        "Progress",
                      ]}
                    />
                    <Bar dataKey="progressPercent" radius={[0, 4, 4, 0]}>
                      {metrics.cropYields.map((entry: CropYield, i: number) => (
                        <Cell
                          key={i}
                          fill={PROGRESS_COLOR(entry.progressPercent)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {metrics.cropYields.map((cy: CropYield) => (
                    <div
                      key={cy.vaultId}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{cy.name}</span>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-gray-500">
                          Balance: {fmt(cy.balance)}
                        </span>
                        <span className="font-semibold text-green-700">
                          +{fmt(cy.projectedYield)} yield
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">Waiting for metrics...</p>
      )}
    </Stack>
  );
};
