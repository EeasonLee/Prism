export interface ColorTokenItem {
  token: string;
  className: string;
  description: string;
  lightHsl: string;
}

export interface ColorTokenGroup {
  title: string;
  description: string;
  items: ColorTokenItem[];
}

export const colorGroups: ColorTokenGroup[] = [
  {
    title: 'SYSTEM（shadcn 语义色）',
    description: '组件基础语义色，建议优先通过组件变体消费。',
    items: [
      {
        token: '--background',
        className: 'bg-background',
        description: '页面底色',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--foreground',
        className: 'text-foreground',
        description: '基础前景文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--card',
        className: 'bg-card',
        description: '卡片背景',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--card-foreground',
        className: 'text-card-foreground',
        description: '卡片文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--popover',
        className: 'bg-popover',
        description: '浮层背景',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--popover-foreground',
        className: 'text-popover-foreground',
        description: '浮层文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--primary',
        className: 'bg-primary',
        description: '主操作背景',
        lightHsl: '15 71% 50%',
      },
      {
        token: '--primary-foreground',
        className: 'text-primary-foreground',
        description: '主操作文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--secondary',
        className: 'bg-secondary',
        description: '次级操作背景',
        lightHsl: '210 40% 96.1%',
      },
      {
        token: '--secondary-foreground',
        className: 'text-secondary-foreground',
        description: '次级操作文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--muted',
        className: 'bg-muted',
        description: '弱强调背景',
        lightHsl: '210 40% 96.1%',
      },
      {
        token: '--muted-foreground',
        className: 'text-muted-foreground',
        description: '弱强调文字',
        lightHsl: '0 0% 42%',
      },
      {
        token: '--accent',
        className: 'bg-accent',
        description: '高亮背景',
        lightHsl: '15 71% 95%',
      },
      {
        token: '--accent-foreground',
        className: 'text-accent-foreground',
        description: '高亮文字',
        lightHsl: '15 71% 40%',
      },
      {
        token: '--destructive',
        className: 'bg-destructive',
        description: '危险背景',
        lightHsl: '0 84.2% 60.2%',
      },
      {
        token: '--destructive-foreground',
        className: 'text-destructive-foreground',
        description: '危险文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--border',
        className: 'border-border',
        description: '边框与分隔线',
        lightHsl: '214.3 31.8% 91.4%',
      },
      {
        token: '--input',
        className: 'border-input',
        description: '输入框边框',
        lightHsl: '214.3 31.8% 91.4%',
      },
      {
        token: '--ring',
        className: 'ring-ring',
        description: '焦点环',
        lightHsl: '15 71% 50%',
      },
    ],
  },
  {
    title: 'BRAND',
    description: '品牌语义色。',
    items: [
      {
        token: '--brand',
        className: 'bg-brand',
        description: '品牌主色',
        lightHsl: '15 71% 50%',
      },
      {
        token: '--brand-foreground',
        className: 'text-brand-foreground',
        description: '品牌色上的文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--brand-light',
        className: 'bg-brand-light',
        description: '品牌浅底',
        lightHsl: '15 71% 95%',
      },
    ],
  },
  {
    title: 'INK',
    description: '文本层级。',
    items: [
      {
        token: '--ink',
        className: 'text-ink',
        description: '主文本',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--ink-muted',
        className: 'text-ink-muted',
        description: '次文本',
        lightHsl: '0 0% 42%',
      },
      {
        token: '--ink-faint',
        className: 'text-ink-faint',
        description: '弱文本',
        lightHsl: '0 0% 60%',
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
        lightHsl: '60 11% 96%',
      },
      {
        token: '--surface-muted',
        className: 'bg-surface-muted',
        description: '导航区背景',
        lightHsl: '0 0% 95%',
      },
    ],
  },
  {
    title: 'STATUS',
    description: '业务状态语义色。',
    items: [
      {
        token: '--success',
        className: 'bg-success',
        description: '成功反馈',
        lightHsl: '142 71% 45%',
      },
      {
        token: '--success-foreground',
        className: 'text-success-foreground',
        description: '成功文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--warning',
        className: 'bg-warning',
        description: '警告反馈',
        lightHsl: '38 92% 50%',
      },
      {
        token: '--warning-foreground',
        className: 'text-warning-foreground',
        description: '警告文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--info',
        className: 'bg-info',
        description: '信息反馈',
        lightHsl: '213 94% 55%',
      },
      {
        token: '--info-foreground',
        className: 'text-info-foreground',
        description: '信息文字',
        lightHsl: '0 0% 100%',
      },
    ],
  },
];

