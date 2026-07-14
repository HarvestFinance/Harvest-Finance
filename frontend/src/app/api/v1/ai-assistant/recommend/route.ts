import { NextRequest, NextResponse } from "next/server";

interface RecommendationRequest {
  location: string;
  season: string;
  preferredCrop?: string;
  soilType?: string;
  farmSize?: string;
}

const requestLog = new Map<string, number[]>();
const recommendationCache = new Map<string, unknown>();

function checkRateLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const history = (requestLog.get(ip) ?? []).filter(
    (timestamp) => timestamp > oneMinuteAgo,
  );

  if (history.length >= 100) {
    return false;
  }

  history.push(now);
  requestLog.set(ip, history);
  return true;
}

function buildRecommendations(input: RecommendationRequest) {
  const normalizedSeason = input.season.toLowerCase();
  const normalizedSoil = (input.soilType || "").toLowerCase();
  const normalizedCrop = (input.preferredCrop || "").toLowerCase();

  const recommendations = [
    {
      crop:
        normalizedCrop ||
        (normalizedSeason.includes("rain") ? "Maize" : "Sorghum"),
      reason: `${input.location} and ${input.season} conditions support resilient staple crops with good market demand.`,
      guidance: normalizedSoil.includes("loam")
        ? "Prepare raised beds, plant early after reliable rainfall, and maintain moderate spacing for airflow."
        : "Start with moisture-preserving ridges, add compost early, and stagger planting across two short windows.",
      considerations:
        "Watch for rainfall swings and lock fertilizer purchasing before the peak demand window.",
    },
    {
      crop: normalizedSeason.includes("dry") ? "Cowpea" : "Rice",
      reason:
        "Adds diversification and improves resilience when seasonal conditions shift mid-cycle.",
      guidance:
        "Use improved seed variety, monitor early weed pressure, and keep irrigation or drainage plans ready.",
      considerations:
        "Monitor pest pressure after the first two weeks and adjust field scouting frequency.",
    },
    {
      crop:
        normalizedCrop && normalizedCrop !== "cassava"
          ? "Cassava"
          : "Groundnut",
      reason:
        "Balances shorter-term cash flow with a crop that tolerates variable field conditions.",
      guidance:
        "Prioritize healthy cuttings or seed selection and align labor planning with the expected maturity window.",
      considerations:
        "Keep an eye on storage and transport logistics if yields are above average.",
    },
  ];

  return {
    summary: `Based on ${input.location}, ${input.season}, and ${input.soilType || "your current field conditions"}, these crops give you a balanced mix of resilience, cash flow, and practical seasonal fit.`,
    recommendations,
    cached: false,
  };
}

export async function POST(request: NextRequest) {
  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const body = (await request.json()) as RecommendationRequest;

  if (!body.location?.trim() || !body.season?.trim()) {
    return NextResponse.json(
      { error: "Location and season are required." },
      { status: 400 },
    );
  }

  const cacheKey = JSON.stringify(body);
  const cached = recommendationCache.get(cacheKey);
  if (cached) {
    return NextResponse.json({
      ...(cached as Record<string, unknown>),
      cached: true,
    });
  }

  const response = buildRecommendations(body);
  recommendationCache.set(cacheKey, response);
  return NextResponse.json(response);
}
