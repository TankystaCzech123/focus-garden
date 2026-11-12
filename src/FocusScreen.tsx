import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AppInfo } from '../modules/focus-native/src';
import Chunky from './Chunky';
import { Palette, useStyles, useTheme } from './theme';

type Props = {
  active: boolean;
  tiles: AppInfo[];
  today: number;
  goal: number;
  streakDays: number;
  cubes: number;
  coins: number;
  week: { label: string; done: boolean; frozen: boolean; today: boolean }[];
  onToggle: () => void;
  onLaunch: (id: string) => void;
  onChangeApps: () => void;
};

const days = (n: number) => (n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní');

export default function FocusScreen(p: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const done = p.today >= p.goal;
  const hint = p.active
    ? 'Soustřeď se! Telefon je zamčený na tvoje aplikace.'
    : done
      ? 'Dnešní série je v suchu. Dáš ještě jedno kolo?'
      : p.today > 0
        ? `Dnes ${p.today} z ${p.goal} min. Ještě to není hotové!`
        : p.streakDays > 0
          ? `Nenech ${p.streakDays} ${days(p.streakDays)} série zahořet. Zapni focus!`
          : 'Zapni focus a začni svou sérii!';
  const progress = Math.min(1, p.goal > 0 ? p.today / p.goal : 0);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.top}>
        <Text style={[s.chip, { color: p.streakDays ? c.orange : c.faint }]}>🔥 {p.streakDays}</Text>
        <Text style={[s.chip, { color: c.ice }]}>❄️ {p.cubes}</Text>
        <Text style={[s.chip, { color: c.yellow }]}>🪙 {p.coins}</Text>
        <Text style={[s.chip, { color: c.blue }]}>⏱️ {p.today}/{p.goal}</Text>
      </View>

      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }, done && { backgroundColor: c.green }]} />
      </View>

      <View style={s.week}>
        {p.week.map((d) => (
          <View key={d.label} style={s.day}>
            <Text style={[s.dayLabel, d.today && { color: c.orange }]}>{d.label}</Text>
            <View style={[s.dot, d.done && s.dotDone, d.frozen && !d.done && s.dotFrozen, d.today && !d.done && !d.frozen && s.dotToday]}>
              {d.done && <Text style={s.dotCheck}>✓</Text>}
              {d.frozen && !d.done && <Text style={s.dotSnow}>❄️</Text>}
            </View>
          </View>
        ))}
      </View>

      <View style={s.bubbleRow}>
        <Text style={s.mascot}>{p.active ? '🧘' : '🎯'}</Text>
        <View style={s.bubble}>
          <Text style={s.bubbleText}>{hint}</Text>
        </View>
      </View>

      {p.active && p.tiles.length > 0 && (
        <View style={s.tiles}>
          {p.tiles.map((a) => (
            <Pressable key={a.id} style={s.tile} onPress={() => p.onLaunch(a.id)}>
              {a.icon ? <Image style={s.icon} source={{ uri: `data:image/png;base64,${a.icon}` }} /> : null}
              <Text style={s.tileLabel} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={s.spacer} />
      <Chunky
        title={p.active ? 'Ukončit focus' : 'Začít focus'}
        color={p.active ? c.red : c.green}
        shade={p.active ? c.redDark : c.greenDark}
        onPress={p.onToggle}
      />
      {!p.active && (
        <Pressable onPress={p.onChangeApps}>
          <Text style={s.link}>Změnit aplikace</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { flexGrow: 1, paddingTop: 64, paddingBottom: 20, paddingHorizontal: 20 },
    top: { flexDirection: 'row', justifyContent: 'space-between' },
    chip: { fontSize: 18, fontWeight: '800' },
    progressTrack: { height: 12, borderRadius: 6, borderWidth: 2, borderColor: c.border, backgroundColor: c.card, marginTop: 12, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: c.orange },
    week: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 18, borderWidth: 2, borderColor: c.border, paddingVertical: 14, paddingHorizontal: 12, marginTop: 22 },
    day: { alignItems: 'center', gap: 8 },
    dayLabel: { color: c.dim, fontSize: 12, fontWeight: '700' },
    dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.border, alignItems: 'center', justifyContent: 'center' },
    dotDone: { backgroundColor: c.yellow },
    dotFrozen: { backgroundColor: c.ice },
    dotToday: { backgroundColor: c.bg, borderWidth: 3, borderColor: c.orange },
    dotCheck: { color: '#fff', fontWeight: '900', fontSize: 16 },
    dotSnow: { fontSize: 15 },
    bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28 },
    mascot: { fontSize: 56 },
    bubble: { flex: 1, borderWidth: 2, borderColor: c.border, borderRadius: 16, padding: 14 },
    bubbleText: { color: c.text, fontSize: 16, fontWeight: '600', lineHeight: 22 },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 24 },
    tile: { width: 72, alignItems: 'center' },
    icon: { width: 60, height: 60, borderRadius: 15 },
    tileLabel: { color: c.text, fontSize: 11, fontWeight: '600', marginTop: 4 },
    spacer: { flex: 1, minHeight: 24 },
    link: { color: c.faint, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginTop: 18 },
  });
