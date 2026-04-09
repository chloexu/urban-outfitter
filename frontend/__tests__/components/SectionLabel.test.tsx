import { render, screen } from '@testing-library/react-native';
import SectionLabel from '../../components/SectionLabel';

test('renders uppercase text with correct style', () => {
  render(<SectionLabel>shopping session</SectionLabel>);
  const el = screen.getByText('shopping session');
  expect(el).toBeTruthy();
  expect(el.props.style).toMatchObject({ textTransform: 'uppercase' });
});
