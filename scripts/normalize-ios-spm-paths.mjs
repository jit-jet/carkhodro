import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageFile = resolve('ios/App/CapApp-SPM/Package.swift');
if (!existsSync(packageFile)) process.exit(0);

const source = readFileSync(packageFile, 'utf8');
const normalized = source.replace(/(\.package\(name: "[^"]+", path: ")([^"]+)("\))/g, (_, start, path, end) => {
  return `${start}${path.replaceAll('\\', '/')}${end}`;
});

if (normalized !== source) {
  writeFileSync(packageFile, normalized, 'utf8');
  console.log('Normalized iOS Swift Package paths for cross-platform Xcode builds.');
}

const invalidPath = normalized.match(/\.package\(name: "[^"]+", path: "[^"]*\\/);
if (invalidPath) {
  console.error('A Windows-style path remains in ios/App/CapApp-SPM/Package.swift.');
  process.exit(1);
}
