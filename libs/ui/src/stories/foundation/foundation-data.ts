export type ColorTokenItem = {
  semanticName: string;
  token: string;
  className: string;
  role: string;
  lightHsl: string;
  darkHsl: string;
};

export type ColorTokenGroup = {
  title: string;
  description: string;
  items: ColorTokenItem[];
};

export const visualThemeAtmosphere = {
  mood: [
    '温暖且可信赖',
    '高可读性优先',
    '重实用，轻装饰',
    '触控优先的交互体验',
  ],
  density: [
    '电商浏览场景下默认使用舒适密度',
    '仅在信息层级需要时使用紧凑的元信息样式',
  ],
  designPhilosophy: [
    '布局遵循 Mobile-First 递进增强',
    '优先使用语义 Token，避免硬编码',
    '以 Token 变量作为唯一真相源',
    '优先复用组件变体，避免页面临时样式',
  ],
};

export const colorPaletteGroups: ColorTokenGroup[] = [
  {
    title: '品牌色',
    description: '品牌主视觉与关键 CTA 行为。',
    items: [
      {
        semanticName: '品牌主色',
        token: '--brand',
        className: 'bg-brand',
        role: '主 CTA、强调激活状态',
        lightHsl: '15 71% 50%',
        darkHsl: '15 71% 60%',
      },
      {
        semanticName: '品牌前景色',
        token: '--brand-foreground',
        className: 'text-brand-foreground',
        role: '品牌底色上的文字与图标',
        lightHsl: '0 0% 100%',
        darkHsl: '0 0% 100%',
      },
      {
        semanticName: '品牌浅色',
        token: '--brand-light',
        className: 'bg-brand-light',
        role: '品牌浅底、Hover 背景',
        lightHsl: '15 71% 95%',
        darkHsl: '15 71% 20%',
      },
    ],
  },
  {
    title: '文本层级',
    description: '用于内容可读性的文字层级体系。',
    items: [
      {
        semanticName: '主文本',
        token: '--ink',
        className: 'text-ink',
        role: '正文主文本',
        lightHsl: '0 0% 10%',
        darkHsl: '210 40% 95%',
      },
      {
        semanticName: '次级文本',
        token: '--ink-muted',
        className: 'text-ink-muted',
        role: '说明与辅助信息',
        lightHsl: '0 0% 42%',
        darkHsl: '215 20% 65%',
      },
      {
        semanticName: '弱文本',
        token: '--ink-faint',
        className: 'text-ink-faint',
        role: '元信息/占位/禁用文本',
        lightHsl: '0 0% 60%',
        darkHsl: '215 15% 45%',
      },
    ],
  },
  {
    title: '背景层级',
    description: '用于页面区域划分的背景层级。',
    items: [
      {
        semanticName: '页面背景',
        token: '--background',
        className: 'bg-background',
        role: '页面基础背景层',
        lightHsl: '0 0% 100%',
        darkHsl: '222.2 84% 4.9%',
      },
      {
        semanticName: '卡片背景',
        token: '--card',
        className: 'bg-card',
        role: '卡片与浮起面板',
        lightHsl: '0 0% 100%',
        darkHsl: '222.2 84% 4.9%',
      },
      {
        semanticName: '内容区背景',
        token: '--surface',
        className: 'bg-surface',
        role: '主要内容区域背景',
        lightHsl: '60 11% 96%',
        darkHsl: '222.2 20% 12%',
      },
      {
        semanticName: '弱化背景',
        token: '--surface-muted',
        className: 'bg-surface-muted',
        role: '导航/头部/筛选区域背景',
        lightHsl: '0 0% 95%',
        darkHsl: '222.2 20% 8%',
      },
    ],
  },
  {
    title: '状态色',
    description: '用于状态反馈与提示信息。',
    items: [
      {
        semanticName: '成功',
        token: '--success',
        className: 'bg-success',
        role: '成功操作反馈',
        lightHsl: '142 71% 45%',
        darkHsl: '142 65% 42%',
      },
      {
        semanticName: '警告',
        token: '--warning',
        className: 'bg-warning',
        role: '风险提醒反馈',
        lightHsl: '38 92% 50%',
        darkHsl: '38 92% 58%',
      },
      {
        semanticName: '信息',
        token: '--info',
        className: 'bg-info',
        role: '信息类提示反馈',
        lightHsl: '213 94% 55%',
        darkHsl: '213 90% 63%',
      },
      {
        semanticName: '危险',
        token: '--destructive',
        className: 'bg-destructive',
        role: '危险操作反馈',
        lightHsl: '0 84.2% 60.2%',
        darkHsl: '0 62.8% 30.6%',
      },
    ],
  },
];

