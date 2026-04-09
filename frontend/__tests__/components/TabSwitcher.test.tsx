import { render, screen, fireEvent } from '@testing-library/react-native';
import TabSwitcher from '../../components/TabSwitcher';

const tabs = [
  { key: 'chat', label: 'Chat Mode' },
  { key: 'filters', label: 'Quick Filters' },
];

test('renders both tabs', () => {
  render(<TabSwitcher tabs={tabs} activeKey="chat" onChange={() => {}} />);
  expect(screen.getByText('Chat Mode')).toBeTruthy();
  expect(screen.getByText('Quick Filters')).toBeTruthy();
});

test('calls onChange with correct key', () => {
  const onChange = jest.fn();
  render(<TabSwitcher tabs={tabs} activeKey="chat" onChange={onChange} />);
  fireEvent.press(screen.getByText('Quick Filters'));
  expect(onChange).toHaveBeenCalledWith('filters');
});
