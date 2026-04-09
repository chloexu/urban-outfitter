import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';

type Props = {
  min: number;
  max: number;
  onChange: (val: { min: number; max: number }) => void;
};

export default function BudgetInput({ min, max, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.prefix}>$</Text>
      <TextInput
        testID="budget-input-min"
        style={styles.input}
        value={String(min)}
        keyboardType="numeric"
        onChangeText={(v) => onChange({ min: parseInt(v) || 0, max })}
      />
      <Text style={styles.sep}>to</Text>
      <Text style={styles.prefix}>$</Text>
      <TextInput
        testID="budget-input-max"
        style={styles.input}
        value={String(max)}
        keyboardType="numeric"
        onChangeText={(v) => onChange({ min, max: parseInt(v) || 0 })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' } as ViewStyle,
  prefix: { color: Colors.textSecondary, fontSize: FontSize.base, marginRight: 4 },
  input: {
    width: 80,
    height: 44,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceInput,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sep: {
    color: Colors.textSecondary,
    marginHorizontal: Spacing.s2,
    fontSize: FontSize.base,
  },
});
