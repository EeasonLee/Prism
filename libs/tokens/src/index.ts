/**
 * @prism/tokens
 *
 * Design Token 导出入口。
 * CSS 变量通过 tokens.css 引入，Tailwind 扩展通过 tailwind-preset.js 引入。
 *
 * 在 app 的 globals.css 中：
 *   @import '@prism/tokens/tokens.css';   // 或使用相对路径
 *
 * 在 tailwind.config.js 中：
 *   presets: [require('../../libs/tokens/src/tailwind-preset')]
 */

// CSS 变量文件路径（供参考，实际通过 @import 引入）
export const TOKENS_CSS_PATH = './tokens.css' as const;

// Tailwind preset 路径（供参考，实际通过 require() 引入）
export const TAILWIND_PRESET_PATH = './tailwind-preset.js' as const;
