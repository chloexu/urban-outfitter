import { View, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radii, FontSize } from '../constants/tokens';

type Tab = { key: string; label: string };
type Props = { tabs: Tab[]; activeKey: string; onChange: (key: string) => void };

export default function TabSwitcher({ tabs, activeKey, onChange }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
  } as ViewStyle,
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  tabActive: { backgroundColor: Colors.primary } as ViewStyle,
  label: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelActive: { color: Colors.textOnPrimary },
});
