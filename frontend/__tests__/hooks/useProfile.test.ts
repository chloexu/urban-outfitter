import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProfile } from '../../hooks/useProfile';

jest.mock('../../lib/api', () => ({
  apiGet: jest.fn().mockResolvedValue({
    brands: ['Club Monaco', 'Theory'],
    colors_liked: ['black'],
    colors_avoided: [],
    style_tags: ['minimalist'],
    occasion_prefs: ['work'],
    budget_defaults: {},
    size_prefs: {},
    reference_image_urls: [],
  }),
  apiPut: jest.fn().mockResolvedValue({ brands: ['Club Monaco'] }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

test('loads profile on mount', async () => {
  const { result } = renderHook(() => useProfile());
  await waitFor(() => expect(result.current.profile).not.toBeNull());
  expect(result.current.profile?.brands).toContain('Club Monaco');
});

test('updateProfile calls PUT and refreshes', async () => {
  const { apiPut } = require('../../lib/api');
  const { result } = renderHook(() => useProfile());
  await waitFor(() => expect(result.current.profile).not.toBeNull());
  await act(async () => {
    await result.current.updateProfile({ brands: ['Club Monaco'] });
  });
  expect(apiPut).toHaveBeenCalledWith('/profile', { brands: ['Club Monaco'] });
});
