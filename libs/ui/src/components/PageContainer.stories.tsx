import type { Meta, StoryObj } from '@storybook/react';
import { PageContainer } from './PageContainer';

/**
 * PageContainer 是所有页面的布局入口组件。
 *
 * **必须使用规则：** 每个页面的最外层内容区域都必须用 PageContainer 包裹。
 * 不要在页面里单独写 `px-4 sm:px-6 max-w-[1720px] mx-auto`。
 *
 * @see docs/design-system/responsive.md — 布局规范
 */
const meta: Meta<typeof PageContainer> = {
  title: 'Components/PageContainer',
  component: PageContainer,
  tags: ['autodocs'],
  argTypes: {
    fullWidth: {
      control: 'boolean',
      description: '是否取消最大宽度限制（适用于全屏背景区块）',
    },
    className: {
      control: 'text',
      description: '追加的自定义类名（用于添加 padding/margin，不覆盖颜色）',
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '响应式页面容器。内置水平内边距（mobile: 16px / tablet: 24px / desktop: 50px）和最大宽度（1720px）。\n\n' +
          '**内边距：** `px-4 sm:px-6 lg:px-[50px]`\n\n' +
          '**最大宽度：** `max-w-[1720px] mx-auto`（除非 `fullWidth=true`）',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageContainer>;

// 用于演示的内容块
function DemoContent({ label }: { label: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 text-ink-muted body-text text-center">
      {label}
    </div>
  );
}

export const Default: Story = {
  args: {
    children: (
      <div className="py-8 space-y-4">
        <p className="heading-3 text-ink">Page Content</p>
        <DemoContent label="This content respects the max-width and responsive padding" />
        <DemoContent label="Resize the viewport to see padding change" />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: { story: '标准用法：内容自动居中，最大宽度 1720px。' },
    },
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: (
      <div className="py-8 space-y-4">
        <p className="heading-3 text-ink">Full Width Content</p>
        <DemoContent label="No max-width constraint — stretches to fill viewport" />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '全宽模式：适用于需要铺满背景的 Hero/Banner 区块内部。',
      },
    },
  },
};

export const WithSections: Story = {
  render: () => (
    <div>
      {/* Section 1: 浅灰背景 */}
      <section className="bg-surface-muted">
        <PageContainer>
          <div className="py-12">
            <p className="micro-text text-ink-faint mb-2">
              SURFACE-MUTED SECTION
            </p>
            <p className="heading-3 text-ink">Navigation / Header Zone</p>
          </div>
        </PageContainer>
      </section>

      {/* Section 2: cream 背景 */}
      <section className="bg-surface">
        <PageContainer>
          <div className="py-12">
            <p className="micro-text text-ink-faint mb-2">SURFACE SECTION</p>
            <p className="heading-3 text-ink">Content Area</p>
            <p className="body-text text-ink-muted mt-2">
              Cream background for main content regions.
            </p>
          </div>
        </PageContainer>
      </section>

      {/* Section 3: 白色背景 */}
      <section className="bg-background">
        <PageContainer>
          <div className="py-12">
            <p className="micro-text text-ink-faint mb-2">BACKGROUND SECTION</p>
            <p className="heading-3 text-ink">White Background Zone</p>
          </div>
        </PageContainer>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '多区块布局示例：每个 section 有自己的背景色，PageContainer 提供统一内边距。',
      },
    },
  },
};

export const ResponsivePadding: Story = {
  render: () => (
    <div className="bg-background">
      <PageContainer>
        <div className="py-8">
          <p className="micro-text text-ink-faint mb-4">
            RESPONSIVE PADDING DEMO
          </p>
          <div className="relative border-2 border-dashed border-brand rounded-lg p-4">
            <span className="absolute -top-3 left-4 bg-background px-2 micro-text text-brand">
              PageContainer boundary
            </span>
            <div className="bg-surface rounded p-4 text-center">
              <p className="body-text text-ink-muted">
                Mobile: 16px padding · Tablet (sm): 24px · Desktop (lg): 50px
              </p>
              <p className="micro-text text-ink-faint mt-2">
                Resize the Storybook viewport to observe changes
              </p>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '内边距随视口宽度变化演示。使用 Storybook 顶部的 viewport 工具切换设备尺寸。',
      },
    },
  },
};
