import sharp from 'sharp';

export async function pixelDiff(a: string, b: string, out: string) {
  const [A, B] = await Promise.all([a, b].map((f) => sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return { changed: -1, max: 255 };
  const diff = Buffer.alloc(A.data.length);
  let changed = 0, max = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
    const g = A.data[i] * 0.1;
    if (d > 2) { changed++; diff.set([255, 40, 90, 255], i); } else diff.set([g, g, g, 255], i);
    if (d > max) max = d;
  }
  if (changed) await sharp(diff, { raw: { width: A.info.width, height: A.info.height, channels: 4 } }).png().toFile(out);
  return { changed, max };
}
