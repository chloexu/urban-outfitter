import { render, screen, waitFor } from '@testing-library/react-native';
import HistoryScreen from '../app/(tabs)/history';

jest.mock('../lib/api', () => ({
  apiGet: jest.fn().mockResolvedValue({
    sessions: [
      {
        id: 'h-1',
        mode: 'form',
        created_at: '2026-03-01T10:00:00Z',
        closed_at: '2026-03-01T10:05:00Z',
        result_count: 7,
        outcome: 'found_something',
        inputs: null,
      },
    ],
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

test('renders session cards from API', async () => {
  render(<HistoryScreen />);
  await waitFor(() => expect(screen.getByText('7 items found')).toBeTruthy());
  expect(screen.getByText('Filters')).toBeTruthy();
});

test('shows empty state when no sessions', async () => {
  const { apiGet } = require('../lib/api');
  apiGet.mockResolvedValueOnce({ sessions: [] });
  render(<HistoryScreen />);
  await waitFor(() =>
    expect(screen.getByText('No past sessions yet. Start shopping!')).toBeTruthy()
  );
});
