// Day helpers shared by rules and garden (no other imports, avoids an import cycle).

export const dayKey = (t: number) => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
/** Noon of the day `offset` days from `now` (noon avoids DST edge cases). */
export const dayAt = (now: number, offset: number) => {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset, 12).getTime();
};
