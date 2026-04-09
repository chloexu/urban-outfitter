import { render, screen, fireEvent } from '@testing-library/react-native';
import BudgetInput from '../../components/BudgetInput';

test('calls onChange with min/max values', () => {
  const onChange = jest.fn();
  render(<BudgetInput min={50} max={150} onChange={onChange} />);
  const inputs = screen.getAllByTestId('budget-input-field');
  fireEvent.changeText(inputs[0], '75');
  expect(onChange).toHaveBeenCalledWith({ min: 75, max: 150 });
});
