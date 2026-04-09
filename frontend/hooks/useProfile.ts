import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPut } from '../lib/api';
import { getCachedProfile, setCachedProfile } from '../lib/storage';

export type Profile = {
  brands: string[];
  colors_liked: string[];
  colors_avoided: string[];
  style_tags: string[];
  occasion_prefs: string[];
  budget_defaults: Record<string, { min: number; max: number }>;
  size_prefs: Record<string, string>;
  reference_image_urls: string[];
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<Profile>('/profile');
      setProfile(data);
      await setCachedProfile(data);
    } catch (e) {
      const cached = await getCachedProfile();
      if (cached) setProfile(cached as Profile);
      else setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    const updated = await apiPut<Profile>('/profile', updates);
    setProfile(updated);
    await setCachedProfile(updated);
  }, []);

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}
