import type { Meta, StoryObj } from '@storybook/react';

import { visualThemeAtmosphere, layoutPrinciples } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function PrinciplesPage() {
  return (
    <Page
      title="设计原则"
      description="定义全站统一的产品气质、信息密度和设计哲学。"
    >
      <Section
        title="产品气质"
        description="用户在各类流程中应感受到的情绪基调。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.mood.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="信息密度"
        description="在电商浏览场景中保持可读与效率的平衡。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.density.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="设计哲学"
        description="开发与评审阶段必须遵守的核心原则。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.designPhilosophy.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="留白哲学"
        description="应先通过留白建立层级，再引入边框或阴影。"
      >
        <div className="space-y-3">
          {layoutPrinciples.map(rule => (
            <Card key={rule.principle} className="space-y-2">
              <p className="body-text text-ink">{rule.principle}</p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">推荐实现：</span>{' '}
                {rule.implementation}
              </p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">约束边界：</span> {rule.guardrail}
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/设计原则',
  component: PrinciplesPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <PrinciplesPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <PrinciplesPage />
    </div>
  ),
};
