import type { Meta, StoryObj } from '@storybook/react';

import { responsiveBreakpoints, responsivePatterns } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';

function ResponsiveBehaviorPage() {
  return (
    <FoundationPage
      title="响应式行为"
      description="定义断点、触达面积约束与组件折叠策略。"
    >
      <FoundationSection
        title="断点体系"
        description="严格按递进增强顺序使用 Tailwind 默认断点。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {responsiveBreakpoints.map(item => (
            <FoundationCard key={item.prefix} className="space-y-2">
              <p className="heading-4 text-ink">{item.prefix}</p>
              <p className="body-text text-ink-muted">
                最小宽度：{item.minWidth}
              </p>
              <p className="body-text text-ink-muted">{item.role}</p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>

      <FoundationSection
        title="触达面积"
        description="交互控件必须保证最小 44x44 的触控区域。"
      >
        <FoundationCard className="space-y-4">
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
        </FoundationCard>
      </FoundationSection>

      <FoundationSection
        title="折叠策略"
        description="定义从移动端到桌面端的结构切换行为。"
      >
        <div className="space-y-3">
          {responsivePatterns.map(pattern => (
            <FoundationCard key={pattern.pattern} className="space-y-2">
              <p className="body-text text-ink">{pattern.pattern}</p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">移动端：</span> {pattern.mobile}
              </p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">桌面端：</span> {pattern.desktop}
              </p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>
    </FoundationPage>
  );
}

const meta: Meta = {
  title: '基础规范/07 响应式行为',
  component: ResponsiveBehaviorPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <ResponsiveBehaviorPage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <ResponsiveBehaviorPage />
    </div>
  ),
};
