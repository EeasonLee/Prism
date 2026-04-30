import type { Meta, StoryObj } from '@storybook/react';

import { visualThemeAtmosphere } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';

function ThemeAtmospherePage() {
  return (
    <FoundationPage
      title="视觉主题与氛围"
      description="定义全站统一的产品气质、信息密度和设计哲学。"
    >
      <FoundationSection
        title="产品气质"
        description="用户在各类流程中应感受到的情绪基调。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.mood.map(item => (
            <FoundationCard key={item}>
              <p className="body-text text-ink">{item}</p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>

      <FoundationSection
        title="信息密度"
        description="在电商浏览场景中保持可读与效率的平衡。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.density.map(item => (
            <FoundationCard key={item}>
              <p className="body-text text-ink">{item}</p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>

      <FoundationSection
        title="设计哲学"
        description="开发与评审阶段必须遵守的核心原则。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.designPhilosophy.map(item => (
            <FoundationCard key={item}>
              <p className="body-text text-ink">{item}</p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>
    </FoundationPage>
  );
}

const meta: Meta = {
  title: '基础规范/00 视觉主题与氛围',
  component: ThemeAtmospherePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <ThemeAtmospherePage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <ThemeAtmospherePage />
    </div>
  ),
};
