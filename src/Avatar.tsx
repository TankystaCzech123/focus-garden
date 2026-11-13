import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { resolveLook } from './cosmetics';
import type { Look } from './cosmetics';
import { useTheme } from './theme';

/** A frame colour as a circle: solid for one colour, a smooth gradient for several (e.g. the rainbow frame). */
export function FrameCircle({ colors, size, children }: { colors: string[]; size: number; children?: React.ReactNode }) {
  const style = { width: size, height: size, borderRadius: size / 2, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (colors.length < 2) return <View style={[style, { backgroundColor: colors[0] ?? '#58CC02' }]}>{children}</View>;
  return (
    <LinearGradient colors={colors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

/** Emoji avatar with a hat and a coloured (or gradient) frame, all chosen in the shop. */
export default function Avatar({ look, size = 96 }: { look: Look; size?: number }) {
  const c = useTheme();
  const r = resolveLook(look);
  const bw = Math.max(4, size / 16);
  const inner = size - 2 * bw;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <FrameCircle colors={r.frame.colors ?? ['#58CC02']} size={size}>
        <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2, backgroundColor: c.card }]}>
          <Text style={{ fontSize: size * 0.52 }}>{r.avatar.emoji}</Text>
        </View>
      </FrameCircle>
      {!!r.hat.emoji && <Text style={{ position: 'absolute', top: -size * 0.2, fontSize: size * 0.34 }}>{r.hat.emoji}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  inner: { alignItems: 'center', justifyContent: 'center' },
});
