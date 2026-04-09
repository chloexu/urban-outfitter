import { Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/tokens';

export default function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: FontSize.xs * 0.10,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
});
