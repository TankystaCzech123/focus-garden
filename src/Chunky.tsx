import { useState } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Palette, useStyles, useTheme } from './theme';

type Props = {
  title: string;
  onPress: () => void;
  color?: string;
  shade?: string;
  textColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
};

/** Duolingo-style 3D button: a solid face with a darker "ledge" that sinks when pressed. */
export default function Chunky({ title, onPress, color, shade, textColor = '#fff', disabled, style }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const [down, setDown] = useState(false);
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      style={[
        s.btn,
        {
          backgroundColor: disabled ? c.disabled : (color ?? c.green),
          borderBottomColor: disabled ? c.disabledDark : (shade ?? c.greenDark),
        },
        down && s.down,
        style,
      ]}>
      <Text style={[s.text, { color: disabled ? c.faint : textColor }]}>{title}</Text>
    </Pressable>
  );
}

const makeS = (_c: Palette) =>
  StyleSheet.create({
    btn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 5 },
    down: { borderBottomWidth: 1, marginTop: 4 },
    text: { fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  });
