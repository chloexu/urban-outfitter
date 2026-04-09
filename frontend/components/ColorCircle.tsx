import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii } from '../constants/tokens';

type Props =
  | { color: string; selected: boolean; onPress: () => void }
  | { color?: undefined; onPress: () => void; selected?: undefined };

export default function ColorCircle({ color, selected, onPress }: Props) {
  if (!color) {
    return (
      <Pressable testID="color-circle-add" onPress={onPress} style={styles.add}>
        <Text style={styles.plus}>+</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      testID="color-circle"
      onPress={onPress}
      style={[
        styles.circle,
        { backgroundColor: color },
        selected && styles.selected,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
  } as ViewStyle,
  selected: {
    borderWidth: 3,
    borderColor: Colors.primary,
  } as ViewStyle,
  add: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  plus: {
    color: Colors.textSecondary,
    fontSize: 18,
    lineHeight: 20,
  },
});
