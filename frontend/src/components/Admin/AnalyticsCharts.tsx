"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardBody, Stack } from "@/components/ui";
import { TrendingUp, BarChart2, PieChart as PieIcon } from "lucide-react";

interface TimeSeriesPoint {
  period: string;
  value: number;
}

interface DepositWithdrawPoint {
  period: string;
  deposits: number;
  withdrawals: number;
}

interface VaultDistribution {
  type: string;
  count: number;
  totalDeposits: number;
}

interface AnalyticsChartsProps {
  userGrowth: TimeSeriesPoint[];
  depositWithdrawTrends: DepositWithdrawPoint[];
  vaultDistribution: VaultDistribution[];
}

const VAULT_COLORS = ["#16a34a", "#2563eb", "#d97706", "#7c3aed", "#dc2626"];

const VAULT_LABELS: Record<string, string> = {
  CROP_PRODUCTION: "Crop Production",
  EQUIPMENT_FINANCING: "Equipment",
  LAND_ACQUISITION: "Land",
  INSURANCE_FUND: "Insurance",
  EMERGENCY_FUND: "Emergency",
};

function formatCurrency(value?: number) {
  if (value === undefined) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  userGrowth,
  depositWithdrawTrends,
  vaultDistribution,
}) => {
  const pieData = vaultDistribution.map((v) => ({
    name: VAULT_LABELS[v.type] ?? v.type,
    value: v.count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Growth Line Chart */}
      <Card className="border-none shadow-md lg:col-span-2">
        <CardBody>
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-harvest-green-600" />
              <h3 className="text-base font-semibold text-gray-800">
                User Growth (Last 12 Months)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={userGrowth}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="New Users"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Stack>
        </CardBody>
      </Card>

      {/* Deposit / Withdrawal Bar Chart */}
      <Card className="border-none shadow-md lg:col-span-2">
        <CardBody>
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-800">
                Deposit & Withdrawal Trends (Last 12 Months)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={depositWithdrawTrends}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val) =>
                    formatCurrency(
                      typeof val === "number" ? val : Number(val ?? 0),
                    )
                  }
                />
                <Legend />
                <Bar
                  dataKey="deposits"
                  name="Deposits"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="withdrawals"
                  name="Withdrawals"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Stack>
        </CardBody>
      </Card>

      {/* Vault Distribution Pie Chart */}
      <Card className="border-none shadow-md">
        <CardBody>
          <Stack gap="md">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-semibold text-gray-800">
                Vault Usage Distribution
              </h3>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(((percent ?? 0) as number) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={VAULT_COLORS[i % VAULT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                No active vault data available
              </div>
            )}
          </Stack>
        </CardBody>
      </Card>

      {/* Vault Deposits Table */}
      <Card className="border-none shadow-md">
        <CardBody>
          <Stack gap="md">
            <h3 className="text-base font-semibold text-gray-800">
              Vault Deposits by Type
            </h3>
            <div className="space-y-3">
              {vaultDistribution.length > 0 ? (
                vaultDistribution.map((v, i) => (
                  <div
                    key={v.type}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            VAULT_COLORS[i % VAULT_COLORS.length],
                        }}
                      />
                      <span className="text-sm text-gray-700">
                        {VAULT_LABELS[v.type] ?? v.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(v.totalDeposits)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {v.count} vault{v.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">No vault data available</p>
              )}
            </div>
          </Stack>
        </CardBody>
      </Card>
    </div>
  );
};
