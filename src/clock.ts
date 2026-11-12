// App clock. Real time unless developer mode shifts it by whole days (to test streaks, ice cubes, garden growth).

/** `t` moved by `days` calendar days (DST-safe). */
export const shiftDays = (t: number, days: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

let offset = 0;
export const getOffsetDays = () => offset;
export const setOffsetDays = (days: number) => { offset = Math.trunc(days) || 0; };
export const now = () => (offset ? shiftDays(Date.now(), offset) : Date.now());
