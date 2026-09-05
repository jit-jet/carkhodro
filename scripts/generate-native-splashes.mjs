import { copyFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const assetsRequire = createRequire(
  path.join(projectRoot, 'node_modules', '@capacitor', 'assets', 'package.json'),
);
const sharp = assetsRequire('sharp');
const sourceIcon = path.join(projectRoot, 'assets', 'icon-foreground.png');
const splashMaster = path.join(projectRoot, 'assets', 'splash-master.png');
const background = '#fcf8f0';

const androidSplashes = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
];

async function renderSplash(destination, width, height, logoScale) {
  const logoSize = Math.round(Math.min(width, height) * logoScale);
  const logo = await sharp(sourceIcon)
    .resize(logoSize, logoSize, { fit: 'contain' })
    .png()
    .toBuffer();

  await mkdir(path.dirname(destination), { recursive: true });
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .removeAlpha()
    .png()
    .toFile(destination);
}

await renderSplash(splashMaster, 2732, 2732, 0.26);

await Promise.all(
  androidSplashes.map(([directory, width, height]) =>
    renderSplash(
      path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', directory, 'splash.png'),
      width,
      height,
      0.32,
    ),
  ),
);

const iosSplashDirectory = path.join(
  projectRoot,
  'ios',
  'App',
  'App',
  'Assets.xcassets',
  'Splash.imageset',
);

await Promise.all(
  ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'].map(
    (filename) => copyFile(splashMaster, path.join(iosSplashDirectory, filename)),
  ),
);

console.log('Generated branded Android and iOS splash screens from assets/icon-foreground.png.');
