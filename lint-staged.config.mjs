export default {
  '**/*.{ts,tsx,js,jsx}': (files) => {
    const toArg = (f) => `"${f}"`;
    const prismFiles = files.filter((f) =>
      f.replace(/\\/g, '/').includes('/apps/prism/'),
    );
    const otherFiles = files.filter(
      (f) => !f.replace(/\\/g, '/').includes('/apps/prism/'),
    );
    const cmds = [];
    if (prismFiles.length) {
      cmds.push(
        `pnpm exec eslint --fix --config apps/prism/eslint.config.mjs ${prismFiles.map(toArg).join(' ')}`,
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
