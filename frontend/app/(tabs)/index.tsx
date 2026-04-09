import { ScrollView, View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SectionLabel from '../../components/SectionLabel';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import { Colors, FontSize, Spacing, LineHeight } from '../../constants/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.s5 }]}
    >
      {/* Wordmark */}
      <Text style={styles.wordmark}>Urban{'\n'}Outfitter</Text>

      {/* Hero */}
      <View style={styles.hero}>
        <SectionLabel>YOUR PERSONAL SHOPPING AI</SectionLabel>
        <Text style={styles.h1}>Stop browsing.{'\n'}Start finding.</Text>
        <Text style={styles.body}>
          Tell us your brands, your palette, your vibe.{'\n'}
          We'll search the stores you love and surface{'\n'}
          only pieces that belong in your wardrobe.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <PrimaryButton fullWidth onPress={() => router.push('/(tabs)/search')}>
          Start Shopping →
        </PrimaryButton>
        <SecondaryButton fullWidth onPress={() => router.push('/(tabs)/profile')}>
          Set Up Profile
        </SecondaryButton>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.bg },
  content: {
    paddingHorizontal: Spacing.s6,
    paddingBottom: Spacing.s8,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  hero: { marginTop: Spacing.s10 },
  h1: {
    fontFamily: 'Georgia',
    fontSize: FontSize['2xl'],
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: LineHeight['3xl'],
    marginTop: Spacing.s2,
    marginBottom: Spacing.s4,
  },
  body: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    lineHeight: LineHeight.md,
    marginBottom: Spacing.s8,
  },
  ctas: { gap: Spacing.s3 },
});
