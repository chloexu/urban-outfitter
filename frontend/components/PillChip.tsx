import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  onRemove?: () => void;
};

export default function PillChip({ label, selected, onPress, onRemove }: Props) {
  const isRemovable = selected && onRemove != null;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {isRemovable && (
        <Pressable
          testID="chip-remove"
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.removeHit}
        >
          <Text style={styles.removeIcon}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.s4,
  } as ViewStyle,
  unselected: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  } as ViewStyle,
  selected: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    paddingLeft: Spacing.s4,
    paddingRight: Spacing.s3,
  } as ViewStyle,
  label: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  labelSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '500',
  },
  removeHit: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  } as ViewStyle,
  removeIcon: {
    color: Colors.textOnPrimary,
    fontSize: 16,
  },
});
