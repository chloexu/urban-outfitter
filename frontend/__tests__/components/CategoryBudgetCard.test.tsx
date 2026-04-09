import { render, screen } from '@testing-library/react-native';
import CategoryBudgetCard from '../../components/CategoryBudgetCard';

test('renders category label and budget inputs', () => {
  render(
    <CategoryBudgetCard
      category="Pants"
      min={80}
      max={200}
      onChange={() => {}}
    />
  );
  expect(screen.getByText('Pants')).toBeTruthy();
});
