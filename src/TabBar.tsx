import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, useStyles } from './theme';

export type Tab = 'home' | 'garden' | 'profile' | 'settings';
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🔥', label: 'Focus' },
  { id: 'garden', icon: '🌱', label: 'Zahrada' },
  { id: 'profile', icon: '🏅', label: 'Profil' },
  { id: 'settings', icon: '⚙️', label: 'Nastavení' },
];

export default function TabBar({ tab, onChange, badge }: { tab: Tab; onChange: (t: Tab) => void; badge?: Tab }) {
  const s = useStyles(makeS);
  return (
    <View style={s.bar}>
      {TABS.map((t) => (
        <Pressable key={t.id} style={[s.tab, tab === t.id && s.on]} onPress={() => onChange(t.id)}>
          <Text style={s.icon}>{t.icon}</Text>
          {badge === t.id && <View style={s.badge} />}
          <Text style={[s.label, tab === t.id && s.labelOn]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', borderTopWidth: 2, borderTopColor: c.border, backgroundColor: c.bg, paddingBottom: 18, paddingTop: 8, paddingHorizontal: 12, gap: 8 },
    tab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
    on: { backgroundColor: c.blueSoft, borderColor: c.blue },
    icon: { fontSize: 22 },
    label: { fontSize: 11, fontWeight: '800', color: c.faint, textTransform: 'uppercase', marginTop: 2 },
    labelOn: { color: c.blue },
    badge: { position: 'absolute', top: 4, right: '28%', width: 12, height: 12, borderRadius: 6, backgroundColor: c.red, borderWidth: 2, borderColor: c.bg },
  });
