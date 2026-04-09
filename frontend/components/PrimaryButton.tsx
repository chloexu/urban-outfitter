import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';

type Props = {
  children: string;
  onPress: () => void;
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: string;
};

export default function PrimaryButton({ children, onPress, fullWidth, disabled, icon }: Props) {
  return (
    <Pressable
      testID="primary-button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon && <Text style={styles.label}>{icon}</Text>}
      <Text style={styles.label}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.md,
    paddingVertical: Spacing.s4,
    paddingHorizontal: Spacing.s6,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  fullWidth: { alignSelf: 'stretch' } as ViewStyle,
  pressed: { backgroundColor: Colors.primaryDark, transform: [{ scale: 0.97 }] } as ViewStyle,
  disabled: { opacity: 0.5 } as ViewStyle,
  label: {
    color: Colors.textOnPrimary,
    fontSize: FontSize.md,
    fontWeight: '500',
  },
});
