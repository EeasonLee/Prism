/**
 * Prism Tailwind Preset
 *
 * 将 CSS 变量映射为 Tailwind 工具类，可被任何项目通过 presets 引入。
 *
 * 使用方式（tailwind.config.js 中）：
 *   const tokensPreset = require('../../libs/tokens/src/tailwind-preset');
 *   module.exports = { presets: [tokensPreset], ... };
 *
 * 所有 token 值引用 CSS 变量，实际颜色由 tokens.css 中的 :root 决定。
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      // ─── 圆角（基于 --radius 变量）────────────────────
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // ─── 颜色系统 ──────────────────────────────────────
      colors: {
        // shadcn 系统色
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // 品牌色：CTA 按钮、强调元素、徽章
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          light: 'hsl(var(--brand-light))',
        },

        // 背景层级：界面区域划分
        surface: {
          DEFAULT: 'hsl(var(--surface))', // cream 内容区
          muted: 'hsl(var(--surface-muted))', // 浅灰 Header/Nav
        },

        // 文字层级：内容可读性
        ink: {
          DEFAULT: 'hsl(var(--ink))', // 主文字
          muted: 'hsl(var(--ink-muted))', // 次要文字
          faint: 'hsl(var(--ink-faint))', // 占位/禁用文字
        },
      },

      // ─── 字体族 ────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Montserrat', 'system-ui', 'sans-serif'],
      },

      // ─── 阴影 ──────────────────────────────────────────
      boxShadow: {
        'card-sm': '0 4px 16px rgba(0, 0, 0, 0.06)',
        card: '0 18px 50px rgba(0, 0, 0, 0.1)',
        'card-lg': '0 24px 64px rgba(0, 0, 0, 0.14)',
      },

      // ─── 最小触控区域（WCAG 2.1 SC 2.5.5）────────────
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },

      // ─── iOS 安全区间距 ────────────────────────────────
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },

      // ─── 动画（accordion）────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
};
