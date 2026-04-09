import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing } from '../constants/tokens';

type Props = { role: 'assistant' | 'user'; message: string };

export default function ChatBubble({ role, message }: Props) {
  const isAssistant = role === 'assistant';
  return (
    <View style={[styles.bubble, isAssistant ? styles.assistant : styles.user]}>
      <Text style={[styles.text, !isAssistant && styles.textUser]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    padding: Spacing.s3,
    paddingHorizontal: Spacing.s4,
    marginBottom: Spacing.s2,
  } as ViewStyle,
  assistant: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    marginRight: 'auto',
  } as ViewStyle,
  user: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  } as ViewStyle,
  text: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  textUser: { color: Colors.textOnPrimary },
});
