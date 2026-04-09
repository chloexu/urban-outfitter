import { render, screen, fireEvent } from '@testing-library/react-native';
import PillChip from '../../components/PillChip';

test('renders unselected chip', () => {
  render(<PillChip label="Work" selected={false} onPress={() => {}} />);
  expect(screen.getByText('Work')).toBeTruthy();
});

test('calls onPress when tapped', () => {
  const onPress = jest.fn();
  render(<PillChip label="Work" selected={false} onPress={onPress} />);
  fireEvent.press(screen.getByText('Work'));
  expect(onPress).toHaveBeenCalled();
});

test('renders remove button when removable', () => {
  const onRemove = jest.fn();
  render(<PillChip label="Theory" selected onRemove={onRemove} onPress={() => {}} />);
  fireEvent.press(screen.getByTestId('chip-remove'));
  expect(onRemove).toHaveBeenCalled();
});
