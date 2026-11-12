import { createContext, useContext, useMemo } from 'react';

const base = {
  green: '#58CC02', // Feather Green
  greenDark: '#58A700',
  blue: '#1CB0F6', // Macaw
  blueDark: '#1899D6',
  red: '#FF4B4B', // Cardinal
  redDark: '#EA2B2B',
  yellow: '#FFC800', // Bee
  orange: '#FF9600', // Fox
  ice: '#84D8FF',
};

/** Duolingo-like palettes. The dark one is an approximation, not taken from brand guidelines. */
export const light = {
  ...base,
  bg: '#FFFFFF', // Snow
  card: '#F7F7F7', // Polar
  border: '#E5E5E5', // Swan
  text: '#4B4B4B', // Eel
  dim: '#777777', // Wolf
  faint: '#AFAFAF', // Hare
  blueSoft: '#DDF4FF',
  disabled: '#E5E5E5',
  disabledDark: '#CFCFCF',
};
export const dark: typeof light = {
  ...base,
  bg: '#131F24',
  card: '#1F2C34',
  border: '#37464F',
  text: '#E5EDF1',
  dim: '#9FB2BC',
  faint: '#5E727C',
  blueSoft: '#1B3A4B',
  disabled: '#37464F',
  disabledDark: '#2B3A42',
};

export type Palette = typeof light;
const Ctx = createContext<Palette>(light);
export const ThemeProvider = Ctx.Provider;
export const useTheme = () => useContext(Ctx);

/** Builds styles from the current palette (re-created only when the theme changes). */
export function useStyles<T>(make: (c: Palette) => T): T {
  const c = useTheme();
  return useMemo(() => make(c), [c]); // eslint-disable-line react-hooks/exhaustive-deps
}
