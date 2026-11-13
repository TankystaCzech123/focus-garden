import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import Chunky from './Chunky';
import { COSMETICS, Cosmetic, Slot, SLOT_NAMES, isOwned } from './cosmetics';
import { CATALOG, Game, bonusText, isPlant, minutesText, nextExpansion } from './rules';
import { Palette, useStyles, useTheme } from './theme';

export type Section = 'seeds' | 'decor' | 'avatar' | 'look' | 'plots';
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'seeds', label: '🌱 Semínka' },
  { id: 'decor', label: '🦋 Ozdoby' },
  { id: 'avatar', label: '🙂 Avatar' },
  { id: 'look', label: '🎨 Vzhled' },
  { id: 'plots', label: '🟫 Pole' },
];
const GROUPS: Record<'avatar' | 'look', Slot[]> = { avatar: ['avatar', 'hat', 'face'], look: ['frame', 'card', 'bg'] };

type Props = {
  game: Game;
  section: Section;
  onSection: (s: Section) => void;
  onBuySeed: (id: string) => void;
  onBuyCosmetic: (slot: Slot, id: string) => void;
  onEquip: (slot: Slot, id: string) => void;
  onBuyPlots: () => void;
};

export default function ShopScreen(p: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const { game } = p;
  const items = CATALOG.filter((i) => (p.section === 'seeds' ? isPlant(i) : !isPlant(i)));
  const exp = nextExpansion(game);

  const preview = (co: Cosmetic) => {
    if (co.slot === 'avatar') return <Text style={s.emoji}>{co.emoji}</Text>;
    if (co.emoji !== undefined) return <Text style={s.emoji}>{co.emoji || '∅'}</Text>;
    if (co.colors) return <View style={[s.swatch, { backgroundColor: co.colors[0] }]} />;
    if (co.card) return <View style={[s.swatch, { backgroundColor: co.card.bg, borderWidth: 2, borderColor: co.card.fg }]} />;
    if (co.bg) return <View style={[s.swatch, { backgroundColor: co.bg.light, borderWidth: 2, borderColor: c.border }]} />;
    return <View style={[s.swatch, { backgroundColor: c.card, borderWidth: 2, borderColor: c.border }]} />;
  };

  return (
    <View style={s.screen}>
      <View style={s.head}>
        <Text style={s.title}>Obchod</Text>
        <Text style={s.coins}>🪙 {game.coins}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginVertical: 10 }} contentContainerStyle={{ gap: 8 }}>
        {SECTIONS.map((x) => (
          <Pressable key={x.id} style={[s.tab, p.section === x.id && s.tabOn]} onPress={() => p.onSection(x.id)}>
            <Text style={[s.tabText, p.section === x.id && { color: c.blue }]}>{x.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {(p.section === 'seeds' || p.section === 'decor') &&
          items.map((it) => {
            const can = game.coins >= it.price;
            const stock = game.seeds[it.id] ?? 0;
            return (
              <View key={it.id} style={s.row}>
                <Text style={s.emoji}>{it.stages[it.stages.length - 1]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{it.name}</Text>
                  <Text style={s.sub}>{isPlant(it) ? `roste ${minutesText(it.minutes)} focusu · ${bonusText(it)}` : 'ozdoba zahrádky'}</Text>
                  {stock > 0 && <Text style={s.stock}>V zásobě: {stock} (zasadíš v Zahradě)</Text>}
                </View>
                <Chunky title={`🪙 ${it.price}`} disabled={!can} onPress={() => p.onBuySeed(it.id)} style={{ minWidth: 88 }} />
              </View>
            );
          })}

        {(p.section === 'avatar' || p.section === 'look') && (
          <>
            {p.section === 'avatar' && (
              <View style={{ alignItems: 'center', marginVertical: 14 }}>
                <Avatar look={game.look} size={110} />
              </View>
            )}
            {GROUPS[p.section].map((slot) => (
              <View key={slot}>
                <Text style={s.group}>{SLOT_NAMES[slot]}</Text>
                {COSMETICS.filter((co) => co.slot === slot).map((co) => {
                  const owned = isOwned(game, co);
                  const on = game.look[slot] === co.id;
                  return (
                    <View key={co.id} style={[s.row, on && { borderColor: c.green }]}>
                      {preview(co)}
                      <View style={{ flex: 1 }}>
                        <Text style={s.name}>{co.name}</Text>
                        {!owned && <Text style={s.sub}>🪙 {co.price}</Text>}
                      </View>
                      {on ? (
                        <Text style={[s.name, { color: c.green }]}>✓ Nasazeno</Text>
                      ) : owned ? (
                        <Chunky title="Nasadit" color={c.blue} shade={c.blueDark} onPress={() => p.onEquip(slot, co.id)} style={{ minWidth: 88 }} />
                      ) : (
                        <Chunky title={`🪙 ${co.price}`} disabled={game.coins < co.price} onPress={() => p.onBuyCosmetic(slot, co.id)} style={{ minWidth: 88 }} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        )}

        {p.section === 'plots' && (
          <View style={s.row}>
            <Text style={s.emoji}>🟫</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>Další pole</Text>
              <Text style={s.sub}>Máš {game.plots.length} polí. {exp ? `Rozšíření na ${exp.to} polí.` : 'Máš maximum.'}</Text>
            </View>
            {exp && <Chunky title={`🪙 ${exp.price}`} disabled={game.coins < exp.price} onPress={p.onBuyPlots} style={{ minWidth: 88 }} />}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, paddingTop: 64, paddingHorizontal: 20 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: c.text, fontSize: 26, fontWeight: '800' },
    coins: { color: c.yellow, fontSize: 22, fontWeight: '900' },
    tab: { borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14 },
    tabOn: { borderColor: c.blue, backgroundColor: c.blueSoft },
    tabText: { color: c.text, fontWeight: '800', fontSize: 14 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 12, marginBottom: 8 },
    emoji: { fontSize: 34, width: 44, textAlign: 'center' },
    swatch: { width: 40, height: 40, borderRadius: 12, marginHorizontal: 2 },
    name: { color: c.text, fontSize: 16, fontWeight: '800' },
    sub: { color: c.dim, fontSize: 12, fontWeight: '600', marginTop: 2 },
    stock: { color: c.blue, fontSize: 12, fontWeight: '800', marginTop: 2 },
    group: { color: c.faint, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  });
