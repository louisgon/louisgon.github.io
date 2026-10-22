export const NAV = [
  ['intro', 'Log'],
  ['stack', 'Stack'],
  ['work', 'Work'],
  ['pilot', 'About'],
  ['contact', 'Contact'],
] as const;

export const nn = (n: number) => String(n).padStart(2, '0');
