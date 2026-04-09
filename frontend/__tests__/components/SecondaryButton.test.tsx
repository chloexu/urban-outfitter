import { render, screen, fireEvent } from '@testing-library/react-native';
import SecondaryButton from '../../components/SecondaryButton';

test('renders label and fires onPress', () => {
  const onPress = jest.fn();
  render(<SecondaryButton onPress={onPress}>Set Up Profile</SecondaryButton>);
  fireEvent.press(screen.getByText('Set Up Profile'));
  expect(onPress).toHaveBeenCalledTimes(1);
});
