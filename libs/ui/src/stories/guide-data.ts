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
