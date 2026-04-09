import { render, screen } from '@testing-library/react-native';
import SectionTitle from '../../components/SectionTitle';

test('renders section title', () => {
  render(<SectionTitle>Go-To Brands</SectionTitle>);
  expect(screen.getByText('Go-To Brands')).toBeTruthy();
});
