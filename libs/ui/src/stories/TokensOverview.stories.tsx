import type { Meta, StoryObj } from '@storybook/react';

type ColorToken = {
  token: string;
  className: string;
  description: string;
};

type ColorGroup = {
  title: string;
  description: string;
  items: ColorToken[];
};

const groups: ColorGroup[] = [
  {
    title: 'SYSTEM（shadcn 语义色）',
    description: '组件基础语义色，建议优先通过组件变体消费。',
    items: [
      {
        token: '--background',
        className: 'bg-background',
        description: '页面底色',
      },
      {
        token: '--foreground',
        className: 'text-foreground',
        description: '基础前景文字',
      },
      { token: '--card', className: 'bg-card', description: '卡片背景' },
      {
        token: '--card-foreground',
        className: 'text-card-foreground',
        description: '卡片文字',
      },
      { token: '--popover', className: 'bg-popover', description: '浮层背景' },
      {
        token: '--popover-foreground',
        className: 'text-popover-foreground',
        description: '浮层文字',
      },
      {
        token: '--primary',
        className: 'bg-primary',
        description: '主操作背景',
      },
      {
        token: '--primary-foreground',
        className: 'text-primary-foreground',
        description: '主操作文字',
      },
      {
        token: '--secondary',
        className: 'bg-secondary',
        description: '次级操作背景',
      },
      {
        token: '--secondary-foreground',
        className: 'text-secondary-foreground',
        description: '次级操作文字',
      },
      { token: '--muted', className: 'bg-muted', description: '弱强调背景' },
      {
        token: '--muted-foreground',
        className: 'text-muted-foreground',
        description: '弱强调文字',
      },
      { token: '--accent', className: 'bg-accent', description: '高亮背景' },
      {
        token: '--accent-foreground',
        className: 'text-accent-foreground',
        description: '高亮文字',
      },
      {
        token: '--destructive',
        className: 'bg-destructive',
        description: '危险背景',
      },
      {
        token: '--destructive-foreground',
        className: 'text-destructive-foreground',
        description: '危险文字',
      },
      {
        token: '--border',
        className: 'border-border',
        description: '边框与分隔线',
      },
      {
        token: '--input',
        className: 'border-input',
        description: '输入框边框',
      },
      { token: '--ring', className: 'ring-ring', description: '焦点环' },
    ],
  },
  {
    title: 'BRAND',
    description: '品牌语义色。',
    items: [
      { token: '--brand', className: 'bg-brand', description: '品牌主色' },
      {
        token: '--brand-foreground',
        className: 'text-brand-foreground',
        description: '品牌色上的文字',
      },
      {
        token: '--brand-light',
        className: 'bg-brand-light',
        description: '品牌浅底',
      },
    ],
  },
  {
    title: 'INK',
    description: '文本层级。',
    items: [
      { token: '--ink', className: 'text-ink', description: '主文本' },
      {
        token: '--ink-muted',
        className: 'text-ink-muted',
        description: '次文本',
      },
      {
        token: '--ink-faint',
        className: 'text-ink-faint',
        description: '弱文本',
      },
    ],
  },
  {
    title: 'SURFACE',
    description: '背景层级。',
    items: [
      {
        token: '--surface',
        className: 'bg-surface',
        description: '内容区背景',
      },
      {
        token: '--surface-muted',
        className: 'bg-surface-muted',
        description: '导航区背景',
      },
    ],
  },
  {
    title: 'STATUS',
    description: '业务状态语义色。',
    items: [
      { token: '--success', className: 'bg-success', description: '成功反馈' },
      {
        token: '--success-foreground',
        className: 'text-success-foreground',
        description: '成功文字',
      },
      { token: '--warning', className: 'bg-warning', description: '警告反馈' },
      {
        token: '--warning-foreground',
        className: 'text-warning-foreground',
        description: '警告文字',
      },
      { token: '--info', className: 'bg-info', description: '信息反馈' },
      {
        token: '--info-foreground',
        className: 'text-info-foreground',
        description: '信息文字',
      },
    ],
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="heading-4 text-ink mb-2">{title}</h2>
      <p className="body-text text-ink-muted mb-4">{description}</p>
      {children}
    </section>
  );
}

function Swatch({ token, className, description }: ColorToken) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `hsl(var(${token}))` }}
      />
      <p className="micro-text text-ink">{token}</p>
      <p className="micro-text text-ink-faint">{className}</p>
      <p className="body-text text-ink-muted">{description}</p>
    </div>
  );
}

function TokensPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="heading-3 text-ink mb-2">Design Tokens</h1>
      <p className="body-text text-ink-muted mb-8">
        Token 真相源位于{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 text-sm">
          libs/tokens/src/tokens.css
        </code>
        ，Tailwind 映射位于{' '}
        <code className="rounded bg-surface px-1.5 py-0.5 text-sm">
          libs/tokens/src/tailwind-preset.js
        </code>
        。
      </p>

      {groups.map(group => (
        <Section
          key={group.title}
          title={group.title}
          description={group.description}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map(item => (
              <Swatch key={item.token} {...item} />
            ))}
          </div>
        </Section>
      ))}

      <Section
        title="RADIUS / SHADOW / TOUCH"
        description="关键非颜色 token 预览。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-sm border border-border bg-card p-4">
            <p className="micro-text text-ink mb-2">rounded-sm</p>
            <div className="h-10 rounded-sm bg-surface border border-border" />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="micro-text text-ink mb-2">
              rounded-lg (var(--radius))
            </p>
            <div className="h-10 rounded-lg bg-surface border border-border" />
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="micro-text text-ink mb-2">shadow-card</p>
            <div className="h-10 rounded-lg bg-card shadow-card" />
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="micro-text text-ink mb-2">min-h-touch / min-w-touch</p>
          <button className="min-h-touch min-w-touch rounded-full bg-brand px-4 text-brand-foreground micro-text">
            44px 最小触控区
          </button>
        </div>
      </Section>
    </div>
  );
}

const meta: Meta = {
  title: 'Design Tokens/Overview',
  component: TokensPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const AllTokens: Story = {
  render: () => <TokensPage />,
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark">
      <TokensPage />
    </div>
  ),
};
