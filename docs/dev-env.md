## 开发环境约定

为了确保所有同事在同一 Node/pnpm 版本上开发，请按以下步骤准备环境。

### 1. 使用 Volta（推荐）

1. 安装 Volta（见 [volta.sh](https://volta.sh)）。
2. 在项目根目录运行任意命令时，Volta 会自动读取 `package.json` 中的配置并切换版本：
   ```json
   "volta": {
     "node": "20.11.1",
     "pnpm": "9.12.0"
   }
   ```
3. 执行 `pnpm install` 前无需额外操作，即可获得指定版本。

### 2. 备用方案（未安装 Volta 时）

- **Node**：使用 `nvm use 20.11.1` 或其他版本管理器手动切换。
- **pnpm**：执行 `corepack use pnpm@9.12.0` 或手动安装同版本。
- 建议运行一次 `pnpm dlx check-node-version --package` 确认版本符合 `package.json` 的 `engines`。

### 3. CI / AIO 约束

- CI 流程应先运行 `corepack enable`，再根据 `package.json` 的 `volta`/`engines` 拉取对应版本。
- 若需要更严格的限制，可在 Husky 钩子中执行 `pnpm dlx check-node-version --package`，不符合即中断。

### 4. IDE / 插件推荐

- VS Code 用户请安装 `.vscode/extensions.json` 中的推荐插件，重点包括：
  - `bradlc.vscode-tailwindcss`（Tailwind IntelliSense）
  - `dbaeumer.vscode-eslint`
  - `nrwl.angular-console`（Nx Console）
  - `esbenp.prettier-vscode`
  - `csstools.postcss`
  - `ms-azuretools.vscode-docker`（如需本地容器）
- 其它编辑器请根据上述功能自行寻找等效插件，保持一致的开发体验。

> 后续如需调整 Node/pnpm 版本或插件列表，只需更新 `package.json` 的 `volta` 字段与 `.vscode/extensions.json`，并同步通知团队。
