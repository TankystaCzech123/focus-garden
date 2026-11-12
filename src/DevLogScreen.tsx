import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Palette, useStyles } from './theme';

type Props = { log: string; onRefresh: () => void; onClear: () => void; onBack: () => void };

export default function DevLogScreen({ log, onRefresh, onClear, onBack }: Props) {
  const s = useStyles(makeS);
  return (
    <View style={s.screen}>
      <Text style={s.title}>Dev Log</Text>
      <ScrollView style={s.scroll}>
        <Text style={s.mono}>{log || 'Zatím prázdné. Zapni focus a zkus otevřít aplikace.'}</Text>
      </ScrollView>
      <View style={s.bar}>
        <Pressable onPress={onRefresh}><Text style={s.link}>Obnovit</Text></Pressable>
        <Pressable onPress={onClear}><Text style={s.link}>Smazat</Text></Pressable>
        <Pressable onPress={onBack}><Text style={s.link}>Zpět</Text></Pressable>
      </View>
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg, padding: 20, paddingTop: 64 },
  title: { color: c.text, fontSize: 24, fontWeight: '800', marginBottom: 12 },
  scroll: { flex: 1, backgroundColor: c.card, borderRadius: 14, borderWidth: 2, borderColor: c.border, padding: 12 },
  mono: { color: c.text, fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  bar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 },
  link: { color: c.blue, fontSize: 15, fontWeight: '800', textTransform: 'uppercase' },
  });
