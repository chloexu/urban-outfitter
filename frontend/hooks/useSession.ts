import { useState, useCallback } from 'react';
import { apiPost } from '../lib/api';

export type SessionInputs = {
  category: string;
  occasion: string;
  colors_liked: string[];
  budget_min: number;
  budget_max: number;
  style_override: string[];
};

export type StartSessionRequest = {
  mode: 'form' | 'chat';
  inputs?: SessionInputs;
};

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async (req: StartSessionRequest): Promise<string | null> => {
    try {
      setLoading(true);
      const data = await apiPost<{ id: string }>('/session', req);
      setSessionId(data.id);
      return data.id;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeSession = useCallback(async (id: string): Promise<void> => {
    await apiPost(`/session/${id}/resume`);
  }, []);

  const sendChat = useCallback(async (id: string, message: string): Promise<{ reply?: string; resolved: boolean; inputs?: object }> => {
    const data = await apiPost<{ reply?: string; resolved: boolean; inputs?: object }>(`/session/${id}/chat`, { message });
    return data;
  }, []);

  const closeSession = useCallback(async (
    id: string,
    madePurchase = false,
    rating = 3
  ): Promise<void> => {
    await apiPost(`/session/${id}/close`, { made_purchase: madePurchase, rating });
  }, []);

  return { sessionId, loading, error, startSession, resumeSession, sendChat, closeSession };
}
