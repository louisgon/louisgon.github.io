type Moon = [size: number, radius: number, period: number, colour: string];

export const MOONS: Moon[][] = [[], [], [[0.13, 1.32, 22, '#cfcfd2']], [[0.05, 0.98, 7, '#9a8a7a'], [0.04, 1.2, 12, '#b8a898']], [[0.06, 1, 7, '#e6cf6a'], [0.055, 1.16, 10, '#d9cdb8'], [0.075, 1.34, 15, '#a99f95'], [0.07, 1.56, 23, '#7b7167']], [[0.04, 1.08, 8, '#dadada'], [0.045, 1.2, 11, '#cfcac4'], [0.05, 1.33, 14, '#c9c4bd'], [0.08, 1.52, 20, '#d8a656'], [0.05, 1.75, 30, '#8a7f73']], [[0.035, 0.98, 6, '#bdbdbd'], [0.045, 1.1, 9, '#c8c8c8'], [0.045, 1.22, 12, '#8d8d8d'], [0.055, 1.38, 16, '#c2b8ad'], [0.055, 1.55, 21, '#a99d92']], [[0.07, 1.3, 16, '#d6cfc8']]];
export const TILT = [-14, -14, -14, -14, -14, -14, 82, -14];
export const SQUASH = 0.3;

export const REACH = MOONS.map((ms, i) => { const t = (TILT[i] * Math.PI) / 180, c = Math.cos(t) ** 2, s = Math.sin(t) ** 2, q = SQUASH ** 2;
  return ms.reduce(([x, y], [sz, rr]) => [Math.max(x, (rr / 2) * Math.sqrt(c + q * s) + sz / 2), Math.max(y, (rr / 2) * Math.sqrt(s + q * c) + sz / 2)], [0.5, 0.5]).map((v) => +v.toFixed(3)); });

export const moonsHTML = (i: number) => (MOONS[i] || []).map(([sz, , , c]) => `<i class="moon" style="width:${sz * 100}%;height:${sz * 100}%;background:radial-gradient(circle at 35% 30%, ${c}, #1b1e26 78%)"></i>`).join('');
