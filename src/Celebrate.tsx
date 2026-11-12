import { Modal, StyleSheet, Text, View } from 'react-native';
import Chunky from './Chunky';
import { Palette, useStyles } from './theme';

export type Reward = { streak: number; coins: number; cubes: number };

export default function Celebrate({ reward, onClose }: { reward: Reward | null; onClose: () => void }) {
  const s = useStyles(makeS);
  return (
    <Modal visible={reward !== null} animationType="fade" onRequestClose={onClose}>
      <View style={s.screen}>
        <Text style={s.flame}>🔥</Text>
        <Text style={s.num}>{reward?.streak}</Text>
        <Text style={s.label}>{reward?.streak === 1 ? 'den v řadě!' : 'dní v řadě!'}</Text>
        <View style={s.rewards}>
          <Text style={s.reward}>+{reward?.coins} 🪙</Text>
          {!!reward?.cubes && <Text style={[s.reward, { color: '#1CB0F6' }]}>+{reward.cubes} ❄️</Text>}
        </View>
        <Text style={s.sub}>Tvoje rostlinky se posunuly o den. Vrať se i zítra.</Text>
        <Chunky title="Pokračovat" style={{ alignSelf: 'stretch', marginTop: 28 }} onPress={onClose} />
      </View>
    </Modal>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 28 },
    flame: { fontSize: 96 },
    num: { color: c.orange, fontSize: 84, fontWeight: '900' },
    label: { color: c.orange, fontSize: 24, fontWeight: '800', marginBottom: 16 },
    rewards: { flexDirection: 'row', gap: 28, marginBottom: 8 },
    reward: { color: c.yellow, fontSize: 28, fontWeight: '900' },
    sub: { color: c.dim, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  });
