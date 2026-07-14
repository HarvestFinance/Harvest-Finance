import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

interface FarmContext {
  selectedCrop?: string;
  currentSeason?: string;
  vaultBalance?: number;
  totalDeposits?: number;
  totalRewards?: number;
  currentMilestone?: string;
  vaultTarget?: number;
  progressPercent?: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  context?: FarmContext;
  history?: ChatMessage[];
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
  timestamp: string;
}

const requestLog = new Map<string, number[]>();

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

// Mock AI responses based on farming context
function generateAIResponse(
  message: string,
  context?: FarmContext,
  history?: ChatMessage[],
): ChatResponse {
  const lowerMessage = message.toLowerCase();

  let response = "";
  let suggestions: string[] = [];

  // Analyze the user's message and context
  if (lowerMessage.includes("crop") || lowerMessage.includes("plant")) {
    if (context?.currentSeason) {
      response = `For ${context.currentSeason}, I recommend focusing on crops that thrive in this season. `;
      if (context.currentSeason.toLowerCase().includes("summer")) {
        response += "Consider tomatoes, corn, and peppers for optimal yield.";
      } else if (context.currentSeason.toLowerCase().includes("winter")) {
        response +=
          "Root vegetables like carrots, potatoes, and onions are excellent choices.";
      } else {
        response +=
          "Seasonal crops will give you the best returns on your farming investment.";
      }
    } else {
      response =
        "Different crops perform better in different seasons. What season are you planning for?";
    }
    suggestions = [
      "What crops are best for my current season?",
      "How to optimize crop rotation?",
      "Which crops give the highest yields?",
    ];
  } else if (
    lowerMessage.includes("vault") ||
    lowerMessage.includes("deposit") ||
    lowerMessage.includes("yield")
  ) {
    if (context?.vaultBalance !== undefined) {
      const balance = context.vaultBalance;
      const target = context.vaultTarget || 1000;
      const progress = context.progressPercent || 0;

      response = `Your current vault balance is $${balance.toFixed(2)}. `;
      if (progress < 50) {
        response += `You're ${progress}% towards your $${target} target. Consider increasing your deposits to accelerate progress.`;
      } else if (progress < 90) {
        response += `Great progress! You're ${progress}% to your $${target} goal. Keep up the consistent deposits.`;
      } else {
        response += `Excellent! You're ${progress}% to your $${target} milestone. You're almost there!`;
      }
    } else {
      response =
        "Vaults are a great way to earn passive income on your crypto assets. Start with smaller deposits to test the waters.";
    }
    suggestions = [
      "How can I grow my vault faster?",
      "What are the best vault strategies?",
      "When should I harvest my rewards?",
    ];
  } else if (
    lowerMessage.includes("milestone") ||
    lowerMessage.includes("goal")
  ) {
    if (context?.currentMilestone) {
      response = `Congratulations on reaching the ${context.currentMilestone} milestone! `;
      response +=
        "This is a significant achievement. Consider setting your next target to keep the momentum going.";
    } else {
      response =
        "Milestones help track your farming progress. Set achievable goals and celebrate each accomplishment.";
    }
    suggestions = [
      "What milestones should I aim for?",
      "How to track farming progress?",
      "Rewards for reaching milestones",
    ];
  } else if (
    lowerMessage.includes("season") ||
    lowerMessage.includes("weather")
  ) {
    response =
      "Seasonal planning is crucial for successful farming. Each season brings different opportunities and challenges. Monitor weather patterns and adjust your strategy accordingly.";
    suggestions = [
      "Seasonal farming tips",
      "Weather impact on crops",
      "Planning for next season",
    ];
  } else {
    // General farming advice
    response =
      "I'm here to help with all aspects of your farming journey! Whether it's crop selection, vault strategies, seasonal planning, or milestone tracking, I can provide personalized advice based on your current situation.";
    suggestions = [
      "What crops should I focus on this season?",
      "How can I grow my vault faster?",
      "What milestones should I aim for?",
    ];
  }

  return {
    message: response,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(request)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body: ChatRequest = await request.json();
    const { message, context, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    // Generate AI response
    const response = generateAIResponse(message, context, history);

    // Persist to a simple file-backed store (dev only)
    try {
      const dataDir = path.resolve(process.cwd(), "data");
      await fs.mkdir(dataDir, { recursive: true });
      const filePath = path.join(dataDir, "ai-chat.json");

      let existing: any[] = [];
      try {
        const raw = await fs.readFile(filePath, "utf8");
        existing = JSON.parse(raw || "[]");
      } catch (e) {
        existing = [];
      }

      existing.push({
        user: {
          content: message,
          timestamp: new Date().toISOString(),
          context,
        },
        assistant: { content: response.message, timestamp: response.timestamp },
      });

      await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");
    } catch (e) {
      // ignore persistence errors but log them
      console.error("Failed to persist AI chat:", e);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("AI Assistant API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const filePath = path.resolve(process.cwd(), "data", "ai-chat.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw || "[]");
    return NextResponse.json({ history: parsed });
  } catch (e) {
    return NextResponse.json({ history: [] });
  }
}
