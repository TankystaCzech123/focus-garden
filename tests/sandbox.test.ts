import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAllowed, buildReport, checkAccess, pollOnce, reportPath, startDeviceFlow, toBase64, uploadReport, DATA_REPO } from '../src/sandbox.ts';

const json = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });
const dc = { deviceCode: 'd', userCode: 'U', verificationUri: '', interval: 5, expiresIn: 900 };

test('host allowlist', () => {
  assertAllowed('https://api.github.com/user');
  assertAllowed('https://github.com/login/device/code');
  for (const u of ['http://github.com/x', 'https://evil.com/x', 'https://github.com.evil.com/x', 'https://api.github.com@evil.com/x', 'ftp://github.com'])
    assert.throws(() => assertAllowed(u), u);
});

test('report path is sanitised and UTC', () => {
  const t = Date.UTC(2026, 0, 2, 3, 4, 5);
  assert.equal(reportPath('Tank-ysta', t), 'inbox/Tank-ysta/2026-01-02/030405.json');
  assert.equal(reportPath('../../x y', t), 'inbox/x/2026-01-02/030405.json'.replace('/x/', '/xy/'));
  assert.equal(reportPath('', t), 'inbox/unknown/2026-01-02/030405.json');
});

test('report contains only whitelisted fields', () => {
  const r = buildReport(
    {
      version: '1.0.0',
      device: { model: 'M', android: '16' },
      devLog: 'log',
      stats: { days: { '2026-01-01': 5 }, frozen: {}, sessions: 1, bestSession: 5, startedAt: 123, token: 'x' } as never,
      game: { coins: 1, cubes: 2, plots: [{ id: 'tulip', grown: 1, owner: 'Leak' }, null], playerName: 'Leak2' } as never,
      settings: { mode: 'dark', dnd: true, autoUpdate: false, nickname: 'Secret', notified: '1' } as never,
    },
    0,
  );
  const s = JSON.stringify(r);
  assert.ok(!s.includes('Secret') && !s.includes('startedAt') && !s.includes('token') && !s.includes('notified'));
  assert.ok(!s.includes('Leak'));
  assert.deepEqual(r.game, { coins: 1, cubes: 2, plots: [{ id: 'tulip', grown: 1 }, null] });
  assert.equal(r.schema, 1);
  assert.equal(r.createdAt, '1970-01-01T00:00:00.000Z');
});

test('base64 handles unicode and padding', () => {
  for (const t of ['', 'a', 'ab', 'abc', 'Zahradník 🌱 ěščř'])
    assert.equal(toBase64(t), Buffer.from(t, 'utf8').toString('base64'), t);
});

test('device flow start needs client id and ignores response uri', async () => {
  await assert.rejects(() => startDeviceFlow('', json(200, {}) as never));
  const r = await startDeviceFlow('Iv1.x', json(200, { device_code: 'd', user_code: 'AB-12', verification_uri: 'https://evil.com', interval: 5, expires_in: 900 }) as never);
  assert.equal(r.verificationUri, 'https://github.com/login/device');
  assert.equal(r.userCode, 'AB-12');
});

test('poll states', async () => {
  assert.deepEqual(await pollOnce(dc, 5, 'id', json(200, { access_token: 'tok' }) as never), { status: 'token', token: 'tok' });
  assert.deepEqual(await pollOnce(dc, 5, 'id', json(200, { error: 'authorization_pending' }) as never), { status: 'pending', wait: 5 });
  assert.deepEqual(await pollOnce(dc, 5, 'id', json(200, { error: 'slow_down' }) as never), { status: 'pending', wait: 10 });
  const f = await pollOnce(dc, 5, 'id', json(200, { error: 'expired_token' }) as never);
  assert.equal(f.status, 'failed');
});

test('access: push rights unlock, others stay locked', async () => {
  const mk = (repo: { status: number; body: unknown }) => (async (url: string) =>
    url.endsWith('/user') ? new Response(JSON.stringify({ login: 'me' })) : new Response(JSON.stringify(repo.body), { status: repo.status })) as never;
  assert.deepEqual(await checkAccess('t', mk({ status: 200, body: { permissions: { push: true } } })), { login: 'me', canPush: true });
  assert.equal((await checkAccess('t', mk({ status: 200, body: { permissions: { push: false } } }))).canPush, false);
  assert.equal((await checkAccess('t', mk({ status: 404, body: {} }))).canPush, false);
  assert.match((await checkAccess('t', mk({ status: 404, body: {} }))).reason ?? '', /nainstalovaná/);
  // permissions omitted by GitHub: allowed, upload enforces the real write check
  assert.equal((await checkAccess('t', mk({ status: 200, body: { id: 1 } }))).canPush, true);
  await assert.rejects(() => checkAccess('t', json(401, {}) as never), /unauthorized/);
});

test('upload sends PUT to data repo with bearer token', async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const f = (async (url: string, init: RequestInit) => { seen = { url, init }; return new Response('{}', { status: 201 }); }) as never;
  await uploadReport('tok', 'inbox/me/a.json', { a: 1 }, f);
  assert.equal(seen!.url, `https://api.github.com/repos/${DATA_REPO}/contents/inbox/me/a.json`);
  assert.equal(seen!.init.method, 'PUT');
  assert.equal((seen!.init.headers as Record<string, string>).Authorization, 'Bearer tok');
  await assert.rejects(() => uploadReport('t', 'p', {}, json(404, {}) as never), /právo/);
  await assert.rejects(() => uploadReport('t', 'p', {}, json(401, {}) as never), /unauthorized/);
});
