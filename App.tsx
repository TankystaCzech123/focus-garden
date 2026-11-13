import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Focus, { AppInfo } from './modules/focus-native/src';
import Celebrate, { Reward } from './src/Celebrate';
import Chunky from './src/Chunky';
import { getOffsetDays, now as clockNow, setOffsetDays } from './src/clock';
import DevSection from './src/DevSection';
import { addCoins, addCubes, addMinutes, addXp, clearGarden, giveAllSeeds, growAll, setStreak, unlockAllCosmetics } from './src/dev';
import { buyCosmetic, equip } from './src/cosmetics';
import ShopScreen, { Section } from './src/ShopScreen';
import DevLogScreen from './src/DevLogScreen';
import FocusScreen from './src/FocusScreen';
import GardenScreen from './src/GardenScreen';
import ProfileScreen from './src/ProfileScreen';
import SettingsScreen, { UpdateState } from './src/SettingsScreen';
import SetupScreen from './src/SetupScreen';
import TabBar, { Tab } from './src/TabBar';
import {
  Game, Stats, applyFreezes, buyPlots, buySeed, collectPassive, emptyGame, migrateGame, emptyStats, focusCoins, growPlots, plantSeed, rewardForStreak, streak,
  todayMinutes, weekDays,
} from './src/rules';
import {
  Dev, Settings, dndAsked, endSession, loadAllowed, loadGame, loadSettings, loadStats, saveAllowed, saveGame, saveSettings,
  saveStats, setDndAsked, startSession, loadDev, saveDev, devBackup,
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
  const [settings, setSettings] = useState<Settings>({ mode: 'system', dnd: true, autoUpdate: true, notified: '', nickname: 'Zahradník' });
  const [dev, setDev] = useState<Dev>({ unlocked: false, offsetDays: 0 });
  const [backupAt, setBackupAt] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [shopSection, setShopSection] = useState<Section>('seeds');
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

  /** Ice cubes save the streak for missed days (runs on app start and after a developer time shift). */
  const settleFreezes = async (st: Stats, g: Game) => {
    const f = applyFreezes(st, g.cubes, clockNow());
    if (f.used > 0) {
      st = await saveStats(f.stats);
      g = await saveGame({ ...g, cubes: f.cubes });
      Alert.alert('❄️ Ledová kostka', `Zachránila tvoji sérii (${f.used} ${f.used === 1 ? 'den' : 'dny/dní'}).`);
    }
    // The garden pays its daily bonus (fully grown plants), even for days the app was not opened.
    const col = collectPassive(g, clockNow());
    if (col.game !== g) g = await saveGame(col.game);
    if (col.gained.xp > 0) st = await saveStats({ ...st, passiveXp: (st.passiveXp ?? 0) + col.gained.xp });
    const gn = col.gained;
    if (gn.coins || gn.xp || gn.cubes) {
      Alert.alert('🌿 Zahrada vydělala', [gn.coins ? `+${gn.coins} 🪙` : '', gn.xp ? `+${gn.xp} XP` : '', gn.cubes ? `+${gn.cubes} ❄️` : ''].filter(Boolean).join('   ') + ` (za ${gn.days} ${gn.days === 1 ? 'den' : 'dní'})`);
    }
    return { st, g };
  };

  /**
   * After a focus session: coins for the minutes, the plants grow by the minutes, and on the first completed focus
   * of the day the streak reward (coins, ice cubes) and the celebration.
   */
  const finishFocus = async (after: Stats, t: number, before: number, minutes: number, first: boolean) => {
    const cur = await loadGame(); // fresh copy, not the render closure
    const sessionCoins = focusCoins(before, before + minutes);
    const n = streak(after, t);
    const r = first ? rewardForStreak(n) : { coins: 0, cubes: 0 };
    const g = await saveGame({
      ...cur,
      coins: cur.coins + sessionCoins + r.coins,
      cubes: cur.cubes + r.cubes,
      plots: growPlots(cur.plots, minutes),
    });
    setGame(g);
    if (first) setReward({ streak: n, coins: r.coins + sessionCoins, cubes: r.cubes });
    else Alert.alert('Focus hotový ✅', `+${minutes} min focusu${sessionCoins ? ` · +${sessionCoins} 🪙` : ''}. Rostliny rostou.`);
  };

  useEffect(() => {
    run(async () => {
      const d = await loadDev();
      setOffsetDays(d.offsetDays);
      setDev(d);
      setSettings(await loadSettings());
      setAllowed(await loadAllowed());
      if (!Focus.needsPicker()) setApps(await Focus.getInstalledApps());

      // Focus may still be on from before the app was closed.
      const isOn = Focus.isActive();
      setActive(isOn);
      let st = await loadStats();
      if (!isOn && st.startedAt) st = await endSession(clockNow(), false);

      const settled = await settleFreezes(st, await loadGame());
      setStats(settled.st);
      setGame(settled.g);
      if (d.unlocked) setBackupAt((await devBackup.ensure(settled.st, settled.g, clockNow())).savedAt);
      else await devBackup.clear(); // locked = the working data is the real data; a leftover backup would be stale
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
        const t = clockNow();
        const before = todayMinutes(await loadStats(), t); // fresh from storage
        const after = await endSession(t);
        setStats(after);
        setActive(false);
        const minutes = todayMinutes(after, t) - before;
        if (minutes > 0) await finishFocus(after, t, before, minutes, before === 0);
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
      setStats(await startSession(clockNow()));
      setActive(true);
    });

  // ---- developer mode ----
  const devStats = (fn: (s: Stats) => Stats) => run(async () => setStats(await saveStats(fn(stats))));
  const devGame = (fn: (g: Game) => Game) => run(async () => setGame(await saveGame(fn(game))));
  const devShift = (days: number | 'reset') =>
    run(async () => {
      if (active) return Alert.alert('Focus běží', 'Čas jde posunout, až focus skončí.');
      const next: Dev = { ...dev, offsetDays: days === 'reset' ? 0 : getOffsetDays() + days };
      setOffsetDays(next.offsetDays);
      await saveDev(next);
      setDev(next);
      const settled = await settleFreezes(await loadStats(), await loadGame()); // fresh copies, not the render closure
      setStats(settled.st);
      setGame(settled.g);
    });
  const devUnlock = () =>
    run(async () => {
      // Real data is saved aside first; everything in developer mode only touches the working copy.
      const b = await devBackup.ensure(stats, game, clockNow());
      setBackupAt(b.savedAt);
      const n = { ...dev, unlocked: true };
      await saveDev(n);
      setDev(n);
    });
  /** Puts the saved real data back (and resets the time shift). `leave` also locks developer mode. */
  const devRestore = async (leave: boolean) => {
    if (active) return Alert.alert('Focus běží', 'Původní data jdou vrátit, až focus skončí.');
    const b = await devBackup.load();
    if (!b) return Alert.alert('Žádná záloha', 'Záloha skutečných dat nebyla nalezena, nic se nezměnilo.');
    setStats(await saveStats(b.stats));
    setGame(await saveGame(migrateGame(b.game))); // the backup may come from an older app version
    setOffsetDays(0);
    const n: Dev = { unlocked: !leave, offsetDays: 0 };
    await saveDev(n);
    setDev(n);
    if (leave) { await devBackup.clear(); setBackupAt(null); }
  };
  const devLock = () =>
    Alert.alert('Zamknout vývojářský režim', 'Doporučeno: vrátit původní data. „Ponechat testovací“ nenávratně smaže tvoje skutečná data a zůstanou jen ta testovací.', [
      { text: 'Zrušit', style: 'cancel' },
      {
        text: 'Ponechat testovací',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Opravdu smazat skutečná data?', 'Záloha tvých skutečných dat se smaže a nepůjde vrátit.', [
            { text: 'Zrušit', style: 'cancel' },
            {
              text: 'Smazat zálohu',
              style: 'destructive',
              onPress: () => run(async () => {
                await devBackup.clear();
                setBackupAt(null);
                setOffsetDays(0);
                const n: Dev = { unlocked: false, offsetDays: 0 };
                await saveDev(n);
                setDev(n);
              }),
            },
          ]),
      },
      { text: 'Vrátit původní data', onPress: () => run(() => devRestore(true)) },
    ]);
  const devRestoreKeepOpen = () =>
    Alert.alert('Vrátit původní data?', 'Testovací změny se zahodí, vývojářský režim zůstane zapnutý.', [
      { text: 'Zrušit', style: 'cancel' },
      { text: 'Vrátit', onPress: () => run(() => devRestore(false)) },
    ]);
  const devCompleteToday = () =>
    run(async () => {
      const t = clockNow();
      if (todayMinutes(stats, t) > 0) return Alert.alert('Dnešek už je splněný');
      const after = await saveStats(addMinutes(stats, t, 1));
      setStats(after);
      await finishFocus(after, t, 0, 1, true);
    });
  const devReset = () =>
    Alert.alert('Resetovat testovací data?', 'Smaže testovací statistiky, mince, kostky i zahrádku. Tvoje skutečná data jsou uložená stranou a zůstanou.', [
      { text: 'Zrušit', style: 'cancel' },
      { text: 'Resetovat', style: 'destructive', onPress: () => run(async () => { setStats(await saveStats(emptyStats())); setGame(await saveGame(emptyGame())); }) },
    ]);

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

    const now = clockNow();
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
              onShop={() => setTab('shop')}
              onPlant={(i, id) => {
                const g = plantSeed(game, i, id);
                if (g) run(async () => setGame(await saveGame(g)));
              }}
            />
          )}
          {tab === 'shop' && (
            <ShopScreen
              game={game}
              section={shopSection}
              onSection={setShopSection}
              onBuySeed={(id) => { const g = buySeed(game, id); if (g) run(async () => setGame(await saveGame(g))); }}
              onBuyCosmetic={(slot, id) => { const g = buyCosmetic(game, slot, id); if (g) run(async () => setGame(await saveGame(g))); }}
              onEquip={(slot, id) => { const g = equip(game, slot, id); if (g) run(async () => setGame(await saveGame(g))); }}
              onBuyPlots={() => { const g = buyPlots(game); if (g) run(async () => setGame(await saveGame(g))); }}
            />
          )}
          {tab === 'profile' && (
            <ProfileScreen
              stats={stats}
              game={game}
              nickname={settings.nickname}
              onNickname={(nickname) => changeSettings({ ...settings, nickname })}
              onCustomize={() => { setShopSection('avatar'); setTab('shop'); }}
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
              devSlot={
                <DevSection
                  unlocked={dev.unlocked}
                  offsetDays={dev.offsetDays}
                  today={new Date(now).toLocaleDateString('cs-CZ')}
                  backupAt={backupAt}
                  onRestore={devRestoreKeepOpen}
                  onUnlock={devUnlock}
                  onLock={devLock}
                  onShift={devShift}
                  coins={(d) => devGame((g) => addCoins(g, d))}
                  cubes={(d) => devGame((g) => addCubes(g, d))}
                  minutes={(d) => devStats((s) => addMinutes(s, now, d))}
                  xp={(d) => devStats((s) => addXp(s, d))}
                  streak={(n) => devStats((s) => setStreak(s, n, now))}
                  completeToday={devCompleteToday}
                  growAll={() => devGame(growAll)}
                  giveSeeds={() => devGame(giveAllSeeds)}
                  unlockAll={() => devGame(unlockAllCosmetics)}
                  clearGarden={() => devGame(clearGarden)}
                  celebrate={() => setReward({ streak: streak(stats, now), coins: 5, cubes: 0 })}
                  resetAll={devReset}
                />
              }
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
