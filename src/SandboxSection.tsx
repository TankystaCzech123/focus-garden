import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import Focus from '../modules/focus-native/src';
import Chunky from './Chunky';
import type { Game, Stats } from './rules';
import { Access, DATA_REPO, CLIENT_ID, buildReport, checkAccess, pollOnce, reportPath, startDeviceFlow, uploadReport } from './sandbox';
import type { Settings } from './storage';
import { Palette, useStyles, useTheme } from './theme';

const KEY = 'sandbox.token';
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

type Props = { stats: Stats; game: Game; settings: Settings; version: string };

/** Developer sandbox: sign in with GitHub, then send a report to the private data repo. Android only. */
export default function SandboxSection({ stats, game, settings, version }: Props) {
  const c = useTheme();
  const s = useStyles(makeS);
  const [token, setToken] = useState<string | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const attempt = useRef(0); // bumped by sign-out / cancel so an in-flight login stops

  const signOut = async (text = '') => {
    attempt.current++;
    await SecureStore.deleteItemAsync(KEY).catch(() => {});
    setToken(null); setAccess(null); setCode(''); setMsg(text);
  };

  const verify = async (t: string) => {
    try {
      const a = await checkAccess(t);
      if (!a.canPush) return signOut(`Účet ${a.login} nemá přístup do sandboxu: ${a.reason ?? 'neznámý důvod'}. Požádej vlastníka o přidání do ${DATA_REPO}.`);
      setToken(t); setAccess(a); setMsg('');
    } catch (e) {
      if (String(e).includes('unauthorized')) await signOut('Přihlášení vypršelo, přihlas se znovu.');
      else setMsg(`Ověření selhalo: ${e instanceof Error ? e.message : e}`);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'android') SecureStore.getItemAsync(KEY).then((t) => { if (t) void verify(t); }).catch(() => {});
    return () => { attempt.current++; };
  }, []);

  if (Platform.OS !== 'android') return null;

  const login = async () => {
    setBusy(true); setMsg('');
    const me = ++attempt.current;
    try {
      const dc = await startDeviceFlow();
      setCode(dc.userCode);
      void Linking.openURL(dc.verificationUri);
      let wait = dc.interval;
      const until = Date.now() + dc.expiresIn * 1000;
      while (attempt.current === me && Date.now() < until) {
        await sleep(wait);
        if (attempt.current !== me) break;
        const r = await pollOnce(dc, wait);
        if (attempt.current !== me) break; // cancelled while the request was in flight
        if (r.status === 'pending') { wait = r.wait; continue; }
        if (r.status === 'failed') { setMsg(r.error); break; }
        await SecureStore.setItemAsync(KEY, r.token);
        await verify(r.token);
        break;
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false); setCode('');
    }
  };

  const send = async () => {
    if (!token || !access) return;
    setBusy(true); setMsg('');
    try {
      const now = Date.now();
      const report = buildReport(
        { version, device: Focus.getDeviceInfo(), devLog: await Focus.getDevLog(), stats, game, settings },
        now,
      );
      const kb = Math.max(1, Math.round(JSON.stringify(report).length / 1024));
      const ok = await new Promise<boolean>((resolve) =>
        Alert.alert(
          'Poslat do sandboxu?',
          `Pošle se do soukromého repa ${DATA_REPO}: Dev Log (${report.devLog.split('\n').length} řádků, názvy balíčků aplikací), model telefonu a verze, statistiky a stav hry. Bez přezdívky a bez tokenu. Asi ${kb} kB.`,
          [{ text: 'Zrušit', style: 'cancel', onPress: () => resolve(false) }, { text: 'Poslat', onPress: () => resolve(true) }],
          { cancelable: true, onDismiss: () => resolve(false) },
        ),
      );
      if (!ok) return;
      await uploadReport(token, reportPath(access.login, now), report);
      setMsg('Odesláno. ✅');
    } catch (e) {
      if (String(e).includes('unauthorized')) await signOut('Přihlášení vypršelo, přihlas se znovu.');
      else setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View>
      <Text style={s.section}>Vývojářský sandbox</Text>
      <View style={s.box}>
        {access ? (
          <>
            <Text style={s.title}>🔓 Odemčeno · {access.login}</Text>
            <Text style={s.hint}>Pošle Dev Log, model telefonu, statistiky a stav hry do soukromého repa. Nic se neposílá samo.</Text>
            <Chunky title={busy ? 'Pracuji…' : 'Poslat do sandboxu'} disabled={busy} onPress={() => void send()} style={{ marginTop: 10 }} />
            <Chunky title="Odhlásit" onPress={() => void signOut()} color={c.disabled} shade={c.disabledDark} textColor={c.text} style={{ marginTop: 10 }} />
          </>
        ) : (
          <>
            <Text style={s.title}>🔒 Zamčeno</Text>
            <Text style={s.hint}>
              {CLIENT_ID ? 'Pro vlastníka a přispěvatele projektu. Přihlas se přes GitHub.' : 'Sandbox zatím není nastaven (chybí GitHub App, viz docs/SANDBOX.md).'}
            </Text>
            {!!code && (
              <>
                <Text style={s.code} selectable onPress={() => { void Clipboard.setStringAsync(code); setMsg('Kód zkopírován.'); }}>{code}</Text>
                <Text style={s.hint}>Klepnutím kód zkopíruješ. Zadej ho na github.com/login/device a potvrď.</Text>
              </>
            )}
            <Chunky title={busy ? 'Čekám na GitHub…' : 'Přihlásit přes GitHub'} disabled={busy || !CLIENT_ID} onPress={() => void login()} style={{ marginTop: 10 }} />
            {busy && <Chunky title="Zrušit" onPress={() => { attempt.current++; }} color={c.disabled} shade={c.disabledDark} textColor={c.text} style={{ marginTop: 10 }} />}
          </>
        )}
        {!!msg && <Text style={[s.hint, { marginTop: 8 }]}>{msg}</Text>}
      </View>
    </View>
  );
}

const makeS = (c: Palette) =>
  StyleSheet.create({
    section: { color: c.faint, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', marginTop: 22, marginBottom: 8 },
    box: { borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, borderRadius: 16, padding: 14, backgroundColor: c.bg },
    title: { color: c.text, fontSize: 16, fontWeight: '800' },
    hint: { color: c.dim, fontSize: 12, fontWeight: '600', marginTop: 4 },
    code: { color: c.blue, fontSize: 32, fontWeight: '800', textAlign: 'center', letterSpacing: 3, marginTop: 10 },
  });
