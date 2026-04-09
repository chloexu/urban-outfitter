import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSession } from '../../hooks/useSession';

jest.mock('../../lib/api', () => ({
  apiPost: jest.fn().mockResolvedValue({ id: 'sess-123', status: 'active' }),
}));

jest.mock('../../lib/storage', () => ({
  getToken: jest.fn().mockResolvedValue('test-token'),
}));

test('startSession returns session id', async () => {
  const { result } = renderHook(() => useSession());
  let sessionId: string | null = null;
  await act(async () => {
    sessionId = await result.current.startSession({
      mode: 'form',
      inputs: {
        category: 'tops',
        occasion: 'work',
        colors_liked: [],
        budget_min: 50,
        budget_max: 150,
        style_override: [],
      },
    });
  });
  expect(sessionId).toBe('sess-123');
});

test('resumeSession calls POST /session/:id/resume', async () => {
  const { apiPost } = require('../../lib/api');
  apiPost.mockResolvedValueOnce({ status: 'active' });
  const { result } = renderHook(() => useSession());
  await act(async () => {
    await result.current.resumeSession('sess-123');
  });
  expect(apiPost).toHaveBeenCalledWith('/session/sess-123/resume');
});
