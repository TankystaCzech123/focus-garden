import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Focus, { AppInfo } from './modules/focus-native/src';
import Celebrate, { Reward } from './src/Celebrate';
import Chunky from './src/Chunky';
import DevLogScreen from './src/DevLogScreen';
import FocusScreen from './src/FocusScreen';
import GardenScreen from './src/GardenScreen';
import SettingsScreen, { UpdateState } from './src/SettingsScreen';
import SetupScreen from './src/SetupScreen';
import TabBar, { Tab } from './src/TabBar';
import {
  Game, Stats, applyFreezes, emptyGame, emptyStats, growPlots, plantItem, rewardForStreak, streak, todayMinutes, weekDays,
} from './src/rules';
import {
  Settings, dndAsked, endSession, loadAllowed, loadGame, loadSettings, loadStats, saveAllowed, saveGame, saveSettings,
  saveStats, setDndAsked, startSession,
} from './src/storage';
import { ThemeProvider, dark, light } from './src/theme';
import { UpdateInfo, checkForUpdate } from './src/update';

const askDnd = () =>
  new Promise<'continue' | 'settings'>((resolve) =>
    Alert.alert(
      'Ztlumit oznámení?',
      'Ve focusu můžeme zapnout režim Nerušit, aby tě nic nerušilo. Android k tomu chce jednorázové povolení.',
      [
        { text: 'Bez ztlumení', onPress: () => resolve('continue') },
        { text: 'Povolit', onPress: () => resolve('settings') },
      ],
      { cancelable: false },
    ),
  );

