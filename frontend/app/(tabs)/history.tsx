import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SectionLabel from '../../components/SectionLabel';
import { Colors, FontSize, Spacing, Radii } from '../../constants/tokens';
import { apiGet } from '../../lib/api';

type HistorySession = {
  id: string;
  mode: 'form' | 'chat';
  created_at: string;
  closed_at: string | null;
  result_count: number;
  outcome: string | null;
  inputs: Record<string, unknown> | null;
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ sessions: HistorySession[] }>('/history')
      .then((data) => setSessions(data.sessions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.s5, paddingBottom: insets.bottom + Spacing.s8 }]}
    >
      <Text style={styles.wordmark}>Urban{'\n'}Outfitter</Text>

      <View style={styles.intro}>
        <SectionLabel>HISTORY</SectionLabel>
        <Text style={styles.title}>Past Sessions</Text>
      </View>

      {loading && <Text style={styles.empty}>Loading...</Text>}
      {!loading && sessions.length === 0 && (
        <Text style={styles.empty}>No past sessions yet. Start shopping!</Text>
      )}
      {sessions.map((s) => (
        <View key={s.id} style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardMode}>{s.mode === 'chat' ? 'Chat' : 'Filters'}</Text>
            <Text style={styles.cardDate}>
              {new Date(s.created_at).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.cardResults}>{s.result_count} items found</Text>
          {s.outcome && <Text style={styles.cardOutcome}>{s.outcome}</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.bg },
  content: { paddingHorizontal: Spacing.s6 },
  wordmark: { fontFamily: 'Georgia', fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  intro: { marginTop: Spacing.s6, marginBottom: Spacing.s6 },
  title: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.textPrimary },
  empty: { color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.s10 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    padding: Spacing.s4,
    marginBottom: Spacing.s3,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.s1 } as ViewStyle,
  cardMode: { fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
  cardDate: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardResults: { fontSize: FontSize.base, color: Colors.primary, fontWeight: '600' },
  cardOutcome: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.s1 },
});
