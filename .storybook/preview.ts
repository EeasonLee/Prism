import type { Preview } from '@storybook/react';

// 注入全局样式：字体 + Design Token CSS 变量 + Tailwind 基础样式
import '../apps/prism/app/globals.css';

const preview: Preview = {
  parameters: {
    // 自动为颜色/背景类型的 controls 显示色盘选择器
    controls: {
      matchers: {
        color: /(color|background|foreground|fill|stroke)$/i,
        date: /date$/i,
      },
    },
    // 视口预设（对应 responsive.md 中的测试标准）
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (375px)',
          styles: { width: '375px', height: '812px' },
        },
        tablet: {
          name: 'Tablet (768px)',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop (1440px)',
          styles: { width: '1440px', height: '900px' },
        },
      },
    },
    // 背景色预设：与 Design System 的 surface/background Token 对应
    backgrounds: {
      default: 'white',
      values: [
        { name: 'white (background)', value: '#ffffff' },
        { name: 'surface (cream)', value: '#f6f6f2' },
        { name: 'surface-muted (gray)', value: '#f2f2f2' },
        { name: 'dark', value: '#0c1220' },
      ],
    },
  },
};

export default preview;
