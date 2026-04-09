import { render, screen, fireEvent } from '@testing-library/react-native';
import PrimaryButton from '../../components/PrimaryButton';

test('renders label and fires onPress', () => {
  const onPress = jest.fn();
  render(<PrimaryButton onPress={onPress}>Start Shopping →</PrimaryButton>);
  fireEvent.press(screen.getByText('Start Shopping →'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('renders full-width when fullWidth prop set', () => {
  render(<PrimaryButton onPress={() => {}} fullWidth>Save</PrimaryButton>);
  const btn = screen.getByTestId('primary-button');
  expect(JSON.stringify(btn.props.style)).toContain('stretch');
});

test('renders leading icon when icon prop provided', () => {
  render(<PrimaryButton onPress={() => {}} icon="💾">Save Profile</PrimaryButton>);
  expect(screen.getByText('💾')).toBeTruthy();
});
