import type { Meta, StoryObj } from '@storybook/react';

import { PageContainer } from '../../components/PageContainer';
import { layoutPrinciples, spacingScaleRows } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';

function LayoutPrinciplesPage() {
  return (
    <FoundationPage
      title="布局原则"
      description="定义间距尺度、栅格行为与留白策略，保证页面结构可预期。"
    >
      <FoundationSection
        title="间距尺度"
        description="区块与卡片应使用统一的间距节奏。"
      >
        <div className="space-y-3">
          {spacingScaleRows.map(row => (
            <FoundationCard key={row.token} className="space-y-2">
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
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>

      <FoundationSection
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
      </FoundationSection>

      <FoundationSection
        title="留白哲学"
        description="应先通过留白建立层级，再引入边框或阴影。"
      >
        <div className="space-y-3">
          {layoutPrinciples.map(rule => (
            <FoundationCard key={rule.principle} className="space-y-2">
              <p className="body-text text-ink">{rule.principle}</p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">推荐实现：</span>{' '}
                {rule.implementation}
              </p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">约束边界：</span> {rule.guardrail}
              </p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>
    </FoundationPage>
  );
}

const meta: Meta = {
  title: '基础规范/04 布局原则',
  component: LayoutPrinciplesPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <LayoutPrinciplesPage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <LayoutPrinciplesPage />
    </div>
  ),
};
