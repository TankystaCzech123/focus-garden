import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Chunky from './Chunky';
import { CATALOG, Game, plotEmoji, itemById } from './rules';
import { Palette, useStyles, useTheme } from './theme';

type Props = { game: Game; onPlant: (index: number, itemId: string) => void };

export default function GardenScreen({ game, onPlant }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const [slot, setSlot] = useState<number | null>(null);

  return (
    <View style={s.screen}>
      <View style={s.head}>
        <Text style={s.title}>Moje zahrádka</Text>
        <Text style={s.coins}>🪙 {game.coins}</Text>
      </View>
      <Text style={s.sub}>Semínka rostou, když splníš den ve focusu.</Text>

      <View style={s.grid}>
        {game.plots.map((p, i) => {
          const item = p && itemById(p.id);
          const growing = !!(p && item && item.days > 0 && p.grown < item.days);
          return (
            <Pressable key={i} style={[s.plot, !p && s.plotEmpty]} onPress={() => !p && setSlot(i)}>
              {p ? (
                <>
                  <Text style={s.emoji}>{plotEmoji(p)}</Text>
                  {growing && item && <Text style={s.grow}>{p.grown}/{item.days} dní</Text>}
                </>
              ) : (
                <Text style={s.plus}>+</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <Modal visible={slot !== null} transparent animationType="slide" onRequestClose={() => setSlot(null)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <Text style={s.title}>Obchod</Text>
            <Text style={s.sub}>Máš 🪙 {game.coins}</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {CATALOG.map((it) => {
                const can = game.coins >= it.price;
                return (
                  <Pressable
                    key={it.id}
                    disabled={!can}
                    style={[s.item, !can && { opacity: 0.45 }]}
                    onPress={() => { if (slot !== null) onPlant(slot, it.id); setSlot(null); }}>
                    <Text style={s.itemEmoji}>{it.stages[it.stages.length - 1]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{it.name}</Text>
                      <Text style={s.itemSub}>{it.days ? `roste ${it.days} dní focusu` : 'ozdoba'}</Text>
                    </View>
                    <Text style={s.price}>🪙 {it.price}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
    sub: { color: c.dim, fontSize: 14, fontWeight: '600', marginTop: 4, marginBottom: 16 },
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
    price: { color: c.yellow, fontSize: 16, fontWeight: '900' },
  });
