import { render, screen } from '@testing-library/react-native';
import ChatBubble from '../../components/ChatBubble';

test('renders assistant message', () => {
  render(<ChatBubble role="assistant" message="Hey! What are you shopping for?" />);
  expect(screen.getByText('Hey! What are you shopping for?')).toBeTruthy();
});

test('renders user message', () => {
  render(<ChatBubble role="user" message="Work tops in black" />);
  expect(screen.getByText('Work tops in black')).toBeTruthy();
});