export default function App() {
  const systemScheme = useColorScheme();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState<string[] | null>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [active, setActive] = useState(false);
  const [stats, setStats] = useState<Stats>(emptyStats());
  const [game, setGame] = useState<Game>(emptyGame());
  const [settings, setSettings] = useState<Settings>({ mode: 'system', dnd: true, autoUpdate: true, notified: '' });
  const [tab, setTab] = useState<Tab>('home');
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState('');
  const [reward, setReward] = useState<Reward | null>(null);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateState, setUpdateState] = useState<UpdateState>('idle');
  const [updateError, setUpdateError] = useState('');
  const version = Focus.getVersion();

  const run = (fn: () => Promise<unknown>) => fn().catch((e) => Alert.alert('Chyba', String(e)));
  const refreshLog = () => Focus.getDevLog().then(setLog).catch(() => setLog('(chyba čtení logu)'));
  const isDark = settings.mode === 'dark' || (settings.mode === 'system' && systemScheme === 'dark');

  useEffect(() => {
    run(async () => {
      setSettings(await loadSettings());
      setAllowed(await loadAllowed());
      if (!Focus.needsPicker()) setApps(await Focus.getInstalledApps());

      // Focus may still be on from before the app was closed.
      const isOn = Focus.isActive();
      setActive(isOn);
      let st = await loadStats();
      if (!isOn && st.startedAt) st = await endSession(Date.now(), false);

      // Ice cubes save the streak for missed days.
      let g = await loadGame();
      const f = applyFreezes(st, g.cubes, Date.now());
      if (f.used > 0) {
        st = await saveStats(f.stats);
        g = await saveGame({ ...g, cubes: f.cubes });
        Alert.alert('❄️ Ledová kostka', `Zachránila tvoji sérii (${f.used} ${f.used === 1 ? 'den' : 'dny/dní'}).`);
      }
      setStats(st);
      setGame(g);
      setReady(true);

      // Silent update check on start (Android only, can be turned off in Settings).
      const cfg = await loadSettings();
      if (Platform.OS === 'android' && cfg.autoUpdate) {
        const info = await runCheck(false);
        if (info && cfg.notified !== info.version) {
          const next = { ...cfg, notified: info.version };
          setSettings(next);
          await saveSettings(next);
          Alert.alert('Nová verze ' + info.version, 'Je dostupná nová verze aplikace. Chceš ji teď nainstalovat?', [
            { text: 'Později', style: 'cancel' },
            { text: 'Nainstalovat', onPress: () => { setTab('settings'); void installUpdate(info); } },
          ]);
        }
      }
    });
  }, []);

  /** Asks GitHub for the latest release. Returns the update if a newer version exists. */
  const runCheck = async (manual: boolean): Promise<UpdateInfo | null> => {
    if (manual) setUpdateState('checking');
    try {
      const r = await checkForUpdate(version);
      if (r.status === 'update') {
        setUpdate(r.info);
        setUpdateState('idle');
        return r.info;
      }
      setUpdate(null);
      if (manual) setUpdateState(r.status);
    } catch (e) {
      if (manual) { setUpdateError(String((e as Error).message ?? e)); setUpdateState('error'); }
    }
    return null;
  };

  const installUpdate = async (info: UpdateInfo | null = update) => {
    if (!info) return;
    setUpdateState('downloading');
    try {
      const r = await Focus.downloadAndInstall(info.url);
      if (r === 'needsPermission') {
        Alert.alert('Povol instalaci', 'Android potřebuje jednorázově povolit instalaci aplikací z Focus. Zapni přepínač, vrať se zpět a klepni znovu na Nainstalovat.');
      }
    } catch (e) {
      setUpdateError(String((e as Error).message ?? e));
      setUpdateState('error');
      return;
    }
    setUpdateState('idle');
  };

  const changeSettings = (s: Settings) => { setSettings(s); run(() => saveSettings(s)); };

  const toggleFocus = () =>
    run(async () => {
      if (active) {
        await Focus.stop();
        const t = Date.now();
        const wasDone = todayMinutes(stats, t) > 0;
        const after = await endSession(t);
        setStats(after);
        setActive(false);
        if (!wasDone && todayMinutes(after, t) > 0) {
          // first completed focus today: rewards + the garden grows a day
          const n = streak(after, t);
          const r = rewardForStreak(n);
          const g = await saveGame({ ...game, coins: game.coins + r.coins, cubes: game.cubes + r.cubes, plots: growPlots(game.plots) });
          setGame(g);
          setReward({ streak: n, ...r });
        }
        return;
      }
      if (settings.dnd && !Focus.dndGranted() && !(await dndAsked())) {
        await setDndAsked();
        if ((await askDnd()) === 'settings') {
          await Focus.openDndSettings();
          return; // user comes back and presses START again
        }
      }
      const r = await Focus.start(allowed ?? [], settings.dnd);
      if (r.needsAccessibility) {
        Alert.alert('Zapni službu Focus', 'V Usnadnění zapni službu „Focus“, vrať se sem a znovu stiskni START.');
        return;
      }
      setStats(await startSession(Date.now()));
      setActive(true);
    });

  const body = () => {
    if (!ready) return <View style={s.blank} />;

    if (showLog) {
      return (
        <DevLogScreen
          log={log}
          onRefresh={refreshLog}
          onClear={() => run(async () => { await Focus.clearDevLog(); setLog(''); })}
          onBack={() => setShowLog(false)}
        />
      );
    }

    // First launch: choose apps.
    if (!allowed) {
      if (Focus.needsPicker()) {
        return (
          <View style={s.center}>
            <Text style={[s.title, { color: isDark ? dark.text : light.text }]}>Co smíš používat ve focusu?</Text>
            <Text style={[s.sub, { color: isDark ? dark.dim : light.dim }]}>Vyber aplikace, které zůstanou dostupné. Ostatní se zablokují.</Text>
            <Chunky
              title="Vybrat aplikace"
              style={{ alignSelf: 'stretch', marginTop: 12 }}
              onPress={() =>
                run(async () => {
                  const n = await Focus.pickApps();
                  if (n) { await saveAllowed(['ios']); setAllowed(['ios']); }
                })
              }
            />
          </View>
        );
      }
      return <SetupScreen apps={apps} onSave={(ids) => run(async () => { await saveAllowed(ids); setAllowed(ids); })} />;
    }

    const now = Date.now();
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {tab === 'home' && (
            <FocusScreen
              active={active}
              tiles={apps.filter((a) => allowed.includes(a.id))}
              today={todayMinutes(stats, now)}
              streakDays={streak(stats, now)}
              cubes={game.cubes}
              coins={game.coins}
              week={weekDays(stats, now)}
              onToggle={toggleFocus}
              onLaunch={(id) => run(() => Focus.launchApp(id))}
              onChangeApps={() => run(async () => { await saveAllowed([]); setAllowed(null); })}
            />
          )}
          {tab === 'garden' && (
            <GardenScreen
              game={game}
              onPlant={(i, id) => {
                const g = plantItem(game, i, id);
                if (g) run(async () => setGame(await saveGame(g)));
              }}
            />
          )}
          {tab === 'settings' && (
            <SettingsScreen
              settings={settings}
              onChange={changeSettings}
              onDevLog={() => { refreshLog(); setShowLog(true); }}
              version={version}
              update={update}
              updateState={updateState}
              updateError={updateError}
              onCheckUpdate={() => { void runCheck(true); }}
              onInstallUpdate={() => { void installUpdate(); }}
            />
          )}
        </View>
        <TabBar tab={tab} onChange={setTab} badge={update ? 'settings' : undefined} />
      </View>
    );
  };

  return (
    <ThemeProvider value={isDark ? dark : light}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Celebrate reward={reward} onClose={() => setReward(null)} />
      {body()}
    </ThemeProvider>
  );
}

const s = StyleSheet.create({
  blank: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  sub: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
