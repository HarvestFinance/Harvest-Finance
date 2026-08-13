const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface QueryHistoryItem {
  id: string;
  query: string;
  response: string;
  vaultContext: Record<string, any> | null;
  seasonalData: Record<string, any> | null;
  createdAt: string;
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchQueryHistory(search?: string): Promise<QueryHistoryItem[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const queryString = params.toString();
  const res = await fetch(`${API_BASE}/ai-query-history${queryString ? `?${queryString}` : ''}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch query history');
  return res.json();
}

export async function saveQueryHistory(payload: {
  query: string;
  response: string;
  vaultContext?: Record<string, any>;
  seasonalData?: Record<string, any>;
}): Promise<QueryHistoryItem> {
  const res = await fetch(`${API_BASE}/ai-query-history`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save query history');
  return res.json();
}

export async function deleteQueryHistory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/ai-query-history/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete history item');
}
