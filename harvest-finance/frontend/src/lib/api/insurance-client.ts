import { apiRequestOrThrow } from './client'

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

export async function fetchInsuranceRecommendations(
  token: string,
  params: RiskAssessmentParams,
  signal?: AbortSignal,
): Promise<RecommendationsResponse> {
  return apiRequestOrThrow<RecommendationsResponse>('/api/insurance/recommendations', {
    method: 'GET',
    params: params as unknown as Record<string, string | number | boolean | undefined>,
    auth: token,
    signal,
  })
}

export async function fetchInsurancePlans(
  token: string,
  signal?: AbortSignal,
): Promise<InsurancePlan[]> {
  return apiRequestOrThrow<InsurancePlan[]>('/api/insurance/plans', {
    method: 'GET',
    auth: token,
    signal,
  })
}

export async function fetchUserSubscriptions(
  token: string,
  signal?: AbortSignal,
): Promise<InsuranceSubscription[]> {
  return apiRequestOrThrow<InsuranceSubscription[]>('/api/insurance/subscriptions', {
    method: 'GET',
    auth: token,
    signal,
  })
}

export async function subscribeToInsurancePlan(
  token: string,
  params: SubscribeParams,
  signal?: AbortSignal,
): Promise<InsuranceSubscription> {
  return apiRequestOrThrow<InsuranceSubscription>('/api/insurance/subscribe', {
    method: 'POST',
    body: params,
    auth: token,
    signal,
  })
}
