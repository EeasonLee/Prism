import type { Meta, StoryObj } from '@storybook/react';

import { elevationRows } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';

function DepthElevationPage() {
  return (
    <FoundationPage
      title="层次与深度"
      description="通过阴影与背景层级建立可预期的视觉深度。"
    >
      <FoundationSection
        title="阴影系统"
        description="按层级有节制地使用阴影，深度越高代表强调越强。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {elevationRows.map(row => (
            <FoundationCard key={row.level} className="space-y-3">
              <p className="body-text text-ink">{row.level}</p>
              <div
                className={`rounded-lg border border-border bg-card p-5 ${row.className}`}
              >
                <p className="body-text text-ink">预览面板</p>
              </div>
              <p className="micro-text text-ink-faint">{row.className}</p>
              <p className="micro-text text-ink-faint">{row.token}</p>
              <p className="body-text text-ink-muted">{row.usage}</p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>

      <FoundationSection
        title="背景层级"
        description="在引入阴影之前，先通过背景分层区分页面区域。"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="micro-text text-ink-faint">第 0 层</p>
            <p className="body-text text-ink">bg-background</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="micro-text text-ink-faint">第 1 层</p>
            <p className="body-text text-ink">bg-surface</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card-sm">
            <p className="micro-text text-ink-faint">第 2 层</p>
            <p className="body-text text-ink">bg-card + shadow-card-sm</p>
          </div>
        </div>
      </FoundationSection>
    </FoundationPage>
  );
}

const meta: Meta = {
  title: '基础规范/05 层次与深度',
  component: DepthElevationPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <DepthElevationPage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <DepthElevationPage />
    </div>
  ),
};
