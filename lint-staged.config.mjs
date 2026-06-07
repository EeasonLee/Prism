export default {
  '**/*.{ts,tsx,js,jsx}': (files) => {
    const toArg = (f) => `"${f}"`;
    const frontendFiles = files.filter((f) =>
      f.replace(/\\/g, '/').includes('/apps/jd-frontend/'),
    );
    const otherFiles = files.filter(
      (f) => !f.replace(/\\/g, '/').includes('/apps/jd-frontend/'),
    );
    const cmds = [];
    if (frontendFiles.length) {
      cmds.push(
        `pnpm exec eslint --fix --no-warn-ignored --config apps/jd-frontend/eslint.config.mjs ${frontendFiles.map(toArg).join(' ')}`,
      );
    }
    if (otherFiles.length) {
      cmds.push(`pnpm exec eslint --fix ${otherFiles.map(toArg).join(' ')}`);
    }
    cmds.push(`pnpm exec prettier --write ${files.map(toArg).join(' ')}`);
    return cmds;
  },
  '**/*.{md,json,yml,yaml,css,scss,html}': ['pnpm exec prettier --write'],
};
