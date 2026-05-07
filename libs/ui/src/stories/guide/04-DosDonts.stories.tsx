import type { Meta, StoryObj } from '@storybook/react';

import { dosAndDonts } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function DosDontsPage() {
  return (
    <Page
      title="Do / Don't"
      description="通过正反示例统一实现质量，减少样式回退。"
    >
      <Section
        title="设计护栏"
        description="每个主题都给出推荐做法与常见反模式。"
      >
        <div className="space-y-4">
          {dosAndDonts.map(item => (
            <Card key={item.topic} className="space-y-3">
              <p className="heading-4 text-ink">{item.topic}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-success/30 bg-success/10 p-3">
                  <p className="micro-text text-success">建议</p>
                  <p className="body-text text-ink mt-1">{item.doText}</p>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                  <p className="micro-text text-destructive">禁忌</p>
                  <p className="body-text text-ink mt-1">{item.dontText}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: "Design Guide/Do / Don't",
  component: DosDontsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <DosDontsPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <DosDontsPage />
    </div>
  ),
};
