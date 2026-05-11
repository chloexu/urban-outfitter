import { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';

type Props = { placeholder: string; onAdd: (tag: string) => void };

export default function AddTagInput({ placeholder, onAdd }: Props) {
  const [text, setText] = useState('');
  const isEmpty = !text.trim();
  const handle = () => {
    if (isEmpty) return;
    onAdd(text.trim());
    setText('');
  };
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
        onSubmitEditing={handle}
        returnKeyType="done"
      />
      <Pressable testID="add-tag-button" onPress={handle} style={[styles.btn, isEmpty && styles.btnDisabled]}>
        <Text style={[styles.plus, isEmpty && styles.plusDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.s2 } as ViewStyle,
  input: {
    flex: 1,
    height: 44,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceInput,
    paddingHorizontal: Spacing.s3,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceInput,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  plus: { color: Colors.textPrimary, fontSize: 20 },
  btnDisabled: { borderColor: Colors.border, backgroundColor: Colors.surface } as ViewStyle,
  plusDisabled: { color: Colors.textSecondary },
});
