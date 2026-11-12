import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import type { Settings } from './storage';
import { Palette, useStyles, useTheme } from './theme';

type Props = { settings: Settings; onChange: (s: Settings) => void; onDevLog: () => void };

const MODES: { id: Settings['mode']; label: string }[] = [
  { id: 'system', label: 'Podle systému' },
  { id: 'light', label: 'Světlý' },
  { id: 'dark', label: 'Tmavý' },
];

export default function SettingsScreen({ settings, onChange, onDevLog }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  return (
    <View style={s.screen}>
      <Text style={s.title}>Nastavení</Text>

      <Text style={s.section}>Vzhled</Text>
      {MODES.map((m) => (
        <Pressable key={m.id} style={[s.row, settings.mode === m.id && s.rowOn]} onPress={() => onChange({ ...settings, mode: m.id })}>
          <Text style={[s.rowText, settings.mode === m.id && { color: c.blue }]}>{m.label}</Text>
          {settings.mode === m.id && <Text style={{ color: c.blue, fontWeight: '900' }}>✓</Text>}
        </Pressable>
      ))}

      <Text style={s.section}>Focus</Text>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowText}>Nerušit ve focusu</Text>
          <Text style={s.hint}>Ztlumí oznámení (jen budíky), po konci vrátí původní stav.</Text>
        </View>
        <Switch
          value={settings.dnd}
          onValueChange={(v) => onChange({ ...settings, dnd: v })}
          trackColor={{ true: c.green, false: c.border }}
        />
      </View>

      <Text style={s.section}>Pro vývojáře</Text>
      <Pressable style={s.row} onPress={onDevLog}>
        <Text style={s.rowText}>Dev Log</Text>
        <Text style={s.hint}>›</Text>
      </Pressable>
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, paddingTop: 64, paddingHorizontal: 20 },
    title: { color: c.text, fontSize: 26, fontWeight: '800', marginBottom: 8 },
    section: { color: c.faint, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: 22, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 14, marginBottom: 8, backgroundColor: c.bg },
    rowOn: { borderColor: c.blue, backgroundColor: c.blueSoft },
    rowText: { color: c.text, fontSize: 16, fontWeight: '700' },
    hint: { color: c.dim, fontSize: 12, fontWeight: '600', marginTop: 2 },
  });
