import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../components/button';
import { Page, Section, Card } from '../shared-primitives';

function ComponentStylingsPage() {
  return (
    <Page
      title="组件样式规范"
      description="沉淀按钮、卡片、输入框、导航等核心组件的状态样式。"
    >
      <Section
        title="按钮"
        description="主操作使用 brand 变体，并保证禁用态和焦点态清晰可见。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-3">
            <p className="micro-text text-ink-faint">
              默认态 / 悬浮态 / 焦点态
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="brand">立即购买</Button>
              <Button variant="outline">次级操作</Button>
              <Button variant="ghost">弱化操作</Button>
            </div>
            <p className="body-text text-ink-muted">
              Hover 与 Focus 通过组件变体和 ring Token 统一管理。
            </p>
          </Card>
          <Card className="space-y-3">
            <p className="micro-text text-ink-faint">禁用态</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="brand" disabled>
                处理中
              </Button>
              <Button variant="outline" disabled>
                不可用
              </Button>
            </div>
            <p className="body-text text-ink-muted">
              禁用态应保持布局稳定并避免误触。
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="卡片"
        description="卡片应基于 surface 与 elevation Token，而非随意边框样式。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4 shadow-card-sm">
            <p className="heading-4 text-ink">标准卡片</p>
            <p className="body-text text-ink-muted mt-2">
              用于商品摘要与简洁信息展示。
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <p className="heading-4 text-ink">强调卡片</p>
            <p className="body-text text-ink-muted mt-2">
              仅在需要强调层级时使用更强阴影。
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="输入框"
        description="输入控件必须保证可读字号与清晰焦点反馈。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-2">
            <label
              className="micro-text text-ink-faint"
              htmlFor="default-input"
            >
              默认状态
            </label>
            <input
              id="default-input"
              className="h-10 w-full rounded-md border border-input bg-background px-3 body-text text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="搜索商品"
            />
          </Card>
          <Card className="space-y-2">
            <label className="micro-text text-ink-faint" htmlFor="error-input">
              错误状态
            </label>
            <input
              id="error-input"
              className="h-10 w-full rounded-md border border-destructive bg-background px-3 body-text text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              defaultValue="输入值无效"
            />
          </Card>
        </div>
      </Section>

      <Section
        title="导航"
        description="导航需通过语义色清晰区分激活态与未激活态。"
      >
        <Card>
          <nav className="flex flex-wrap gap-2">
            <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground">
              当前页
            </button>
            <button className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-brand-light">
              菜单项
            </button>
            <button className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-brand-light">
              菜单项
            </button>
          </nav>
        </Card>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/组件样式',
  component: ComponentStylingsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <ComponentStylingsPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <ComponentStylingsPage />
    </div>
  ),
};
