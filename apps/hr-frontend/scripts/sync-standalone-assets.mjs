import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, '..');
const nextDir = join(appRoot, '.next');
const standaloneRoot = join(nextDir, 'standalone');
const standaloneAppDir = join(standaloneRoot, 'apps', 'hr-frontend');
const standaloneDotNext = join(standaloneAppDir, '.next');

if (!existsSync(standaloneRoot)) {
  console.warn('[sync-standalone-assets] 未找到 .next/standalone，跳过。');
  process.exit(0);
}

const staticSrc = join(nextDir, 'static');
if (!existsSync(staticSrc)) {
  console.error('[sync-standalone-assets] 缺少 .next/static，请先完成 next build。');
  process.exit(1);
}

if (!existsSync(standaloneDotNext)) {
  mkdirSync(standaloneDotNext, { recursive: true });
}

const staticDest = join(standaloneDotNext, 'static');
const publicSrc = join(appRoot, 'public');
const publicDest = join(standaloneAppDir, 'public');

cpSync(staticSrc, staticDest, { recursive: true, force: true });
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true, force: true });
}

console.log('[sync-standalone-assets] 已同步 .next/static 与 public → standalone');
