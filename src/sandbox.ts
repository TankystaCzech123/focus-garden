// Developer sandbox: GitHub sign-in (device flow) and upload of a report to the private data repo.
// No React / native imports so it can be unit-tested with plain node.

export const DATA_REPO = 'TankystaCzech123/focus-garden-devdata';
/** Public client ID of the GitHub App (not a secret). Empty until the app is registered, see docs/SANDBOX.md. */
export const CLIENT_ID = 'Iv23liULW1FNcKbmankc';

const HOSTS = ['github.com', 'api.github.com'];
/** Throws unless the URL is https and on the GitHub allowlist. */
export function assertAllowed(url: string) {
  const m = /^https:\/\/([^/:?#]+)(?:[/:?#]|$)/.exec(url);
  if (!m || !HOSTS.includes(m[1])) throw new Error('Nepovolená adresa');
}

type Json = Record<string, unknown>;
async function post(url: string, body: Json, fetchFn: typeof fetch): Promise<Json> {
  assertAllowed(url);
  const res = await fetchFn(url, {
    method: 'POST',
    redirect: 'error',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub odpověděl ${res.status}`);
  return (await res.json()) as Json;
}

// ---- sign-in (device flow) -----------------------------------------------------

export type DeviceCode = { deviceCode: string; userCode: string; verificationUri: string; interval: number; expiresIn: number };

export async function startDeviceFlow(clientId = CLIENT_ID, fetchFn: typeof fetch = fetch): Promise<DeviceCode> {
  if (!clientId) throw new Error('Sandbox není nastaven (chybí Client ID)');
  const r = await post('https://github.com/login/device/code', { client_id: clientId }, fetchFn);
  if (typeof r.device_code !== 'string' || typeof r.user_code !== 'string') throw new Error('Neplatná odpověď GitHubu');
  return {
    deviceCode: r.device_code,
    userCode: r.user_code,
    verificationUri: 'https://github.com/login/device', // fixed, never taken from the response
    interval: Number(r.interval) || 5,
    expiresIn: Number(r.expires_in) || 900,
  };
}

export type PollResult = { status: 'token'; token: string } | { status: 'pending'; wait: number } | { status: 'failed'; error: string };

/** One poll step; the caller waits `wait` seconds between steps. */
export async function pollOnce(dc: DeviceCode, interval: number, clientId = CLIENT_ID, fetchFn: typeof fetch = fetch): Promise<PollResult> {
  const r = await post(
    'https://github.com/login/oauth/access_token',
    { client_id: clientId, device_code: dc.deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' },
    fetchFn,
  );
  if (typeof r.access_token === 'string') return { status: 'token', token: r.access_token };
  const err = String(r.error ?? 'unknown');
  if (err === 'authorization_pending') return { status: 'pending', wait: interval };
  if (err === 'slow_down') return { status: 'pending', wait: interval + 5 };
  return { status: 'failed', error: err === 'expired_token' ? 'Kód vypršel' : err === 'access_denied' ? 'Přihlášení zamítnuto' : err };
}

// ---- access check ----------------------------------------------------------------

export type Access = { login: string; canPush: boolean; reason?: string };

async function api(path: string, token: string, init: RequestInit, fetchFn: typeof fetch) {
  const url = `https://api.github.com${path}`;
  assertAllowed(url);
  return fetchFn(url, {
    ...init,
    redirect: 'error',
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, ...(init.headers as Json) },
  });
}

/** Signed-in login and whether this account may write to the data repo (owner or collaborator). */
export async function checkAccess(token: string, fetchFn: typeof fetch = fetch): Promise<Access> {
  const u = await api('/user', token, {}, fetchFn);
  if (u.status === 401) throw new Error('unauthorized');
  if (!u.ok) throw new Error(`GitHub odpověděl ${u.status}`);
  const login = String(((await u.json()) as Json).login ?? '');
  const r = await api(`/repos/${DATA_REPO}`, token, {}, fetchFn);
  if (r.status === 404) return { login, canPush: false, reason: 'repo není pro tento účet viditelné: GitHub App není nainstalovaná na datovém repu, nebo k němu nemáš přístup (404)' };
  if (r.status === 403) return { login, canPush: false, reason: 'GitHub odepřel přístup (403)' };
  if (!r.ok) throw new Error(`GitHub odpověděl ${r.status}`);
  // GitHub may omit `permissions` for app tokens: then the real write check happens on upload.
  const perms = ((await r.json()) as { permissions?: { push?: boolean } }).permissions;
  if (perms && perms.push === false) return { login, canPush: false, reason: 'účet má jen právo číst, ne zapisovat' };
  return { login, canPush: true };
}

// ---- report ----------------------------------------------------------------------

export type ReportInput = {
  version: string;
  device: { model: string; android: string };
  devLog: string;
  stats: { days: Record<string, number>; frozen: Record<string, true>; sessions: number; bestSession: number };
  game: { coins: number; cubes: number; plots: ({ id: string; grown: number } | null)[] };
  settings: { mode: string; dnd: boolean; autoUpdate: boolean };
};

/** Report content. Built field by field so tokens, nickname and other extras can never slip in. */
export function buildReport(i: ReportInput, now: number) {
  return {
    schema: 1,
    createdAt: new Date(now).toISOString(),
    app: { version: i.version },
    device: { model: i.device.model, android: i.device.android },
    devLog: i.devLog,
    stats: { days: i.stats.days, frozen: i.stats.frozen, sessions: i.stats.sessions, bestSession: i.stats.bestSession },
    game: { coins: i.game.coins, cubes: i.game.cubes, plots: i.game.plots.map((p) => (p ? { id: p.id, grown: p.grown } : null)) },
    settings: { mode: i.settings.mode, dnd: i.settings.dnd, autoUpdate: i.settings.autoUpdate },
  };
}

/** inbox/<login>/<YYYY-MM-DD>/<HHmmss>.json (UTC). */
export function reportPath(login: string, now: number): string {
  const safe = login.replace(/[^A-Za-z0-9-]/g, '') || 'unknown';
  const iso = new Date(now).toISOString(); // 2026-01-02T03:04:05.000Z
  return `inbox/${safe}/${iso.slice(0, 10)}/${iso.slice(11, 19).replace(/:/g, '')}.json`;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/** UTF-8 aware base64 (works without btoa / Buffer). */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? B64[n & 63] : '=';
  }
  return out;
}

export async function uploadReport(token: string, path: string, report: unknown, fetchFn: typeof fetch = fetch) {
  const res = await api(
    `/repos/${DATA_REPO}/contents/${path}`,
    token,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `chore: sandbox report ${path}`, content: toBase64(JSON.stringify(report, null, 2)) }),
    },
    fetchFn,
  );
  if (res.status === 401) throw new Error('unauthorized');
  if (res.status === 403 || res.status === 404) throw new Error('Nemáš právo zapisovat do sandboxu');
  if (!res.ok) throw new Error(`GitHub odpověděl ${res.status}`);
}
