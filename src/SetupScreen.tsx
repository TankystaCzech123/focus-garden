import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AppInfo } from '../modules/focus-native/src';
import Chunky from './Chunky';
import { MAX_APPS, toggle } from './storage';
import { Palette, useStyles, useTheme } from './theme';

type Props = { apps: AppInfo[]; onSave: (ids: string[]) => void };

/** First launch on Android: pick up to MAX_APPS apps with icons. */
export default function SetupScreen({ apps, onSave }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const [picked, setPicked] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const shown = apps.filter((a) => a.label.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <View style={s.screen}>
      <Text style={s.title}>Co smíš používat ve focusu?</Text>
      <Text style={s.sub}>Vyber až {MAX_APPS} aplikací. Všechno ostatní se zavře.</Text>
      <View style={s.progress}>
        <View style={[s.progressFill, { width: `${(picked.length / MAX_APPS) * 100}%` }]} />
      </View>
      <Text style={s.count}>{picked.length} z {MAX_APPS}</Text>
      <TextInput
        style={s.search}
        placeholder="Hledat aplikaci"
        placeholderTextColor={c.faint}
        value={q}
        onChangeText={setQ}
        autoCorrect={false}
      />
      <FlatList
        data={shown}
        numColumns={4}
        keyExtractor={(a) => a.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const on = picked.includes(item.id);
          return (
            <Pressable style={s.cell} onPress={() => setPicked((p) => toggle(p, item.id))}>
              <View style={[s.iconWrap, on && s.iconOn]}>
                {item.icon ? <Image style={s.icon} source={{ uri: `data:image/png;base64,${item.icon}` }} /> : null}
                {on && <Text style={s.check}>✓</Text>}
              </View>
              <Text style={s.label} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          );
        }}
      />
      <Chunky title="Pokračovat" disabled={!picked.length} onPress={() => onSave(picked)} style={{ marginTop: 12 }} />
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 16, paddingTop: 64, paddingBottom: 24 },
  title: { color: c.text, fontSize: 26, fontWeight: '800' },
  sub: { color: c.dim, fontSize: 15, marginTop: 6, marginBottom: 14, fontWeight: '600' },
  progress: { height: 14, borderRadius: 7, backgroundColor: c.border, overflow: 'hidden' },
  progressFill: { height: 14, borderRadius: 7, backgroundColor: c.green },
  count: { color: c.green, fontWeight: '800', fontSize: 13, marginTop: 6, marginBottom: 12 },
  search: { backgroundColor: c.card, color: c.text, borderRadius: 14, borderWidth: 2, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12, fontSize: 16, fontWeight: '600' },
  cell: { width: '25%', alignItems: 'center', paddingVertical: 8 },
  iconWrap: { width: 68, height: 68, borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  iconOn: { borderColor: c.blue, backgroundColor: c.blueSoft },
  icon: { width: 54, height: 54, borderRadius: 13 },
  check: { position: 'absolute', right: -4, top: -4, backgroundColor: c.blue, color: '#fff', width: 22, height: 22, borderRadius: 11, textAlign: 'center', lineHeight: 22, fontWeight: '900', overflow: 'hidden' },
  label: { color: c.text, fontSize: 11, fontWeight: '600', marginTop: 4, maxWidth: 76 },
  });
