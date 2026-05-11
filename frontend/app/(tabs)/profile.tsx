import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SectionLabel from '../../components/SectionLabel';
import SectionTitle from '../../components/SectionTitle';
import PillChip from '../../components/PillChip';
import ColorCircle from '../../components/ColorCircle';
import PrimaryButton from '../../components/PrimaryButton';
import CategoryBudgetCard from '../../components/CategoryBudgetCard';
import AddTagInput from '../../components/AddTagInput';
import { Colors, FontSize, Spacing } from '../../constants/tokens';
import { COLOR_PRESETS } from '../../constants/Colors';
import { useProfile } from '../../hooks/useProfile';

const BUDGET_CATEGORIES = ['Pants', 'Sweaters', 'Dresses', 'Accessories', 'Outerwear', 'Shoes'];
const OCCASIONS = ['Work', 'Date Night', 'Weekend', 'Travel', 'Special Event', 'Workout'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading, updateProfile } = useProfile();

  const [brands, setBrands] = useState<string[]>([]);
  const [colorsLiked, setColorsLiked] = useState<string[]>([]);
  const [colorsAvoided, setColorsAvoided] = useState<string[]>([]);
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [occasionPrefs, setOccasionPrefs] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<Record<string, { min: number; max: number }>>({});

  useEffect(() => {
    if (!profile) return;
    setBrands(profile.brands ?? []);
    setColorsLiked(profile.colors_liked ?? []);
    setColorsAvoided(profile.colors_avoided ?? []);
    setStyleTags(profile.style_tags ?? []);
    setOccasionPrefs(profile.occasion_prefs ?? []);
    const defaults: Record<string, { min: number; max: number }> = {};
    BUDGET_CATEGORIES.forEach((cat) => {
      defaults[cat] = profile.budget_defaults?.[cat.toLowerCase()] ?? { min: 50, max: 300 };
    });
    setBudgets(defaults);
  }, [profile]);

  const handleSave = async () => {
    await updateProfile({
      brands,
      colors_liked: colorsLiked,
      colors_avoided: colorsAvoided,
      style_tags: styleTags,
      occasion_prefs: occasionPrefs,
      budget_defaults: Object.fromEntries(
        Object.entries(budgets).map(([k, v]) => [k.toLowerCase(), v])
      ),
    });
  };

  const toggleOccasion = (o: string) => {
    setOccasionPrefs((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]
    );
  };

  const toggleColorLiked = (name: string) => {
    setColorsLiked((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const toggleColorAvoided = (name: string) => {
    setColorsAvoided((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  if (loading) return null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.s5, paddingBottom: insets.bottom + Spacing.s10 }]}
    >
      <View style={styles.intro}>
        <SectionLabel>STYLE PROFILE</SectionLabel>
        <Text style={styles.title}>Your Preferences</Text>
        <Text style={styles.subtitle}>The more we know, the better we shop for you.</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle>Go-To Brands</SectionTitle>
        <View style={styles.chipRow}>
          {brands.map((b) => (
            <PillChip
              key={b}
              label={b}
              selected
              onRemove={() => setBrands((prev) => prev.filter((x) => x !== b))}
              onPress={() => {}}
            />
          ))}
        </View>
        <AddTagInput placeholder="Add a brand..." onAdd={(b) => setBrands((p) => [...p, b])} />
      </View>

      <View style={styles.section}>
        <SectionTitle>Budget by Category</SectionTitle>
        {BUDGET_CATEGORIES.map((cat) => (
          <CategoryBudgetCard
            key={cat}
            category={cat}
            min={budgets[cat]?.min ?? 50}
            max={budgets[cat]?.max ?? 300}
            onChange={(val) => setBudgets((prev) => ({ ...prev, [cat]: val }))}
          />
        ))}
      </View>

      <View style={styles.section}>
        <SectionTitle>Colors I Love</SectionTitle>
        <View style={styles.colorRow}>
          {Object.entries(COLOR_PRESETS).map(([name, hex]) => (
            <ColorCircle
              key={name}
              color={hex}
              selected={colorsLiked.includes(name)}
              onPress={() => toggleColorLiked(name)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle>Colors to Avoid</SectionTitle>
        <View style={styles.colorRow}>
          {Object.entries(COLOR_PRESETS).map(([name, hex]) => (
            <ColorCircle
              key={name}
              color={hex}
              selected={colorsAvoided.includes(name)}
              onPress={() => toggleColorAvoided(name)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle>Style Vibes</SectionTitle>
        <View style={styles.chipRow}>
          {styleTags.map((t) => (
            <PillChip
              key={t}
              label={t}
              selected
              onRemove={() => setStyleTags((prev) => prev.filter((x) => x !== t))}
              onPress={() => {}}
            />
          ))}
        </View>
        <AddTagInput
          placeholder="Add a style tag..."
          onAdd={(t) => setStyleTags((p) => [...p, t])}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle>Occasion Preferences</SectionTitle>
        <View style={styles.chipRow}>
          {OCCASIONS.map((o) => (
            <PillChip
              key={o}
              label={o}
              selected={occasionPrefs.includes(o)}
              onPress={() => toggleOccasion(o)}
            />
          ))}
        </View>
      </View>

      <PrimaryButton fullWidth onPress={handleSave} icon="💾">
        Save Profile
      </PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.s6 },
  intro: { marginBottom: Spacing.s6 },
  title: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.s1, marginBottom: Spacing.s1 },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary },
  section: { marginBottom: Spacing.s8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s2, marginBottom: Spacing.s3 } as ViewStyle,
  colorRow: { flexDirection: 'row', gap: Spacing.s2, flexWrap: 'wrap' } as ViewStyle,
});
