import { StyleSheet, Text, View } from 'react-native';
import { resolveLook } from './cosmetics';
import type { Look } from './cosmetics';
import { useTheme } from './theme';

/** Emoji avatar with hat, face item and a coloured frame, all chosen in the shop. */
export default function Avatar({ look, size = 96 }: { look: Look; size?: number }) {
  const c = useTheme();
  const r = resolveLook(look);
  const colors = r.frame.colors ?? ['#58CC02'];
  const border =
    colors.length === 4
      ? { borderTopColor: colors[0], borderRightColor: colors[1], borderBottomColor: colors[2], borderLeftColor: colors[3] }
      : { borderColor: colors[0] };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[s.ring, { width: size, height: size, borderRadius: size / 2, borderWidth: Math.max(4, size / 16), backgroundColor: c.card }, border]}>
        <Text style={{ fontSize: size * 0.52 }}>{r.avatar.emoji}</Text>
      </View>
      {!!r.face.emoji && <Text style={{ position: 'absolute', top: size * 0.34, fontSize: size * 0.26 }}>{r.face.emoji}</Text>}
      {!!r.hat.emoji && <Text style={{ position: 'absolute', top: -size * 0.2, fontSize: size * 0.34 }}>{r.hat.emoji}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
});
