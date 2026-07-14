export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';

export type CropType =
  | 'WHEAT'
  | 'CORN'
  | 'RICE'
  | 'SOYBEAN'
  | 'TOMATO'
  | 'POTATO'
  | 'COTTON'
  | 'BARLEY'
  | 'GENERAL';

export type TipType =
  | 'PLANTING'
  | 'WATERING'
  | 'HARVEST'
  | 'FERTILIZING'
  | 'PEST_CONTROL'
  | 'SOIL_CARE'
  | 'MARKET_INSIGHT'
  | 'VAULT_MILESTONE';

export interface SeasonalTip {
  id: string;
  cropType: CropType;
  season: Season;
  tipType: TipType;
  title: string;
  content: string;
  metrics: Record<string, string | number> | null;
  vaultMilestone: string | null;
  priority: number;
  isActive: boolean;
  iconName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TipsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SeasonalTipsResponse {
  data: SeasonalTip[];
  meta: TipsMeta;
}

export interface TipsQueryParams {
  cropType?: CropType;
  season?: Season;
  tipType?: TipType;
  vaultMilestone?: string;
  page?: number;
  limit?: number;
}

export interface VaultProgress {
  currentSeason: Season;
  selectedCrop: CropType;
  vaultBalance: number;
  vaultTarget: number;
  progressPercent: number;
  milestoneReached: string | null;
}

export const SEASON_LABELS: Record<Season, string> = {
  SPRING: 'Spring',
  SUMMER: 'Summer',
  AUTUMN: 'Autumn',
  WINTER: 'Winter',
};

export const CROP_LABELS: Record<CropType, string> = {
  WHEAT: 'Wheat',
  CORN: 'Corn',
  RICE: 'Rice',
  SOYBEAN: 'Soybean',
  TOMATO: 'Tomato',
  POTATO: 'Potato',
  COTTON: 'Cotton',
  BARLEY: 'Barley',
  GENERAL: 'General',
};

export const TIP_TYPE_LABELS: Record<TipType, string> = {
  PLANTING: 'Planting',
  WATERING: 'Watering',
  HARVEST: 'Harvest',
  FERTILIZING: 'Fertilizing',
  PEST_CONTROL: 'Pest Control',
  SOIL_CARE: 'Soil Care',
  MARKET_INSIGHT: 'Market Insight',
  VAULT_MILESTONE: 'Vault Milestone',
};

export const TIP_TYPE_COLORS: Record<TipType, string> = {
  PLANTING: 'success',
  WATERING: 'info',
  HARVEST: 'warning',
  FERTILIZING: 'secondary',
  PEST_CONTROL: 'error',
  SOIL_CARE: 'primary',
  MARKET_INSIGHT: 'default',
  VAULT_MILESTONE: 'primary',
} as const;

export function getCurrentSeason(): Season {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'SPRING';
  if (month >= 5 && month <= 7) return 'SUMMER';
  if (month >= 8 && month <= 10) return 'AUTUMN';
  return 'WINTER';
}
