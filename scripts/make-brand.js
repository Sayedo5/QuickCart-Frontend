// Generates brand assets from assets/QuickcatrtLogo.jpg using jimp (pure JS).
const path = require('path');
const { Jimp } = require('jimp');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'assets/QuickcatrtLogo.jpg');
const OUT = path.join(ROOT, 'assets');

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Turns the white JPEG background into real transparency, keeping anti-aliased edges. */
function knockoutWhite(img) {
  const SOFT = 90; // soft edge band below the hard white cutoff
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
    const d = img.bitmap.data;
    const r = d[idx], g = d[idx + 1], b = d[idx + 2];
    const mn = Math.min(r, g, b);
    if (mn >= 236) {
      d[idx + 3] = 0;
      return;
    }
    if (mn > 255 - SOFT) {
      const a = (255 - mn) / SOFT; // 0..1
      const un = (c) => clamp((c - 255 * (1 - a)) / a);
      d[idx] = un(r);
      d[idx + 1] = un(g);
      d[idx + 2] = un(b);
      d[idx + 3] = clamp(a * 255);
    }
  });
  return img;
}

function blank(w, h, color) {
  return new Jimp({ width: w, height: h, color });
}

async function placeCentered(canvas, logo, maxW, maxH) {
  const scale = Math.min(maxW / logo.bitmap.width, maxH / logo.bitmap.height);
  const w = Math.round(logo.bitmap.width * scale);
  const h = Math.round(logo.bitmap.height * scale);
  const copy = logo.clone().resize({ w, h });
  canvas.composite(copy, Math.round((canvas.bitmap.width - w) / 2), Math.round((canvas.bitmap.height - h) / 2));
  return canvas;
}

(async () => {
  const src = await Jimp.read(SRC);
  knockoutWhite(src);
  src.autocrop({ tolerance: 0.1, cropOnlyFrames: false, leaveBorder: 0 });
  console.log('cropped logo', src.bitmap.width, 'x', src.bitmap.height);

  // 1. In-app logo (transparent), 1200px wide max.
  const logo = src.clone();
  if (logo.bitmap.width > 720) logo.resize({ w: 720 });
  await logo.write(path.join(OUT, 'brand/logo.png'), { deflateLevel: 9 });

  // 2. App icon 1024x1024, white background, logo at ~72% width.
  await (await placeCentered(blank(1024, 1024, 0xffffffff), src, 760, 560)).write(path.join(OUT, 'icon.png'));

  // 3. Native splash image (transparent), shown on white background.
  await (await placeCentered(blank(1024, 1024, 0x00000000), src, 620, 460)).write(path.join(OUT, 'splash-icon.png'));

  // 4. Android adaptive icon layers. Foreground keeps the logo inside the 66% safe zone.
  await (await placeCentered(blank(1024, 1024, 0x00000000), src, 600, 440)).write(path.join(OUT, 'android-icon-foreground.png'));
  await blank(1024, 1024, 0xffffffff).write(path.join(OUT, 'android-icon-background.png'));
  const mono = src.clone();
  mono.scan(0, 0, mono.bitmap.width, mono.bitmap.height, (x, y, idx) => {
    const d = mono.bitmap.data;
    d[idx] = 255; d[idx + 1] = 255; d[idx + 2] = 255; // keep alpha only
  });
  await (await placeCentered(blank(1024, 1024, 0x00000000), mono, 600, 440)).write(path.join(OUT, 'android-icon-monochrome.png'));

  // 5. Favicon.
  await (await placeCentered(blank(64, 64, 0xffffffff), src, 56, 44)).write(path.join(OUT, 'favicon.png'));

  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
