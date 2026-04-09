import { Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '../constants/tokens';

export default function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
});
