import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';

type Props = { children: string; onPress: () => void; fullWidth?: boolean };

export default function SecondaryButton({ children, onPress, fullWidth }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s4,
    paddingHorizontal: Spacing.s6,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  fullWidth: { alignSelf: 'stretch' } as ViewStyle,
  pressed: { backgroundColor: 'rgba(0,0,0,0.04)' } as ViewStyle,
  label: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    fontWeight: '400',
  },
});
