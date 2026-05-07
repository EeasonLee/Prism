import type { Meta, StoryObj } from '@storybook/react';

import { PageContainer } from '../../components/PageContainer';
import { breakpoints } from '../tokens-data';
import { responsivePatterns } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function LayoutResponsivePage() {
  return (
    <Page
      title="布局与响应式"
      description="定义断点体系、栅格行为与组件折叠策略。"
    >
      <Section
        title="栅格与容器"
        description="页面级布局应始终从 PageContainer 开始。"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-muted py-4">
            <PageContainer>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded bg-card p-4 text-center body-text text-ink">
                  第 1 列
                </div>
                <div className="rounded bg-card p-4 text-center body-text text-ink">
                  第 2 列
                </div>
                <div className="rounded bg-card p-4 text-center body-text text-ink">
                  第 3 列
                </div>
              </div>
            </PageContainer>
          </div>
          <p className="body-text text-ink-muted">
            该示例演示了单一容器来源，以及从移动端到桌面端的栅格递进增强。
          </p>
        </div>
      </Section>

      <Section
        title="断点体系"
        description="严格按递进增强顺序使用 Tailwind 默认断点。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {breakpoints.map(item => (
            <Card key={item.prefix} className="space-y-2">
              <p className="heading-4 text-ink">{item.prefix}</p>
              <p className="body-text text-ink-muted">
                最小宽度：{item.minWidth}
              </p>
              <p className="body-text text-ink-muted">{item.role}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="触达面积"
        description="交互控件必须保证最小 44x44 的触控区域。"
      >
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button className="min-h-touch min-w-touch rounded-full bg-brand px-4 text-brand-foreground micro-text">
              符合 44px
            </button>
            <button className="rounded-full bg-surface px-2 py-1 micro-text text-ink">
              不符合
            </button>
          </div>
          <p className="body-text text-ink-muted">
            优先使用 min-h-touch/min-w-touch Token，避免硬编码尺寸。
          </p>
        </Card>
      </Section>

      <Section
        title="折叠策略"
        description="定义从移动端到桌面端的结构切换行为。"
      >
        <div className="space-y-3">
          {responsivePatterns.map(pattern => (
            <Card key={pattern.pattern} className="space-y-2">
              <p className="body-text text-ink">{pattern.pattern}</p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">移动端：</span> {pattern.mobile}
              </p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">桌面端：</span> {pattern.desktop}
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/布局与响应式',
  component: LayoutResponsivePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <LayoutResponsivePage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <LayoutResponsivePage />
    </div>
  ),
};
