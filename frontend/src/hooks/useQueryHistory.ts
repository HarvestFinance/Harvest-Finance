import { useState, useEffect, useCallback } from 'react';
import {
  fetchQueryHistory,
  deleteQueryHistory,
  QueryHistoryItem,
} from '../lib/api/ai-query-history-client';

export function useQueryHistory() {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async (searchTerm?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchQueryHistory(searchTerm);
      setHistory(data);
    } catch {
      setError('Could not load query history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load(search || undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, load]);

  const removeItem = useCallback(async (id: string) => {
    try {
      await deleteQueryHistory(id);
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setError('Could not delete history item.');
    }
  }, []);

  return {
    history,
    isLoading,
    error,
    search,
    setSearch,
    removeItem,
    refresh: () => load(search || undefined),
  };
}
