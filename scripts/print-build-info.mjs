#!/usr/bin/env node
/**
 * 构建信息打印脚本
 * 在 dev/build 启动时输出版本等信息到终端
 * 使用 ASCII 字符确保 Windows 终端正确显示
 */

import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..');
const prismPkgPath = join(workspaceRoot, 'apps', 'prism', 'package.json');
const rootPkgPath = join(workspaceRoot, 'package.json');

function readJson(path, fallback = {}) {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return fallback;
  }
}

function getLastGitTag() {
  try {
    const tag = execSync('git describe --tags --abbrev=0', {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return tag.startsWith('v') ? tag.slice(1) : tag;
  } catch {
    return null;
  }
}

const prismPkg = readJson(prismPkgPath);
const rootPkg = readJson(rootPkgPath);

const version = prismPkg.version ?? 'unknown';
const lastTag = getLastGitTag();
const versionStatus =
  lastTag == null
    ? '(first build)'
    : lastTag !== version
      ? `(updated from ${lastTag})`
      : '(no change)';

const buildTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
const nodeVersion = process.version;
const nextVersion = rootPkg.dependencies?.next ?? 'n/a';
const reactVersion = rootPkg.dependencies?.react ?? 'n/a';
const nxVersion = rootPkg.devDependencies?.nx ?? 'n/a';

const labelWidth = 16;
const valueWidth = 22;

function line(label, value) {
  const l = String(label).padEnd(labelWidth);
  const v = String(value).padEnd(valueWidth);
  return `| ${l} | ${v} |`;
}

const sep = '+' + '-'.repeat(labelWidth + 2) + '+' + '-'.repeat(valueWidth + 2) + '+';
const headerContentWidth = labelWidth + valueWidth + 3;
const rows = [
  sep,
  `| ${'Prism Build Info'.padEnd(headerContentWidth)} |`,
  sep,
  line('Version', version),
  line('Version Status', versionStatus),
  line('Build Time', buildTime),
  line('Node', nodeVersion),
  line('Next.js', nextVersion),
  line('React', reactVersion),
  line('Nx', nxVersion),
  sep,
];

console.log('\n' + rows.join('\n') + '\n');
