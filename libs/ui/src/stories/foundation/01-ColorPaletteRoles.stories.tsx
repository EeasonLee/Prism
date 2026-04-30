import type { Meta, StoryObj } from '@storybook/react';

import { colorPaletteGroups } from './foundation-data';
import {
  FoundationCard,
  FoundationPage,
  FoundationSection,
} from './foundation-primitives';
import { hslToHex } from './foundation-utils';

function ColorSwatch({
  token,
  semanticName,
  className,
  role,
  lightHsl,
  darkHsl,
}: {
  token: string;
  semanticName: string;
  className: string;
  role: string;
  lightHsl: string;
  darkHsl: string;
}) {
  return (
    <FoundationCard className="space-y-3">
      <div
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `hsl(var(${token}))` }}
      />
      <div className="space-y-1">
        <p className="body-text text-ink">{semanticName}</p>
        <p className="micro-text text-ink-faint">{className}</p>
        <p className="body-text text-ink-muted">{role}</p>
      </div>
      <div className="space-y-1 rounded-md bg-surface p-3">
        <p className="micro-text text-ink-faint">浅色 HSL：{lightHsl}</p>
        <p className="micro-text text-ink-faint">
          浅色 HEX：{hslToHex(lightHsl)}
        </p>
        <p className="micro-text text-ink-faint">深色 HSL：{darkHsl}</p>
        <p className="micro-text text-ink-faint">
          深色 HEX：{hslToHex(darkHsl)}
        </p>
      </div>
    </FoundationCard>
  );
}

function ColorPalettePage() {
  return (
    <FoundationPage
      title="色板与语义角色"
      description="展示语义色的 Token 来源、类名映射、HSL/HEX 数值与功能角色。"
    >
      {colorPaletteGroups.map(group => (
        <FoundationSection
          key={group.title}
          title={group.title}
          description={group.description}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map(item => (
              <ColorSwatch key={item.token} {...item} />
            ))}
          </div>
        </FoundationSection>
      ))}
    </FoundationPage>
  );
}

const meta: Meta = {
  title: '基础规范/01 色板与语义角色',
  component: ColorPalettePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const 亮色模式: Story = {
  render: () => <ColorPalettePage />,
};

export const 暗色模式: Story = {
  render: () => (
    <div className="dark">
      <ColorPalettePage />
    </div>
  ),
};
