import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';
import BudgetInput from './BudgetInput';

type Props = {
  category: string;
  min: number;
  max: number;
  onChange: (val: { min: number; max: number }) => void;
};

export default function CategoryBudgetCard({ category, min, max, onChange }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{category}</Text>
      <BudgetInput min={min} max={max} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.s4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.s2,
  } as ViewStyle,
  label: {
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: Spacing.s3,
  },
});
