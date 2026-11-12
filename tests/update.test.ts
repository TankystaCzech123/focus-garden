import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REPO, checkForUpdate, isNewer, pickApk } from '../src/update.ts';

const dl = (name: string) => `https://github.com/${REPO}/releases/download/v0.2.0/${name}`;
const release = { tag_name: 'v0.2.0', body: ' notes ', assets: [{ name: 'focus-garden-v0.2.0-arm64-v8a.apk', browser_download_url: dl('focus-garden-v0.2.0-arm64-v8a.apk') }] };
const fakeFetch = (status: number, body: unknown = {}) =>
  (async () => ({ status, ok: status >= 200 && status < 300, json: async () => body })) as unknown as typeof fetch;

test('isNewer compares x.y.z numerically', () => {
  assert.equal(isNewer('v0.2.0', '0.1.9'), true);
  assert.equal(isNewer('0.10.0', '0.9.0'), true);
  assert.equal(isNewer('1.0.0', '0.99.99'), true);
  assert.equal(isNewer('0.1.0', '0.1.0'), false);
  assert.equal(isNewer('0.1.0', '0.2.0'), false);
  assert.equal(isNewer('v0.2.0-beta.1', '0.1.0'), true);
});

test('pickApk prefers arm64 and rejects foreign download hosts', () => {
  assert.equal(pickApk(release), dl('focus-garden-v0.2.0-arm64-v8a.apk'));
  assert.equal(pickApk({ tag_name: 'v1', assets: [{ name: 'x.apk', browser_download_url: 'https://evil.example/x.apk' }] }), null);
  assert.equal(pickApk({ tag_name: 'v1' }), null);
});

test('checkForUpdate reports update, current, none and errors', async () => {
  const r = await checkForUpdate('0.1.0', fakeFetch(200, release));
  assert.equal(r.status, 'update');
  if (r.status === 'update') {
    assert.equal(r.info.version, '0.2.0');
    assert.equal(r.info.notes, 'notes');
  }
  assert.equal((await checkForUpdate('0.2.0', fakeFetch(200, release))).status, 'current');
  assert.equal((await checkForUpdate('0.1.0', fakeFetch(404))).status, 'none');
  await assert.rejects(checkForUpdate('0.1.0', fakeFetch(403)), /403/);
});
