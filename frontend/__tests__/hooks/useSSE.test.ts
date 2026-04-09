import { renderHook, act } from '@testing-library/react-native';
import { useSSE } from '../../hooks/useSSE';

// Mock react-native-sse
jest.mock('react-native-sse', () => {
  return jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn((event: string, cb: (e: { data: string }) => void) => {
      if (event === 'result') {
        setTimeout(() =>
          cb({ data: JSON.stringify({ item: { retailer: 'Club Monaco', product_name: 'Blouse', price: 89, image_url: 'http://img', product_url: 'http://url' } }) }),
          10
        );
      }
    }),
    close: jest.fn(),
  }));
});

jest.mock('../../lib/storage', () => ({ getToken: jest.fn().mockResolvedValue('tok') }));

test('collects result events', async () => {
  const { result } = renderHook(() => useSSE());
  await act(async () => {
    result.current.connect('sess-123', 'tok');
    await new Promise((r) => setTimeout(r, 50));
  });
  expect(result.current.results.length).toBeGreaterThan(0);
  expect(result.current.results[0].product_name).toBe('Blouse');
});
