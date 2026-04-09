import { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Radii, Spacing } from '../constants/tokens';

type Props = { onSend: (text: string) => void; disabled?: boolean };

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const hasContent = text.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Tell me what you're looking for..."
        placeholderTextColor={Colors.textSecondary}
        multiline
        maxLength={500}
        editable={!disabled}
      />
      <Pressable
        testID="send-button"
        onPress={handleSend}
        style={[styles.sendBtn, hasContent && styles.sendBtnActive]}
        disabled={disabled}
      >
        <Text style={styles.sendIcon}>→</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
    padding: Spacing.s3,
    paddingHorizontal: Spacing.s4,
  } as ViewStyle,
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceInput,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: Spacing.s4,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.s2,
  } as ViewStyle,
  sendBtnActive: { backgroundColor: Colors.primary } as ViewStyle,
  sendIcon: {
    color: Colors.textOnPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
});
