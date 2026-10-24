export const store = {
  get: (k: string, d = 0) => { try { return +(localStorage.getItem(k) ?? '') || d; } catch { return d; } },
  set: (k: string, v: number | string) => { try { localStorage.setItem(k, String(v)); } catch {} },
};

export const P = { best: store.get('lg01-top-best') };
export const played = () => store.get('lg01-played') > 0;