export const typographyRows = [
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

export const spacingScaleRows = [
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

export const layoutPrinciples = [
  {
    principle: '页面容器唯一来源',
    implementation: '统一使用 PageContainer',
    guardrail: '不要在每个页面手写 max-width 与左右内边距',
  },
  {
    principle: '断点递进增强',
    implementation: 'base -> sm -> md -> lg -> xl',
    guardrail: '避免 max-md:* 这类 desktop-first 反向覆盖',
  },
  {
    principle: '先用留白建立层级',
    implementation: '优先用间距尺度，再考虑边框和阴影',
    guardrail: '不要仅靠颜色饱和度区分层级',
  },
  {
    principle: '可预期的栅格适配',
    implementation: '移动端 1 列，平板 2 列，桌面 3 列及以上',
    guardrail: '避免相邻断点出现突兀结构跳变',
  },
];

export const elevationRows = [
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

export const responsiveBreakpoints = [
  { prefix: 'base', minWidth: '0px', role: '手机竖屏基线' },
  { prefix: 'sm', minWidth: '640px', role: '大手机 / 小平板' },
  { prefix: 'md', minWidth: '768px', role: '平板竖屏' },
  { prefix: 'lg', minWidth: '1024px', role: '平板横屏 / 小桌面' },
  { prefix: 'xl', minWidth: '1280px', role: '桌面端' },
  { prefix: '2xl', minWidth: '1536px', role: '大屏桌面' },
];

export const responsivePatterns = [
  {
    pattern: '头部导航',
    mobile: '汉堡菜单 + 抽屉',
    desktop: '横向导航 + 下拉菜单',
  },
  {
    pattern: '筛选面板',
    mobile: '按钮打开底部/侧边抽屉',
    desktop: '左侧粘性筛选栏',
  },
  {
    pattern: '商品栅格',
    mobile: 'grid-cols-2',
    desktop: 'sm:grid-cols-3 lg:grid-cols-4',
  },
  {
    pattern: '内容 + 侧栏',
    mobile: '单列布局',
    desktop: 'lg:grid-cols-[256px,1fr]',
  },
];

export const dosAndDonts = [
  {
    topic: '颜色使用',
    doText: '使用 text-ink、bg-brand 等语义 Token。',
    dontText: '不要写 text-[#1a1a1a] 这类硬编码颜色。',
  },
  {
    topic: '响应式顺序',
    doText: '先写 base，再用 sm/md/lg 逐级增强。',
    dontText: '不要先写桌面再用 max-md 回补移动端。',
  },
  {
    topic: '交互触达面积',
    doText: '可操作控件至少保持 44x44。',
    dontText: '不要上线触达面积过小的纯图标操作。',
  },
  {
    topic: '布局一致性',
    doText: '所有页面顶层统一使用 PageContainer。',
    dontText: '不要在页面里重复手写容器类。',
  },
];

export const agentPromptGuide = {
  colorReference: [
    '主 CTA：bg-brand text-brand-foreground',
    '可读正文：text-ink-muted body-text',
    '区块背景分层：bg-surface / bg-surface-muted',
    '错误提示文本：text-destructive',
  ],
  promptTemplates: [
    '请基于 Mobile-First 构建商品卡片，只使用语义 Token，并保证最小触达面积 44px。',
    '请实现响应式筛选面板：lg 以下使用抽屉，lg 及以上使用左侧粘性栏。',
    '请设计一个内容区块，使用标题层级和 body-text，不要出现硬编码颜色。',
    '请重构此组件，移除 max-md 的 desktop-first 写法，按 base->sm->md->lg 顺序组织。',
  ],
};
