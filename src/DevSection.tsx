import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Chunky from './Chunky';
import { verifyDevCode } from './devcode';
import { Palette, useStyles, useTheme } from './theme';

export type DevActions = {
  unlocked: boolean;
  offsetDays: number;
  today: string; // formatted app date
  backupAt: number | null; // when the real data was saved aside
  onRestore: () => void;
  onUnlock: () => void;
  onLock: () => void;
  onShift: (days: number | 'reset') => void;
  coins: (d: number) => void;
  cubes: (d: number) => void;
  minutes: (d: number) => void;
  xp: (d: number) => void;
  streak: (n: number) => void;
  completeToday: () => void;
  growAll: () => void;
  clearGarden: () => void;
  celebrate: () => void;
  resetAll: () => void;
};

/** Developer mode: unlock with the secret code, then tweak time, coins, streak, ice cubes, minutes and XP. */
export default function DevSection(p: DevActions) {
  const c = useTheme();
  const s = useStyles(makeS);
  const [code, setCode] = useState('');
  const [bad, setBad] = useState(false);
  const [streakText, setStreakText] = useState('');

  const Chips = ({ label, items }: { label: string; items: [string, () => void][] }) => (
    <View style={{ marginTop: 10 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.chips}>
        {items.map(([t, fn]) => (
          <Pressable key={t} style={s.chip} onPress={fn}>
            <Text style={s.chipText}>{t}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  const pm = (fn: (d: number) => void, steps: number[]): [string, () => void][] => [
    ...steps.map((n) => [`−${n}`, () => fn(-n)] as [string, () => void]),
    ...steps.map((n) => [`+${n}`, () => fn(n)] as [string, () => void]),
  ];

  if (!p.unlocked) {
    return (
      <View style={s.box}>
        <Text style={s.title}>🔒 Vývojářský režim</Text>
        <Text style={s.hint}>Zadej vývojářský kód. Klidně s pomlčkami a malými písmeny.</Text>
        <TextInput
          style={[s.input, bad && { borderColor: c.red }]}
          value={code}
          onChangeText={(t) => { setCode(t); setBad(false); }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
          placeholderTextColor={c.faint}
        />
        {bad && <Text style={[s.hint, { color: c.red }]}>Neplatný kód.</Text>}
        <Chunky
          title="Odemknout"
          onPress={() => { if (verifyDevCode(code)) { setCode(''); p.onUnlock(); } else setBad(true); }}
          style={{ marginTop: 10 }}
        />
      </View>
    );
  }

  return (
    <View style={s.box}>
      <Text style={s.title}>🔓 Vývojářský režim</Text>
      <Text style={s.hint}>
        {p.backupAt
          ? `🛡️ Tvoje skutečná data jsou uložená stranou (${new Date(p.backupAt).toLocaleString('cs-CZ')}). Úpravy a reset se týkají jen testovací kopie.`
          : 'Záloha skutečných dat zatím není.'}
      </Text>
      <Text style={s.hint}>Dnes je v aplikaci {p.today}{p.offsetDays ? ` (${p.offsetDays > 0 ? '+' : ''}${p.offsetDays} dní)` : ''}.</Text>

      <Chips label="Čas (skip dnů)" items={[['−1 den', () => p.onShift(-1)], ['+1 den', () => p.onShift(1)], ['+7 dní', () => p.onShift(7)], ['Reset', () => p.onShift('reset')]]} />
      <Chips label="Mince 🪙" items={pm(p.coins, [1, 10, 100])} />
      <Chips label="Ledové kostky ❄️" items={pm(p.cubes, [1])} />
      <Chips label="Minuty dnes ⏱️" items={pm(p.minutes, [1, 10, 60])} />
      <Chips label="XP ⭐" items={pm(p.xp, [10, 100])} />

      <View style={{ marginTop: 10 }}>
        <Text style={s.label}>Série 🔥 (skončí včerejškem)</Text>
        <View style={s.chips}>
          <TextInput style={[s.input, { width: 90, marginTop: 0 }]} value={streakText} onChangeText={setStreakText} keyboardType="number-pad" placeholder="počet" placeholderTextColor={c.faint} />
          <Pressable style={s.chip} onPress={() => { const n = parseInt(streakText, 10); if (n >= 0) p.streak(Math.min(n, 3650)); }}>
            <Text style={s.chipText}>Nastavit</Text>
          </Pressable>
        </View>
      </View>

      <Chips label="Akce" items={[['Splnit dnešek', p.completeToday], ['Dorůst rostliny', p.growAll], ['Vyprázdnit zahrádku', p.clearGarden], ['Ukázat oslavu', p.celebrate]]} />
      <Chunky title="Vrátit původní data" onPress={p.onRestore} color={c.blue} shade={c.blueDark} style={{ marginTop: 14 }} />
      <Chunky title="Resetovat testovací data" onPress={p.resetAll} color={c.red} shade={c.redDark} style={{ marginTop: 10 }} />
      <Chunky title="Zamknout" onPress={p.onLock} color={c.disabled} shade={c.disabledDark} textColor={c.text} style={{ marginTop: 10 }} />
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    box: { borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 14, backgroundColor: c.bg, marginTop: 8 },
    title: { color: c.text, fontSize: 16, fontWeight: '800' },
    hint: { color: c.dim, fontSize: 12, fontWeight: '600', marginTop: 4 },
    label: { color: c.faint, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
    chip: { borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: c.card },
    chipText: { color: c.text, fontWeight: '800', fontSize: 14 },
    input: { marginTop: 10, borderWidth: 2, borderColor: c.border, borderRadius: 12, padding: 10, color: c.text, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  });
