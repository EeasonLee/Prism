import type { Meta, StoryObj } from '@storybook/react';

import { Page, Section, Card, ColorSwatch } from './shared-primitives';
import {
  colorGroups,
  typographyRows,
  spacingScaleRows,
  elevationRows,
} from './tokens-data';

function TokensPage() {
  return (
    <Page
      title="Design Tokens"
      description={
        <>
          Token 真相源位于{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">
            libs/tokens/src/tokens.css
          </code>
          ，Tailwind 映射位于{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">
            libs/tokens/src/tailwind-preset.js
          </code>
          。
        </>
      }
    >
      {/* ─── Colors ─── */}
      {colorGroups.map(group => (
        <Section
          key={group.title}
          title={group.title}
          description={group.description}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map(item => (
              <ColorSwatch key={item.token} {...item} />
            ))}
          </div>
        </Section>
      ))}

      {/* ─── Typography ─── */}
      <Section
        title="TYPOGRAPHY"
        description="直接使用语义字号类，避免临时拼接字号样式。"
      >
        <div className="space-y-3">
          {typographyRows.map(row => (
            <Card key={row.name} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="body-text text-ink">{row.name}</p>
                <p className="micro-text text-ink-faint">{row.className}</p>
              </div>
              <p className={row.className}>
                快速预览这套排版在真实界面中的层级表现。
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="micro-text text-ink-faint">字体：{row.family}</p>
                <p className="micro-text text-ink-faint">字重：{row.weight}</p>
                <p className="micro-text text-ink-faint">字号：{row.size}</p>
                <p className="micro-text text-ink-faint">
                  行高：{row.lineHeight}
                </p>
              </div>
              <p className="body-text text-ink-muted">
                使用场景：{row.useCase}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Spacing ─── */}
      <Section title="SPACING" description="区块与卡片应使用统一的间距节奏。">
        <div className="space-y-3">
          {spacingScaleRows.map(row => (
            <Card key={row.token} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="body-text text-ink">{row.token}</p>
                <p className="micro-text text-ink-faint">{row.className}</p>
              </div>
              <div
                className="h-3 rounded bg-brand/20"
                style={{ width: row.previewWidth }}
              />
              <p className="micro-text text-ink-faint">{row.px}</p>
              <p className="body-text text-ink-muted">{row.usage}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Elevation ─── */}
      <Section
        title="ELEVATION"
        description="通过阴影系统建立可预期的视觉深度。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {elevationRows.map(row => (
            <Card key={row.level} className="space-y-3">
              <p className="body-text text-ink">{row.level}</p>
              <div
                className={`rounded-lg border border-border bg-card p-5 ${row.className}`}
              >
                <p className="body-text text-ink">预览面板</p>
              </div>
              <p className="micro-text text-ink-faint">{row.className}</p>
              <p className="micro-text text-ink-faint">{row.token}</p>
              <p className="body-text text-ink-muted">{row.usage}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Radius & Touch ─── */}
      <Section
        title="RADIUS / SHADOW / TOUCH"
        description="关键非颜色 token 预览。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="micro-text text-ink mb-2">rounded-sm</p>
            <div className="h-10 rounded-sm bg-surface border border-border" />
          </Card>
          <Card>
            <p className="micro-text text-ink mb-2">
              rounded-lg (var(--radius))
            </p>
            <div className="h-10 rounded-lg bg-surface border border-border" />
          </Card>
          <Card>
            <p className="micro-text text-ink mb-2">shadow-card</p>
            <div className="h-10 rounded-lg bg-card shadow-card" />
          </Card>
        </div>
        <div className="mt-4">
          <Card>
            <p className="micro-text text-ink mb-2">
              min-h-touch / min-w-touch
            </p>
            <button className="min-h-touch min-w-touch rounded-full bg-brand px-4 text-brand-foreground micro-text">
              44px 最小触控区
            </button>
          </Card>
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Tokens/Overview',
  component: TokensPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <TokensPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <TokensPage />
    </div>
  ),
};
