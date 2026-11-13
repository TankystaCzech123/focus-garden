import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Chunky from './Chunky';
import { CATALOG, Game, bonusText, gardenBonus, isGrown, isPlant, itemById, minutesText, plotEmoji } from './rules';
import { Palette, useStyles, useTheme } from './theme';

type Props = { game: Game; onPlant: (index: number, itemId: string) => void; onShop: () => void };

export default function GardenScreen({ game, onPlant, onShop }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const [slot, setSlot] = useState<number | null>(null);
  const bonus = gardenBonus(game.plots);
  const stock = CATALOG.filter((i) => (game.seeds[i.id] ?? 0) > 0);
  const parts = [
    bonus.coins ? `+${bonus.coins} 🪙` : '',
    bonus.xp ? `+${bonus.xp} XP` : '',
    bonus.cubeRate ? `❄️ každých ${Math.round(1 / bonus.cubeRate)} dní` : '',
  ].filter(Boolean);

  const tapPlot = (i: number) => {
    const p = game.plots[i];
    if (!p) return setSlot(i);
    const item = itemById(p.id);
    if (!item) return;
    if (!isPlant(item)) return Alert.alert(`${item.stages[0]} ${item.name}`, 'Ozdoba zahrádky.');
    Alert.alert(
      `${plotEmoji(p)} ${item.name}`,
      isGrown(p)
        ? `Dorostla! Každý den přidává ${bonusText(item)}, i když zrovna nefocusuješ.`
        : `Roste z minut focusu: ${p.grown}/${item.minutes} min. Po dorostení přidá ${bonusText(item)} denně.`,
    );
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.head}>
          <Text style={s.title}>Moje zahrádka</Text>
          <Text style={s.coins}>🪙 {game.coins}</Text>
        </View>
        <Text style={s.sub}>Rostliny rostou z minut ve focusu. Dorostlé ti denně vydělávají i bez focusu.</Text>
        <View style={s.bonusBox}>
          <Text style={s.bonusTitle}>Zahrada dnes vyděláváš</Text>
          <Text style={s.bonusText}>{parts.length ? parts.join('   ') : 'Zatím nic. Nech rostliny dorůst.'}</Text>
        </View>

        <View style={s.grid}>
          {game.plots.map((p, i) => {
            const item = p && itemById(p.id);
            const growing = !!(p && item && isPlant(item) && !isGrown(p));
            return (
              <Pressable key={i} style={[s.plot, !p && s.plotEmpty]} onPress={() => tapPlot(i)}>
                {p ? (
                  <>
                    <Text style={s.emoji}>{plotEmoji(p)}</Text>
                    {growing && item && <Text style={s.grow}>{p.grown}/{item.minutes} min</Text>}
                  </>
                ) : (
                  <Text style={s.plus}>+</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={slot !== null} transparent animationType="slide" onRequestClose={() => setSlot(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.title}>Zasadit</Text>
            {stock.length === 0 ? (
              <>
                <Text style={s.sub}>Nemáš žádná semínka. Kup je v obchodě.</Text>
                <Chunky title="Do obchodu" onPress={() => { setSlot(null); onShop(); }} />
              </>
            ) : (
              <ScrollView style={{ maxHeight: 380 }}>
                {stock.map((it) => (
                  <Pressable key={it.id} style={s.item} onPress={() => { if (slot !== null) onPlant(slot, it.id); setSlot(null); }}>
                    <Text style={s.itemEmoji}>{it.stages[it.stages.length - 1]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{it.name}</Text>
                      <Text style={s.itemSub}>{isPlant(it) ? `roste ${minutesText(it.minutes)} focusu · ${bonusText(it)}` : 'ozdoba'}</Text>
                    </View>
                    <Text style={s.count}>×{game.seeds[it.id]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Chunky title="Zavřít" color={c.blue} shade={c.blueDark} onPress={() => setSlot(null)} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, paddingTop: 64, paddingHorizontal: 20 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: c.text, fontSize: 26, fontWeight: '800' },
    coins: { color: c.yellow, fontSize: 22, fontWeight: '900' },
    sub: { color: c.dim, fontSize: 14, fontWeight: '600', marginTop: 4, marginBottom: 12 },
    bonusBox: { borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 12, marginBottom: 14, backgroundColor: c.card },
    bonusTitle: { color: c.faint, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    bonusText: { color: c.text, fontSize: 16, fontWeight: '800', marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    plot: { width: '31.5%', aspectRatio: 1, borderRadius: 18, backgroundColor: '#C98E56', borderBottomWidth: 5, borderBottomColor: '#A8723F', alignItems: 'center', justifyContent: 'center' },
    plotEmpty: { backgroundColor: c.card, borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderStyle: 'dashed' },
    emoji: { fontSize: 44 },
    grow: { color: '#fff', fontSize: 10, fontWeight: '800', marginTop: 2 },
    plus: { color: c.faint, fontSize: 34, fontWeight: '800' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 12, marginBottom: 8 },
    itemEmoji: { fontSize: 34 },
    itemName: { color: c.text, fontSize: 16, fontWeight: '800' },
    itemSub: { color: c.dim, fontSize: 12, fontWeight: '600' },
    count: { color: c.blue, fontSize: 18, fontWeight: '900' },
  });
