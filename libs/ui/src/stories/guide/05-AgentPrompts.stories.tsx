import type { Meta, StoryObj } from '@storybook/react';

import { agentPromptGuide } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function AgentPromptsPage() {
  return (
    <Page
      title="Agent 指令模板"
      description="提供可直接复用的规范速查与提示词模板，提升 AI 协作效率。"
    >
      <Section
        title="颜色速查"
        description="编写实现提示词时可直接复用这些约定。"
      >
        <div className="space-y-3">
          {agentPromptGuide.colorReference.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="提示词模板"
        description="模板内已约束语义 Token、响应式规则和交互护栏。"
      >
        <div className="space-y-3">
          {agentPromptGuide.promptTemplates.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/Agent 指令模板',
  component: AgentPromptsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <AgentPromptsPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <AgentPromptsPage />
    </div>
  ),
};
