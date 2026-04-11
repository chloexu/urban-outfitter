import { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ViewStyle, ActivityIndicator, Pressable, Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SectionLabel from '../../components/SectionLabel';
import TabSwitcher from '../../components/TabSwitcher';
import ChatBubble from '../../components/ChatBubble';
import ChatInput from '../../components/ChatInput';
import PillChip from '../../components/PillChip';
import ColorCircle from '../../components/ColorCircle';
import BudgetInput from '../../components/BudgetInput';
import AddTagInput from '../../components/AddTagInput';
import PrimaryButton from '../../components/PrimaryButton';
import { Colors, FontSize, Spacing } from '../../constants/tokens';
import { COLOR_PRESETS } from '../../constants/Colors';
import { useProfile } from '../../hooks/useProfile';
import { useSession } from '../../hooks/useSession';
import { useSSE } from '../../hooks/useSSE';
import { getToken } from '../../lib/storage';

const TABS = [
  { key: 'chat', label: 'Chat Mode' },
  { key: 'filters', label: 'Quick Filters' },
];

const CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories'];
const OCCASIONS = ['Work', 'Date Night', 'Weekend', 'Travel', 'Special Event', 'Workout', 'Other'];

type ChatMsg = { role: 'assistant' | 'user'; text: string };

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { startSession, sendChat, closeSession } = useSession();
  const { results, progress, done, error: sseError, connect } = useSSE();

  const flatListRef = useRef<FlatList<ChatMsg>>(null);
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Filter form state
  const [category, setCategory] = useState('');
  const [occasion, setOccasion] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [budget, setBudget] = useState({ min: 50, max: 250 });
  const [styleVibes, setStyleVibes] = useState<string[]>([]);

  // Seed greeting and style vibes from profile
  useEffect(() => {
    if (!profile) return;
    const brands = profile.brands.slice(0, 3).join(', ');
    setMessages([{
      role: 'assistant',
      text: `Hey! Your go-to brands are ${brands}. What are you shopping for today?`,
    }]);
    setStyleVibes(profile.style_tags ?? []);
  }, [profile]);

  // Pre-fill budget when category changes from profile.budget_defaults
  useEffect(() => {
    if (!category || !profile) return;
    const key = category.toLowerCase();
    const defaults = profile.budget_defaults?.[key];
    if (defaults) setBudget({ min: defaults.min, max: defaults.max });
  }, [category, profile]);

  useEffect(() => {
    if (done) {
      setSearching(false);
      if (sessionId) closeSession(sessionId).catch(() => {});
      if (results.length > 0) {
        setMessages((m) => [...m, {
          role: 'assistant',
          text: `Found ${results.length} items from your brands! Here's what I found:`,
        }]);
      } else {
        setMessages((m) => [...m, {
          role: 'assistant',
          text: "I couldn't find matching items from your saved brands right now. Try adjusting your filters.",
        }]);
      }
    }
  }, [done]);

  useEffect(() => {
    if (sseError) {
      setSearching(false);
      setMessages((m) => [...m, {
        role: 'assistant',
        text: `Search failed: ${sseError}. Please try again.`,
      }]);
    }
  }, [sseError]);

  const handleChatSend = async (text: string) => {
    setMessages((m) => [...m, { role: 'user', text }]);
    setChatLoading(true);
    try {
      let sid = sessionId;
      if (!sid) {
        sid = await startSession({ mode: 'chat' });
        setSessionId(sid);
      }
      if (!sid) {
        setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, could not start a session. Please try again.' }]);
        return;
      }
      const result = await sendChat(sid, text);
      if (result.resolved) {
        setMessages((m) => [...m, { role: 'assistant', text: "Got it! I have everything I need. Starting your search now..." }]);
        setSearching(true);
        const token = await getToken();
        if (token) connect(sid, token);
      } else if (result.reply) {
        setMessages((m) => [...m, { role: 'assistant', text: result.reply! }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: `Error: ${String(e)}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleStartSearching = async () => {
    if (!category) return;
    const sid = await startSession({
      mode: 'form',
      inputs: {
        category: category.toLowerCase(),
        occasion: occasion.toLowerCase(),
        colors_liked: colors,
        budget_min: budget.min,
        budget_max: budget.max,
        style_override: styleVibes,
      },
    });
    if (sid) {
      const token = await getToken();
      if (token) connect(sid, token);
    }
  };

  const toggleColor = (name: string) => {
    setColors((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.s5 }]}>
        <Text style={styles.wordmark}>Urban{'\n'}Outfitter</Text>
        <View style={styles.headerContent}>
          <SectionLabel>SHOPPING SESSION</SectionLabel>
          <Text style={styles.title}>Find Your Next Piece</Text>
          <TabSwitcher tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        </View>
      </View>

      {activeTab === 'chat' ? (
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => <ChatBubble role={item.role} message={item.text} />}
            contentContainerStyle={{ padding: Spacing.s4 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              chatLoading ? (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              ) : searching ? (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.loadingText}>{progress ?? 'Searching your brands...'}</Text>
                </View>
              ) : done && results.length > 0 ? (
                <View style={{ paddingTop: Spacing.s2 }}>
                  {results.map((item, i) => (
                    <Pressable
                      key={i}
                      style={styles.resultCard}
                      onPress={() => Linking.openURL(item.product_url)}
                    >
                      <Text style={styles.resultBrand}>{item.retailer}</Text>
                      <Text style={styles.resultName} numberOfLines={2}>{item.product_name}</Text>
                      {item.price > 0 && <Text style={styles.resultPrice}>${item.price}</Text>}
                      <Text style={styles.resultLink}>View →</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null
            }
          />
          <ChatInput onSend={handleChatSend} disabled={chatLoading} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.filters, { paddingBottom: insets.bottom + Spacing.s8 }]}
        >
          <View style={styles.block}>
            <SectionLabel>CATEGORY</SectionLabel>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <PillChip
                  key={c}
                  label={c}
                  selected={category === c}
                  onPress={() => setCategory(category === c ? '' : c)}
                />
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <SectionLabel>OCCASION</SectionLabel>
            <View style={styles.chipRow}>
              {OCCASIONS.map((o) => (
                <PillChip
                  key={o}
                  label={o}
                  selected={occasion === o}
                  onPress={() => setOccasion(occasion === o ? '' : o)}
                />
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <SectionLabel>COLORS</SectionLabel>
            <View style={styles.colorRow}>
              {Object.entries(COLOR_PRESETS).map(([name, hex]) => (
                <ColorCircle
                  key={name}
                  color={hex}
                  selected={colors.includes(name)}
                  onPress={() => toggleColor(name)}
                />
              ))}
            </View>
          </View>

          <View style={styles.block}>
            <SectionLabel>BUDGET</SectionLabel>
            <BudgetInput min={budget.min} max={budget.max} onChange={setBudget} />
          </View>

          <View style={styles.block}>
            <SectionLabel>STYLE VIBES</SectionLabel>
            <View style={styles.chipRow}>
              {styleVibes.map((v) => (
                <PillChip
                  key={v}
                  label={v}
                  selected
                  onRemove={() => setStyleVibes((prev) => prev.filter((x) => x !== v))}
                  onPress={() => setStyleVibes((prev) => prev.filter((x) => x !== v))}
                />
              ))}
            </View>
            <AddTagInput
              placeholder="Add a style vibe..."
              onAdd={(v) => setStyleVibes((prev) => [...prev, v])}
            />
          </View>

          {progress && <Text style={styles.progress}>{progress}</Text>}
          {results.length > 0 && (
            <Text style={styles.resultsCount}>{results.length} items found — check Chat tab</Text>
          )}
          {sseError && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Search failed</Text>
              <Text style={styles.feedbackBody}>{sseError}</Text>
            </View>
          )}
          {done && results.length === 0 && !sseError && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>No results found</Text>
              <Text style={styles.feedbackBody}>
                We couldn't find matching items from your saved brands right now. Try adjusting your filters or check back later.
              </Text>
            </View>
          )}

          <PrimaryButton fullWidth onPress={handleStartSearching}>
            Start Searching →
          </PrimaryButton>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.s6,
    backgroundColor: Colors.bg,
  } as ViewStyle,
  headerContent: { marginTop: Spacing.s6, marginBottom: Spacing.s4 },
  wordmark: {
    fontFamily: 'Georgia',
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.s4,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  } as ViewStyle,
  filters: {
    paddingHorizontal: Spacing.s6,
    paddingTop: Spacing.s4,
  },
  block: { marginBottom: Spacing.s6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.s2 } as ViewStyle,
  colorRow: { flexDirection: 'row', gap: Spacing.s2 } as ViewStyle,
  progress: { color: Colors.textSecondary, marginBottom: Spacing.s3, fontStyle: 'italic' },
  resultsCount: { color: Colors.primary, fontWeight: '600', marginBottom: Spacing.s3 },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.s4,
    marginBottom: Spacing.s3,
  } as ViewStyle,
  resultBrand: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  resultName: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultPrice: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultLink: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  feedbackBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.s4,
    marginBottom: Spacing.s4,
  } as ViewStyle,
  feedbackTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.s2,
  },
  feedbackBody: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.s2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
    padding: Spacing.s3,
    paddingHorizontal: Spacing.s4,
    alignSelf: 'flex-start',
    marginBottom: Spacing.s2,
  } as ViewStyle,
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
