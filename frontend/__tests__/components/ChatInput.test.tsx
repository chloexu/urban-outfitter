import { render, screen, fireEvent } from '@testing-library/react-native';
import ChatInput from '../../components/ChatInput';

test('calls onSend with input value', () => {
  const onSend = jest.fn();
  render(<ChatInput onSend={onSend} />);
  const input = screen.getByPlaceholderText("Tell me what you're looking for...");
  fireEvent.changeText(input, 'black work tops');
  fireEvent.press(screen.getByTestId('send-button'));
  expect(onSend).toHaveBeenCalledWith('black work tops');
});

test('does not call onSend when input is empty', () => {
  const onSend = jest.fn();
  render(<ChatInput onSend={onSend} />);
  fireEvent.press(screen.getByTestId('send-button'));
  expect(onSend).not.toHaveBeenCalled();
});
