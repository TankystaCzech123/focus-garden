// Shop cosmetics for the profile: avatar, hat, face item, frame, card colour and profile background. Pure data + rules.
import type { Game } from './garden.ts';

export type Slot = 'avatar' | 'hat' | 'face' | 'frame' | 'card' | 'bg';
export type Look = Record<Slot, string>;
export type Cosmetic = {
  id: string;
  slot: Slot;
  name: string;
  price: number; // 0 = free, always owned
  emoji?: string; // avatar / hat / face
  colors?: string[]; // frame: 1 colour or 4 (top, right, bottom, left)
  card?: { bg: string; fg: string }; // card colour
  bg?: { light: string; dark: string }; // profile background per theme
};

export const COSMETICS: Cosmetic[] = [
  // avatars
  { id: 'smile', slot: 'avatar', name: 'Úsměv', price: 0, emoji: '🙂' },
  { id: 'farmer', slot: 'avatar', name: 'Zahradník', price: 150, emoji: '🧑‍🌾' },
  { id: 'fox', slot: 'avatar', name: 'Liška', price: 200, emoji: '🦊' },
  { id: 'panda', slot: 'avatar', name: 'Panda', price: 250, emoji: '🐼' },
  { id: 'frog', slot: 'avatar', name: 'Žába', price: 250, emoji: '🐸' },
  { id: 'owl', slot: 'avatar', name: 'Sova', price: 300, emoji: '🦉' },
  { id: 'dragon', slot: 'avatar', name: 'Drak', price: 1200, emoji: '🐉' },
  // hats
  { id: 'none', slot: 'hat', name: 'Bez čepice', price: 0, emoji: '' },
  { id: 'cap', slot: 'hat', name: 'Kšiltovka', price: 100, emoji: '🧢' },
  { id: 'straw', slot: 'hat', name: 'Slaměný klobouk', price: 150, emoji: '👒' },
  { id: 'tophat', slot: 'hat', name: 'Cylindr', price: 300, emoji: '🎩' },
  { id: 'crown', slot: 'hat', name: 'Koruna', price: 1000, emoji: '👑' },
  // face items
  { id: 'none', slot: 'face', name: 'Bez doplňku', price: 0, emoji: '' },
  { id: 'shades', slot: 'face', name: 'Sluneční brýle', price: 120, emoji: '🕶️' },
  { id: 'goggles', slot: 'face', name: 'Potápěčské brýle', price: 200, emoji: '🥽' },
  { id: 'phones', slot: 'face', name: 'Sluchátka', price: 250, emoji: '🎧' },
  // frames
  { id: 'green', slot: 'frame', name: 'Zelený', price: 0, colors: ['#58CC02'] },
  { id: 'blue', slot: 'frame', name: 'Modrý', price: 100, colors: ['#1CB0F6'] },
  { id: 'red', slot: 'frame', name: 'Červený', price: 100, colors: ['#FF4B4B'] },
  { id: 'purple', slot: 'frame', name: 'Fialový', price: 300, colors: ['#A560E8'] },
  { id: 'gold', slot: 'frame', name: 'Zlatý', price: 400, colors: ['#FFC800'] },
  { id: 'rainbow', slot: 'frame', name: 'Duhový', price: 800, colors: ['#FF4B4B', '#FFC800', '#58CC02', '#1CB0F6'] },
  // card colours (id 'theme' follows the app theme)
  { id: 'theme', slot: 'card', name: 'Podle tématu', price: 0 },
  { id: 'mint', slot: 'card', name: 'Máta', price: 120, card: { bg: '#DFF7C9', fg: '#2E5A12' } },
  { id: 'sky', slot: 'card', name: 'Obloha', price: 120, card: { bg: '#DDF4FF', fg: '#0B4C6B' } },
  { id: 'peach', slot: 'card', name: 'Broskev', price: 120, card: { bg: '#FFE3D1', fg: '#7A3B12' } },
  { id: 'lavender', slot: 'card', name: 'Levandule', price: 200, card: { bg: '#EBDDFF', fg: '#4B2A7A' } },
  { id: 'night', slot: 'card', name: 'Noc', price: 350, card: { bg: '#1F2A44', fg: '#E8EEFF' } },
  { id: 'goldcard', slot: 'card', name: 'Zlato', price: 500, card: { bg: '#FFE27A', fg: '#5A4300' } },
  // profile backgrounds (id 'plain' follows the app theme)
  { id: 'plain', slot: 'bg', name: 'Základní', price: 0 },
  { id: 'bgmint', slot: 'bg', name: 'Máta', price: 100, bg: { light: '#F1FBE6', dark: '#16240F' } },
  { id: 'bgsky', slot: 'bg', name: 'Obloha', price: 100, bg: { light: '#EAF8FF', dark: '#0F222C' } },
  { id: 'bgpeach', slot: 'bg', name: 'Broskev', price: 150, bg: { light: '#FFF4EC', dark: '#2B1C13' } },
  { id: 'bglilac', slot: 'bg', name: 'Šeřík', price: 150, bg: { light: '#F6EFFF', dark: '#201830' } },
  { id: 'bgdusk', slot: 'bg', name: 'Soumrak', price: 250, bg: { light: '#FFE9E0', dark: '#2A1A2E' } },
];

export const SLOT_NAMES: Record<Slot, string> = { avatar: 'Avatar', hat: 'Čepice', face: 'Doplněk', frame: 'Rámeček', card: 'Karta', bg: 'Pozadí' };
export const DEFAULT_LOOK: Look = { avatar: 'smile', hat: 'none', face: 'none', frame: 'green', card: 'theme', bg: 'plain' };

export const cosmeticOf = (slot: Slot, id: string) => COSMETICS.find((c) => c.slot === slot && c.id === id);
const key = (slot: Slot, id: string) => `${slot}:${id}`;

/** Owned = free items plus everything bought (stored as "slot:id"). */
export const isOwned = (g: Game, c: Cosmetic) => c.price === 0 || g.owned.includes(key(c.slot, c.id));

export function buyCosmetic(g: Game, slot: Slot, id: string): Game | null {
  const c = cosmeticOf(slot, id);
  if (!c || isOwned(g, c) || g.coins < c.price) return null;
  return { ...g, coins: g.coins - c.price, owned: [...g.owned, key(slot, id)] };
}

export function equip(g: Game, slot: Slot, id: string): Game | null {
  const c = cosmeticOf(slot, id);
  if (!c || !isOwned(g, c)) return null;
  return { ...g, look: { ...g.look, [slot]: id } };
}

/** Resolved look for rendering (unknown ids fall back to defaults). */
export function resolveLook(look: Look) {
  const pick = (slot: Slot) => cosmeticOf(slot, look[slot]) ?? cosmeticOf(slot, DEFAULT_LOOK[slot])!;
  return { avatar: pick('avatar'), hat: pick('hat'), face: pick('face'), frame: pick('frame'), card: pick('card'), bg: pick('bg') };
}
