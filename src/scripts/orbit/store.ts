export const store = {
  get: (k: string, d = 0) => { try { return +(localStorage.getItem(k) ?? '') || d; } catch { return d; } },
  set: (k: string, v: number) => { try { localStorage.setItem(k, String(v)); } catch {} },
};

export const P = { best: store.get('lg01-best'), xp: store.get('lg01-xp') };
export const RANKS = [0, 6000, 15000, 30000, 50000];
export const rankOf = (x: number) => RANKS.filter((r) => x >= r).length;
export const played = () => store.get('lg01-played') > 0;
