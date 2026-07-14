import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type InsurancePlanType = 'CROP_YIELD' | 'WEATHER_INDEX' | 'MARKET_PRICE' | 'COMPREHENSIVE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
}

export interface RiskAssessmentResult {
  cropType: string;
  season: string;
  overallScore: number;
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  estimatedAnnualLossUsd: number;
  recommendedCoverage: number;
}

export interface InsurancePlan {
  id: string;
  name: string;
  description: string | null;
  planType: InsurancePlanType;
  applicableRiskLevels: string;
  premiumRate: number;
  coverageMultiplier: number;
  providerName: string;
  providerContact: string | null;
}

export interface PlanRecommendation {
  plan: InsurancePlan;
  matchScore: number;
  estimatedMonthlyPremium: number;
  estimatedAnnualPremium: number;
  estimatedCoverage: number;
  rationale: string;
}

export interface RecommendationsResponse {
  assessment: RiskAssessmentResult;
  recommendations: PlanRecommendation[];
}

export interface InsuranceSubscription {
  id: string;
  planId: string;
  plan: InsurancePlan;
  cropType: string;
  insuredValue: number;
  monthlyPremium: number;
  status: SubscriptionStatus;
  coverageStart: string;
  coverageEnd: string;
  farmVaultId: string | null;
  createdAt: string;
}

export interface RiskAssessmentParams {
  cropType: string;
  season: string;
  historicalYieldKgAcre: number;
  farmAreaAcres: number;
  marketPricePerKg: number;
  soilQualityIndex: number;
  droughtRiskIndex: number;
  floodRiskIndex: number;
  marketVolatilityIndex: number;
}

export interface SubscribeParams {
  planId: string;
  cropType: string;
  insuredValue: number;
  farmVaultId?: string;
}

// ─── API functions ─────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchInsuranceRecommendations(
  token: string,
  params: RiskAssessmentParams,
): Promise<RecommendationsResponse> {
  const { data } = await apiClient.get<RecommendationsResponse>(
    '/api/insurance/recommendations',
    { params, headers: authHeaders(token) },
  );
  return data;
}

export async function fetchInsurancePlans(token: string): Promise<InsurancePlan[]> {
  const { data } = await apiClient.get<InsurancePlan[]>(
    '/api/insurance/plans',
    { headers: authHeaders(token) },
  );
  return data;
}

export async function fetchUserSubscriptions(token: string): Promise<InsuranceSubscription[]> {
  const { data } = await apiClient.get<InsuranceSubscription[]>(
    '/api/insurance/subscriptions',
    { headers: authHeaders(token) },
  );
  return data;
}

export async function subscribeToInsurancePlan(
  token: string,
  params: SubscribeParams,
): Promise<InsuranceSubscription> {
  const { data } = await apiClient.post<InsuranceSubscription>(
    '/api/insurance/subscribe',
    params,
    { headers: authHeaders(token) },
  );
  return data;
}
