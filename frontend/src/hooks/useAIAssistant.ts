"use client";

import { create } from "zustand";
import {
  sendChatMessage,
  ChatMessage as ApiChatMessage,
  FarmContext,
} from "@/lib/api/ai-assistant-client";
import { enqueueOfflineAction } from "@/lib/offline-support";

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface AIAssistantState {
  messages: ChatEntry[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  suggestions: string[];

  sendMessage: (message: string, context?: FarmContext) => Promise<void>;
  useSuggestion: (suggestion: string, context?: FarmContext) => Promise<void>;
  loadHistoryFromServer?: () => Promise<void>;
  toggleOpen: () => void;
  openChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
  clearError: () => void;
}

let messageCounter = 0;
function generateId(): string {
  messageCounter += 1;
  return `msg-${Date.now()}-${messageCounter}`;
}

function buildHistory(messages: ChatEntry[]): ApiChatMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }));
}

export const useAIAssistantStore = create<AIAssistantState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isOpen: false,
  suggestions: [
    "What crops should I focus on this season?",
    "How can I grow my vault faster?",
    "What milestones should I aim for?",
  ],

  sendMessage: async (message: string, context?: FarmContext) => {
    const userEntry: ChatEntry = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userEntry],
      isLoading: true,
      error: null,
    }));

    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueOfflineAction({
          type: "ai-query",
          endpoint: "/api/v1/ai-assistant/chat",
          payload: {
            message,
            context,
            history: buildHistory(get().messages),
          },
        });

        const queuedAssistantEntry: ChatEntry = {
          id: generateId(),
          role: "assistant",
          content:
            "Your AI request has been queued offline and will sync automatically when the connection returns.",
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, queuedAssistantEntry],
          isLoading: false,
        }));
        return;
      }

      const history = buildHistory(get().messages);
      const response = await sendChatMessage({ message, context, history });

      const assistantEntry: ChatEntry = {
        id: generateId(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
        suggestions: response.suggestions,
      };

      set((state) => ({
        messages: [...state.messages, assistantEntry],
        isLoading: false,
        suggestions: response.suggestions || state.suggestions,
      }));
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Failed to get response. Please try again.";
      set({ error: errorMsg, isLoading: false });
    }
  },

  useSuggestion: async (suggestion: string, context?: FarmContext) => {
    await get().sendMessage(suggestion, context);
  },

  // Load persisted history from server-side store if available
  loadHistoryFromServer: async () => {
    try {
      const res = await fetch("/api/v1/ai-assistant/chat");
      if (!res.ok) return;
      const body = await res.json();
      const history = body.history || [];

      const mapped: ChatEntry[] = [];
      for (const item of history) {
        if (item.user) {
          mapped.push({
            id: generateId(),
            role: "user",
            content: item.user.content,
            timestamp: item.user.timestamp
              ? new Date(item.user.timestamp)
              : new Date(),
          });
        }
        if (item.assistant) {
          mapped.push({
            id: generateId(),
            role: "assistant",
            content: item.assistant.content,
            timestamp: item.assistant.timestamp
              ? new Date(item.assistant.timestamp)
              : new Date(),
            suggestions: item.assistant.suggestions || undefined,
          });
        }
      }

      if (mapped.length > 0) {
        set((state) => ({ messages: [...state.messages, ...mapped] }));
      }
    } catch (e) {
      // ignore
    }
  },

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  clearChat: () =>
    set({
      messages: [],
      error: null,
      suggestions: [
        "What crops should I focus on this season?",
        "How can I grow my vault faster?",
        "What milestones should I aim for?",
      ],
    }),
  clearError: () => set({ error: null }),
}));

// Persist chat to sessionStorage
try {
  const key = "ai-assistant-state-v1";
  const stored = sessionStorage.getItem(key);
  if (stored) {
    const parsed = JSON.parse(stored);
    // hydrate store with persisted values
    useAIAssistantStore.setState({
      messages: (parsed.messages || []).map((m: any) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      })),
      isOpen: parsed.isOpen || false,
      suggestions: parsed.suggestions || undefined,
    });
  }

  // subscribe to changes and save
  useAIAssistantStore.subscribe((state) => {
    const toStore = {
      messages: state.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp?.toISOString(),
      })),
      isOpen: state.isOpen,
      suggestions: state.suggestions,
    };
    try {
      sessionStorage.setItem(key, JSON.stringify(toStore));
    } catch (e) {
      // ignore storage errors
    }
  });
} catch (e) {
  // server-side or storage not available
}
