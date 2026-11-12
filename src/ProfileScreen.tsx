import { ComponentRef, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import Chunky from './Chunky';
import { now as clockNow } from './clock';
import { Game, Stats, activity, badges, bestDay, levelInfo, longestStreak, plotEmoji, streak, totalMinutes, xp } from './rules';
import { Palette, useStyles, useTheme } from './theme';

type Props = { stats: Stats; game: Game; nickname: string; onNickname: (n: string) => void };

const hoursText = (min: number) => (min < 60 ? `${min} min` : `${(min / 60).toFixed(1).replace('.0', '')} h`);

export default function ProfileScreen({ stats, game, nickname, onNickname }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const cardRef = useRef<ComponentRef<typeof View>>(null);
  const [showCard, setShowCard] = useState(false);

  const now = clockNow();
  const lv = levelInfo(xp(stats));
  const cur = streak(stats, now);
  const best = longestStreak(stats);
  const total = totalMinutes(stats);
  const bs = badges(stats, game);
  const earned = bs.filter((b) => b.earned).length;
  const grid = activity(stats, now, 12);
  const garden = game.plots.filter(Boolean).map((p) => plotEmoji(p!)).slice(0, 12).join('');
  const shade = (m: number | null) =>
    m === null ? 'transparent' : m === 0 ? c.border : m < 15 ? '#B7E88A' : m < 45 ? '#7ED321' : c.green;

  const share = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) return Alert.alert('Sdílení není dostupné');
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Sdílet profil' });
    } catch (e) {
      Alert.alert('Chyba', String(e));
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.hero}>
        <Text style={s.heroEmoji}>{lv.emoji}</Text>
        <TextInput
          style={s.nick}
          value={nickname}
          maxLength={20}
          onChangeText={onNickname}
          placeholder="Přezdívka"
          placeholderTextColor={c.faint}
        />
        <Text style={s.level}>Úroveň {lv.level} · {lv.name}</Text>
        <View style={s.bar}><View style={[s.fill, { width: `${Math.round(lv.progress * 100)}%` }]} /></View>
        <Text style={s.small}>{lv.next ? `${xp(stats)} XP · do další úrovně ${lv.next} XP` : `${xp(stats)} XP · nejvyšší úroveň`}</Text>
      </View>

      <View style={s.tiles}>
        <Tile s={s} icon="🔥" value={String(cur)} label="Série" />
        <Tile s={s} icon="🏆" value={String(best)} label="Rekord série" />
        <Tile s={s} icon="⏱️" value={hoursText(total)} label="Celkem" />
        <Tile s={s} icon="🎯" value={String(stats.sessions)} label="Sezení" />
        <Tile s={s} icon="⚡" value={hoursText(stats.bestSession)} label="Nejdelší" />
        <Tile s={s} icon="📅" value={hoursText(bestDay(stats))} label="Nejlepší den" />
      </View>

      <Text style={s.h}>Aktivita</Text>
      <View style={s.heat}>
        {grid.map((col, i) => (
          <View key={i} style={{ gap: 3 }}>
            {col.map((d) => <View key={d.key} style={[s.cell, { backgroundColor: shade(d.minutes) }]} />)}
          </View>
        ))}
      </View>

      <Text style={s.h}>Odznaky {earned}/{bs.length}</Text>
      <View style={s.badges}>
        {bs.map((b) => (
          <Pressable key={b.id} style={[s.badge, !b.earned && s.locked]} onPress={() => Alert.alert(b.name, b.hint)}>
            <Text style={s.badgeEmoji}>{b.earned ? b.emoji : '🔒'}</Text>
            <Text style={s.badgeName} numberOfLines={1}>{b.name}</Text>
          </Pressable>
        ))}
      </View>

      <Chunky title="Sdílet profil" onPress={() => setShowCard(true)} style={{ marginTop: 8 }} />

      <Modal visible={showCard} transparent animationType="fade" onRequestClose={() => setShowCard(false)}>
        <View style={s.overlay}>
          <View ref={cardRef} collapsable={false} style={s.card}>
            <Text style={s.cardEmoji}>{lv.emoji}</Text>
            <Text style={s.cardNick}>{nickname || 'Zahradník'}</Text>
            <Text style={s.cardLevel}>Úroveň {lv.level} · {lv.name}</Text>
            <View style={s.cardRow}>
              <CardStat s={s} value={`🔥 ${cur}`} label="série" />
              <CardStat s={s} value={hoursText(total)} label="focus" />
              <CardStat s={s} value={`${earned}/${bs.length}`} label="odznaky" />
            </View>
            {!!garden && <Text style={s.cardGarden}>{garden}</Text>}
            <Text style={s.cardBrand}>Focus Garden · github.com/TankystaCzech123/focus-garden</Text>
          </View>
          <View style={s.actions}>
            <Chunky title="Sdílet" onPress={share} style={{ flex: 1 }} />
            <Chunky title="Zavřít" onPress={() => setShowCard(false)} color={c.disabled} shade={c.disabledDark} textColor={c.text} style={{ flex: 1 }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

type S = ReturnType<typeof makeS>;
const Tile = ({ s, icon, value, label }: { s: S; icon: string; value: string; label: string }) => (
  <View style={s.tile}>
    <Text style={s.tileIcon}>{icon}</Text>
    <Text style={s.tileValue}>{value}</Text>
    <Text style={s.tileLabel}>{label}</Text>
  </View>
);
const CardStat = ({ s, value, label }: { s: S; value: string; label: string }) => (
  <View style={{ alignItems: 'center' }}>
    <Text style={s.cardValue}>{value}</Text>
    <Text style={s.cardLabel}>{label}</Text>
  </View>
);

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 20, paddingTop: 56, gap: 12 },
    hero: { alignItems: 'center', gap: 6 },
    heroEmoji: { fontSize: 64 },
    nick: { fontSize: 24, fontWeight: '800', color: c.text, textAlign: 'center', minWidth: 160 },
    level: { fontSize: 15, fontWeight: '800', color: c.blue },
    bar: { alignSelf: 'stretch', height: 14, borderRadius: 7, backgroundColor: c.border, overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: c.green },
    small: { fontSize: 12, fontWeight: '700', color: c.dim },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    tile: { width: '31%', flexGrow: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: c.border, backgroundColor: c.card },
    tileIcon: { fontSize: 20 },
    tileValue: { fontSize: 18, fontWeight: '800', color: c.text },
    tileLabel: { fontSize: 11, fontWeight: '700', color: c.dim, textTransform: 'uppercase' },
    h: { fontSize: 18, fontWeight: '800', color: c.text, marginTop: 8 },
    heat: { flexDirection: 'row', justifyContent: 'space-between' },
    cell: { width: 20, height: 20, borderRadius: 4 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badge: { width: '30%', flexGrow: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 2, borderColor: c.yellow, backgroundColor: c.card },
    locked: { borderColor: c.border, opacity: 0.55 },
    badgeEmoji: { fontSize: 28 },
    badgeName: { fontSize: 11, fontWeight: '800', color: c.text, marginTop: 2 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
    card: { alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center', gap: 8, borderWidth: 3, borderColor: '#58CC02' },
    cardEmoji: { fontSize: 72 },
    cardNick: { fontSize: 28, fontWeight: '800', color: '#4B4B4B' },
    cardLevel: { fontSize: 16, fontWeight: '800', color: '#1CB0F6' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-around', alignSelf: 'stretch', marginTop: 8 },
    cardValue: { fontSize: 22, fontWeight: '800', color: '#4B4B4B' },
    cardLabel: { fontSize: 12, fontWeight: '700', color: '#777777', textTransform: 'uppercase' },
    cardGarden: { fontSize: 26, marginTop: 8, textAlign: 'center' },
    cardBrand: { fontSize: 11, fontWeight: '700', color: '#AFAFAF', marginTop: 8, textAlign: 'center' },
    actions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  });
