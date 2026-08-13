export interface YieldAnalyticsItem {
  contractId: string;
  date: string;
  totalAssets: string;
  totalShares: string;
  hardworkEventsCount: number;
  sevenDayApy: number | null;
  dailyApy: number | null;
  pricePerShare: string;
  pricePerSharePrevious: string | null;
  volume24h: string;
}

export interface CurrentApyItem {
  contractId: string;
  apy: number | null;
}

export const MOCK_CONTRACTS = [
  'CAEWQKYK7X9',
  'CAEWQKYK2M4',
  'CAEWQKYKP8L3',
  'CAEWQKYKR5N6',
  'CAEWQKYK1Q2',
];

export function generateYieldAnalytics(
  days: number,
  contractId?: string,
): YieldAnalyticsItem[] {
  const items: YieldAnalyticsItem[] = [];
  const contracts = contractId ? [contractId] : MOCK_CONTRACTS;
  let pricePerShare = 1.0;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dailyApy = 0.03 + Math.random() * 0.05;
    const sevenDayApy = 0.8 + Math.random() * 0.4;
    const dailyGrowth = 1 + (Math.random() * 0.02 - 0.01);
    pricePerShare = pricePerShare * dailyGrowth;
    const totalAssets = (100000 * Math.pow(1.001, i * 3)).toFixed(2);
    const totalShares = (99000 * Math.pow(1.001, i * 3)).toFixed(2);

    for (const cid of contracts) {
      items.push({
        contractId: cid,
        date: date.toISOString(),
        totalAssets,
        totalShares,
        hardworkEventsCount: Math.floor(Math.random() * 5),
        sevenDayApy: Number(sevenDayApy.toFixed(4)),
        dailyApy: Number(dailyApy.toFixed(4)),
        pricePerShare: Number(pricePerShare.toFixed(6)).toString(),
        pricePerSharePrevious:
          i === days
            ? null
            : Number((pricePerShare / dailyGrowth).toFixed(6)).toString(),
        volume24h: (Math.random() * 50000 + 10000).toFixed(2),
      });
    }
  }

  return items;
}

export function generateCurrentApys(): CurrentApyItem[] {
  return MOCK_CONTRACTS.map((cid) => ({
    contractId: cid,
    apy: Number((0.8 + Math.random() * 0.4).toFixed(4)),
  }));
}
