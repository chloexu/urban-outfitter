import { render, screen, fireEvent } from '@testing-library/react-native';
import ColorCircle from '../../components/ColorCircle';

test('renders color circle and fires onPress', () => {
  const onPress = jest.fn();
  render(<ColorCircle color="#1A1714" selected={false} onPress={onPress} />);
  fireEvent.press(screen.getByTestId('color-circle'));
  expect(onPress).toHaveBeenCalled();
});

test('renders add circle when color is undefined', () => {
  render(<ColorCircle onPress={() => {}} />);
  expect(screen.getByTestId('color-circle-add')).toBeTruthy();
});