export interface TypographyRow {
  name: string;
  className: string;
  family: string;
  weight: string;
  size: string;
  lineHeight: string;
  useCase: string;
}

export const typographyRows: TypographyRow[] = [
  {
    name: '标题 1',
    className: 'heading-1',
    family: 'Montserrat',
    weight: '800',
    size: 'clamp(2.5rem, 5vw, 5rem)',
    lineHeight: '1',
    useCase: '首屏主标题与活动主标题',
  },
  {
    name: '标题 2',
    className: 'heading-2',
    family: 'Montserrat',
    weight: '800',
    size: 'clamp(2.125rem, 4.2vw, 4rem)',
    lineHeight: '1',
    useCase: '区块标题',
  },
  {
    name: '标题 3',
    className: 'heading-3',
    family: 'Montserrat',
    weight: '700',
    size: 'clamp(1.5rem, 2.5vw, 2rem)',
    lineHeight: '1.1',
    useCase: '卡片/功能模块标题',
  },
  {
    name: '标题 4',
    className: 'heading-4',
    family: 'Montserrat',
    weight: '600',
    size: 'clamp(1.125rem, 1.5vw, 1.375rem)',
    lineHeight: '1.2',
    useCase: '子区块标题',
  },
  {
    name: '正文字体',
    className: 'body-text',
    family: 'Inter',
    weight: '400',
    size: 'clamp(0.9375rem, 1.2vw, 1.125rem)',
    lineHeight: '1.55',
    useCase: '段落与商品描述',
  },
  {
    name: '微文案',
    className: 'micro-text',
    family: 'Inter',
    weight: '500',
    size: '0.75rem',
    lineHeight: '1.2',
    useCase: '标签、辅助信息、眉题',
  },
];

export interface SpacingRow {
  token: string;
  className: string;
  px: string;
  previewWidth: string;
  usage: string;
}

export const spacingScaleRows: SpacingRow[] = [
  {
    token: 'space-2',
    className: 'gap-2',
    px: '8px',
    previewWidth: '8px',
    usage: '图标与小标签的紧凑间距',
  },
  {
    token: 'space-3',
    className: 'gap-3',
    px: '12px',
    previewWidth: '12px',
    usage: '行内控件分组间距',
  },
  {
    token: 'space-4',
    className: 'gap-4',
    px: '16px',
    previewWidth: '16px',
    usage: '卡片默认内间距',
  },
  {
    token: 'space-6',
    className: 'gap-6',
    px: '24px',
    previewWidth: '24px',
    usage: '桌面端卡片内间距',
  },
  {
    token: 'space-8',
    className: 'gap-8',
    px: '32px',
    previewWidth: '32px',
    usage: '移动端区块间距',
  },
  {
    token: 'space-12/16',
    className: 'gap-12 lg:gap-16',
    px: '48px / 64px',
    previewWidth: '64px',
    usage: '桌面端区块间距',
  },
];

export interface ElevationRow {
  level: string;
  className: string;
  token: string;
  usage: string;
}

export const elevationRows: ElevationRow[] = [
  {
    level: '基础层',
    className: 'shadow-none',
    token: 'none',
    usage: '页面默认区域与低强调区块',
  },
  {
    level: '小卡片层',
    className: 'shadow-card-sm',
    token: '0 4px 16px rgba(0, 0, 0, 0.06)',
    usage: '小信息卡与标签块',
  },
  {
    level: '标准卡片层',
    className: 'shadow-card',
    token: '0 18px 50px rgba(0, 0, 0, 0.10)',
    usage: '核心内容卡片',
  },
  {
    level: '高强调卡片层',
    className: 'shadow-card-lg',
    token: '0 24px 64px rgba(0, 0, 0, 0.14)',
    usage: '重点推荐面板与弹层主体',
  },
];

export interface Breakpoint {
  prefix: string;
  minWidth: string;
  role: string;
}

export const breakpoints: Breakpoint[] = [
  { prefix: 'base', minWidth: '0px', role: '手机竖屏基线' },
  { prefix: 'sm', minWidth: '640px', role: '大手机 / 小平板' },
  { prefix: 'md', minWidth: '768px', role: '平板竖屏' },
  { prefix: 'lg', minWidth: '1024px', role: '平板横屏 / 小桌面' },
  { prefix: 'xl', minWidth: '1280px', role: '桌面端' },
  { prefix: '2xl', minWidth: '1536px', role: '大屏桌面' },
];
