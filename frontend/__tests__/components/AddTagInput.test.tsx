import { render, screen, fireEvent } from '@testing-library/react-native';
import AddTagInput from '../../components/AddTagInput';

test('calls onAdd with entered text and clears input', () => {
  const onAdd = jest.fn();
  render(<AddTagInput placeholder="Add a brand..." onAdd={onAdd} />);
  fireEvent.changeText(screen.getByPlaceholderText('Add a brand...'), 'J.Crew');
  fireEvent.press(screen.getByTestId('add-tag-button'));
  expect(onAdd).toHaveBeenCalledWith('J.Crew');
});
