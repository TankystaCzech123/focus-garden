import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Chunky from './Chunky';
import type { Settings } from './storage';
import { Palette, useStyles, useTheme } from './theme';
import type { UpdateInfo } from './update';

export type UpdateState = 'idle' | 'checking' | 'current' | 'none' | 'error' | 'downloading';

type Props = {
  settings: Settings;
  onChange: (s: Settings) => void;
  onDevLog: () => void;
  version: string;
  update: UpdateInfo | null;
  updateState: UpdateState;
  updateError: string;
  onCheckUpdate: () => void;
  onInstallUpdate: () => void;
};

const MODES: { id: Settings['mode']; label: string }[] = [
  { id: 'system', label: 'Podle systému' },
  { id: 'light', label: 'Světlý' },
  { id: 'dark', label: 'Tmavý' },
];

const STATUS: Record<UpdateState, string> = {
  idle: '',
  checking: 'Zjišťuji, jestli je nová verze…',
  current: 'Máš nejnovější verzi. 🎉',
  none: 'Na GitHubu zatím není žádné vydání.',
  error: '',
  downloading: 'Stahuji aktualizaci…',
};

export default function SettingsScreen(p: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const { settings, onChange } = p;
  const busy = p.updateState === 'checking' || p.updateState === 'downloading';
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
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
        <Switch value={settings.dnd} onValueChange={(v) => onChange({ ...settings, dnd: v })} trackColor={{ true: c.green, false: c.border }} />
      </View>

      <Text style={s.section}>Aplikace</Text>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Text style={s.rowText}>Verze {p.version}</Text>
          {p.updateState === 'error' ? (
            <Text style={[s.hint, { color: c.red }]}>Kontrola selhala: {p.updateError}</Text>
          ) : (
            !!STATUS[p.updateState] && <Text style={s.hint}>{STATUS[p.updateState]}</Text>
          )}
        </View>
      </View>

      {Platform.OS === 'android' ? (
        <>
          {p.update ? (
            <View style={[s.row, s.rowOn, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <Text style={[s.rowText, { color: c.blue }]}>Nová verze {p.update.version} je k dispozici</Text>
              {!!p.update.notes && <Text style={s.hint} numberOfLines={8}>{p.update.notes}</Text>}
              <Chunky
                title={p.updateState === 'downloading' ? 'Stahuji…' : 'Stáhnout a nainstalovat'}
                disabled={busy}
                color={c.blue}
                shade={c.blueDark}
                onPress={p.onInstallUpdate}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <Chunky title={p.updateState === 'checking' ? 'Hledám…' : 'Zkontrolovat aktualizace'} disabled={busy} color={c.blue} shade={c.blueDark} onPress={p.onCheckUpdate} />
          )}
          <View style={[s.row, { marginTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Kontrolovat při spuštění</Text>
              <Text style={s.hint}>Jediný síťový požadavek aplikace: veřejné GitHub API (žádná osobní data).</Text>
            </View>
            <Switch value={settings.autoUpdate} onValueChange={(v) => onChange({ ...settings, autoUpdate: v })} trackColor={{ true: c.green, false: c.border }} />
          </View>
        </>
      ) : (
        <Text style={s.hint}>Na iOS se aplikace aktualizuje přes TestFlight nebo App Store.</Text>
      )}

      <Text style={s.section}>Pro vývojáře</Text>
      <Pressable style={s.row} onPress={p.onDevLog}>
        <Text style={s.rowText}>Dev Log</Text>
        <Text style={s.hint}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { paddingTop: 64, paddingHorizontal: 20, paddingBottom: 24 },
    title: { color: c.text, fontSize: 26, fontWeight: '800', marginBottom: 8 },
    section: { color: c.faint, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: 22, marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 14, marginBottom: 8, backgroundColor: c.bg },
    rowOn: { borderColor: c.blue, backgroundColor: c.blueSoft },
    rowText: { color: c.text, fontSize: 16, fontWeight: '700' },
    hint: { color: c.dim, fontSize: 12, fontWeight: '600', marginTop: 2 },
  });
