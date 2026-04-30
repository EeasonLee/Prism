import type { Meta, StoryObj } from '@storybook/react';

import { agentPromptGuide } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';

function AgentPromptGuidePage() {
  return (
    <FoundationPage
      title="智能体提示词指南"
      description="提供可直接复用的规范速查与提示词模板，提升 AI 协作效率。"
    >
      <FoundationSection
        title="颜色速查"
        description="编写实现提示词时可直接复用这些约定。"
      >
        <div className="space-y-3">
          {agentPromptGuide.colorReference.map(item => (
            <FoundationCard key={item}>
              <p className="body-text text-ink">{item}</p>
            </FoundationCard>
          ))}
        </div>
      </FoundationSection>

      <FoundationSection
        title="提示词模板"
        description="模板内已约束语义 Token、响应式规则和交互护栏。"
      >
        <div className="space-y-3">
          {agentPromptGuide.promptTemplates.map(item => (
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
  title: '基础规范/08 智能体提示词指南',
  component: AgentPromptGuidePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <AgentPromptGuidePage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <AgentPromptGuidePage />
    </div>
  ),
};
