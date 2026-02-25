import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

/**
 * Button 组件是设计系统中最核心的交互元素。
 *
 * - `brand` 变体：主要 CTA，圆角全宽，品牌橙背景
 * - `default` 变体：通用操作，使用 primary Token
 * - `outline` / `secondary` / `ghost`：次要操作层级
 * - `link`：内联文字链接
 *
 * @see docs/design-system/tokens.md — 颜色 Token 说明
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'brand',
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
      description: '按钮变体，对应不同的视觉层级和使用场景',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: '按钮尺寸',
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
    },
    asChild: {
      control: false,
      description: '使用 Radix Slot 将样式应用到子元素（如 Link）',
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          '基于 CVA 的按钮组件，所有颜色来自 Design Token，支持深色模式。' +
          '\n\n**使用规则：** 每个页面区域只用一个 `brand` 变体，次要操作用 `outline` 或 `secondary`。',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ─── 单个变体演示 ──────────────────────────────────────

export const Brand: Story = {
  args: { variant: 'brand', children: 'Shop Now' },
  parameters: {
    docs: {
      description: { story: '品牌 CTA 按钮。每个屏幕区域最多一个。' },
    },
  },
};

export const Default: Story = {
  args: { variant: 'default', children: 'Confirm' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: 'Learn More' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'View All' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Cancel' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Link: Story = {
  args: { variant: 'link', children: 'See details' },
};

export const Disabled: Story = {
  args: { variant: 'brand', children: 'Out of Stock', disabled: true },
  parameters: {
    docs: {
      description: { story: '禁用状态：opacity 降低，pointer-events 禁用。' },
    },
  },
};

// ─── 全量 Variant × Size 矩阵 ──────────────────────────

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 bg-background">
      <section>
        <p className="micro-text text-ink-faint mb-3">VARIANTS</p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="brand">Brand</Button>
          <Button variant="default">Default</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section>
        <p className="micro-text text-ink-faint mb-3">SIZES</p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="brand" size="sm">
            Small
          </Button>
          <Button variant="brand" size="default">
            Default
          </Button>
          <Button variant="brand" size="lg">
            Large
          </Button>
        </div>
      </section>

      <section>
        <p className="micro-text text-ink-faint mb-3">DISABLED STATE</p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="brand" disabled>
            Brand (disabled)
          </Button>
          <Button variant="default" disabled>
            Default (disabled)
          </Button>
          <Button variant="outline" disabled>
            Outline (disabled)
          </Button>
        </div>
      </section>

      <section>
        <p className="micro-text text-ink-faint mb-3">ON DARK BACKGROUND</p>
        <div className="flex flex-wrap gap-3 items-center p-4 bg-ink rounded-lg">
          <Button variant="brand">Brand</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: { story: '所有变体和尺寸的完整矩阵预览。' },
    },
  },
};
