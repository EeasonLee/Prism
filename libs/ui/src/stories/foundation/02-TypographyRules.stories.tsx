import type { Meta, StoryObj } from '@storybook/react';

import { typographyRows } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';

function TypographyRulesPage() {
  return (
    <FoundationPage
      title="排版规范"
      description="定义标题、正文、微文案的字体家族与层级规则。"
    >
      <FoundationSection
        title="层级总览表"
        description="直接使用语义字号类，避免临时拼接字号样式。"
      >
        <div className="space-y-3">
          {typographyRows.map(row => (
            <FoundationCard key={row.name} className="space-y-3">
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
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>
    </FoundationPage>
  );
}

const meta: Meta = {
  title: '基础规范/02 排版规范',
  component: TypographyRulesPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <TypographyRulesPage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <TypographyRulesPage />
    </div>
  ),
};
