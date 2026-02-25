import type { Meta, StoryObj } from '@storybook/react';

// ─── Token 色板组件（内联定义，不依赖外部导入）───────────────
function ColorSwatch({
  cssVar,
  label,
  tailwindClass,
}: {
  cssVar: string;
  label: string;
  tailwindClass: string;
}) {
  return (
    <div className="text-center">
      <div
        className="w-20 h-20 rounded-lg border border-border"
        style={{ backgroundColor: `hsl(var(${cssVar}))` }}
      />
      <p className="micro-text text-ink mt-2">{label}</p>
      <p className="micro-text text-ink-faint mt-0.5">{tailwindClass}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <p className="micro-text text-ink-faint mb-4">{title}</p>
      {children}
    </section>
  );
}

function TokensPage() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="heading-3 text-ink mb-2">Design Tokens</h1>
      <p className="body-text text-ink-muted mb-8">
        Prism Design System 的视觉基础。修改颜色：只需更改{' '}
        <code className="text-sm bg-surface px-1.5 py-0.5 rounded">
          libs/tokens/src/tokens.css
        </code>{' '}
        中的 CSS 变量值，全局自动生效。
      </p>

      {/* ─── Colors ──────────────────────────────────────────── */}
      <Section title="BRAND（品牌色）">
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch
            cssVar="--brand"
            label="brand"
            tailwindClass="bg-brand / text-brand"
          />
          <ColorSwatch
            cssVar="--brand-light"
            label="brand-light"
            tailwindClass="bg-brand-light"
          />
          <ColorSwatch
            cssVar="--brand-foreground"
            label="brand-foreground"
            tailwindClass="text-brand-foreground"
          />
        </div>
        <p className="micro-text text-ink-muted mt-3">
          用途：CTA 按钮 bg-brand · 品牌文字 text-brand · 悬停背景 bg-brand/10
        </p>
      </Section>

      <Section title="INK（文字层级）">
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch cssVar="--ink" label="ink" tailwindClass="text-ink" />
          <ColorSwatch
            cssVar="--ink-muted"
            label="ink-muted"
            tailwindClass="text-ink-muted"
          />
          <ColorSwatch
            cssVar="--ink-faint"
            label="ink-faint"
            tailwindClass="text-ink-faint"
          />
        </div>
        <p className="micro-text text-ink-muted mt-3">
          层级规则：主标题 text-ink → 说明文字 text-ink-muted → 占位/禁用
          text-ink-faint
        </p>
      </Section>

      <Section title="SURFACE（背景层级）">
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch
            cssVar="--background"
            label="background"
            tailwindClass="bg-background"
          />
          <ColorSwatch
            cssVar="--surface"
            label="surface"
            tailwindClass="bg-surface"
          />
          <ColorSwatch
            cssVar="--surface-muted"
            label="surface-muted"
            tailwindClass="bg-surface-muted"
          />
          <ColorSwatch cssVar="--card" label="card" tailwindClass="bg-card" />
        </div>
        <p className="micro-text text-ink-muted mt-3">
          层级：background（页面底色）→ card（纯白卡片）→ surface（cream 区域）→
          surface-muted（Header/Nav）
        </p>
      </Section>

      <Section title="SYSTEM（状态色）">
        <div className="flex gap-4 flex-wrap">
          <ColorSwatch
            cssVar="--primary"
            label="primary"
            tailwindClass="bg-primary"
          />
          <ColorSwatch
            cssVar="--secondary"
            label="secondary"
            tailwindClass="bg-secondary"
          />
          <ColorSwatch
            cssVar="--destructive"
            label="destructive"
            tailwindClass="bg-destructive"
          />
          <ColorSwatch
            cssVar="--border"
            label="border"
            tailwindClass="border-border"
          />
          <ColorSwatch
            cssVar="--muted"
            label="muted"
            tailwindClass="bg-muted"
          />
          <ColorSwatch
            cssVar="--accent"
            label="accent"
            tailwindClass="bg-accent"
          />
        </div>
      </Section>

      {/* ─── Typography ─────────────────────────────────────── */}
      <Section title="TYPOGRAPHY（排版系统）">
        <div className="p-6 bg-card border border-border rounded-lg space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="micro-text text-ink-faint w-32 shrink-0">
              heading-1
            </span>
            <h1 className="heading-1 text-ink leading-none">Hero Title</h1>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="micro-text text-ink-faint w-32 shrink-0">
              heading-2
            </span>
            <h2 className="heading-2 text-ink leading-none">Section Title</h2>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="micro-text text-ink-faint w-32 shrink-0">
              heading-3
            </span>
            <h3 className="heading-3 text-ink">Card Heading</h3>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="micro-text text-ink-faint w-32 shrink-0">
              heading-4
            </span>
            <h4 className="heading-4 text-ink">Sidebar Title</h4>
          </div>
          <div className="border-t border-border pt-4" />
          <div className="flex items-baseline gap-4">
            <span className="micro-text text-ink-faint w-32 shrink-0">
              body-text
            </span>
            <p className="body-text text-ink">
              Used for article content, product descriptions. Minimum 15px on
              mobile.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="micro-text text-ink-faint w-32 shrink-0">
              micro-text
            </span>
            <p className="micro-text text-ink-muted">
              LABELS, METADATA, TAGS, COPYRIGHT
            </p>
          </div>
        </div>
      </Section>

      {/* ─── Shadows ────────────────────────────────────────── */}
      <Section title="SHADOWS（阴影）">
        <div className="flex gap-8 flex-wrap py-4">
          <div className="text-center">
            <div className="w-24 h-16 bg-card rounded-lg shadow-card-sm" />
            <p className="micro-text text-ink-faint mt-3">shadow-card-sm</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-16 bg-card rounded-lg shadow-card" />
            <p className="micro-text text-ink-faint mt-3">shadow-card</p>
          </div>
          <div className="text-center">
            <div className="w-24 h-16 bg-card rounded-lg shadow-card-lg" />
            <p className="micro-text text-ink-faint mt-3">shadow-card-lg</p>
          </div>
        </div>
      </Section>

      {/* ─── Touch Targets ──────────────────────────────────── */}
      <Section title="TOUCH TARGETS（44px 最小触控区域）">
        <div className="flex gap-4 items-center">
          <button className="min-h-touch min-w-touch px-4 bg-brand text-brand-foreground rounded-full micro-text">
            44 × 44px min
          </button>
          <p className="body-text text-ink-muted">
            所有可交互元素必须满足{' '}
            <code className="text-sm bg-surface px-1.5 py-0.5 rounded">
              min-h-touch min-w-touch
            </code>{' '}
            (44px)，符合 WCAG 2.1 SC 2.5.5
          </p>
        </div>
      </Section>
    </div>
  );
}

// ─── Story 定义 ───────────────────────────────────────────────
const meta: Meta = {
  title: 'Design Tokens/Overview',
  component: TokensPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '所有 Design Token 的可视化展示。\n\n' +
          '**修改颜色：** 只需更改 `libs/tokens/src/tokens.css`，此页面自动反映更新。\n\n' +
          '**Tailwind 映射：** 所有 Token 对应 `libs/tokens/src/tailwind-preset.js` 中的工具类。',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AllTokens: Story = {
  render: () => <TokensPage />,
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <TokensPage />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '深色模式下的 Token 展示。CSS 变量在 `.dark` 类下会切换到深色值。',
      },
    },
  },
};
