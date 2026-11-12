// GitHub update check. No React / native imports so it can be unit-tested with plain node.

export const REPO = 'TankystaCzech123/focus-garden';
const DOWNLOAD_PREFIX = `https://github.com/${REPO}/releases/download/`;

export type Release = {
  tag_name: string;
  body?: string | null;
  assets?: { name: string; browser_download_url: string }[];
};
export type UpdateInfo = { version: string; url: string; notes: string };
export type CheckResult =
  | { status: 'update'; info: UpdateInfo }
  | { status: 'current' }
  | { status: 'none' }; // repository has no release yet

const parse = (v: string) =>
  v.replace(/^v/, '').split(/[-+]/)[0].split('.').map((n) => parseInt(n, 10) || 0);

/** True when `latest` is a higher x.y.z than `current` ("v" prefix and pre-release suffix ignored). */
export function isNewer(latest: string, current: string): boolean {
  const a = parse(latest);
  const b = parse(current);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return false;
}

/** The APK asset of a release, only accepted from this repository's release downloads. */
export function pickApk(release: Release): string | null {
  const apks = (release.assets ?? []).filter(
    (a) => a.name.endsWith('.apk') && a.browser_download_url.startsWith(DOWNLOAD_PREFIX),
  );
  return (apks.find((a) => a.name.includes('arm64')) ?? apks[0])?.browser_download_url ?? null;
}

export async function checkForUpdate(current: string, fetchFn: typeof fetch = fetch): Promise<CheckResult> {
  const res = await fetchFn(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (res.status === 404) return { status: 'none' };
  if (!res.ok) throw new Error(`GitHub odpověděl ${res.status}`);
  const release = (await res.json()) as Release;
  const url = pickApk(release);
  if (!url || !isNewer(release.tag_name, current)) return { status: 'current' };
  return {
    status: 'update',
    info: { version: release.tag_name.replace(/^v/, ''), url, notes: (release.body ?? '').trim() },
  };
}
