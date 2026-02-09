CMS 页面配置系统开发方案（首页 / 活动页）

1. 背景与目标
   1.1 背景
   当前电商官网的首页、活动页、落地页存在以下问题：
   ● 页面结构固定，运营改版依赖前端
   ● 活动页复用率低，维护性差，易出错
   ● 页面样式和布局难以统一规范
   需要引入一套 可配置、可扩展、可控的 CMS 页面系统，以支持运营人员独立完成页面搭建，同时保证技术可维护性。

1.2 建设目标
构建一套 CMS 页面配置系统，用于：
● 首页
● 活动页 / 落地页 -（后续可扩展到频道页、专题页）实现目标：
● 运营可配置页面结构与内容
● 前端保持页面样式与品牌一致性
● 页面具备良好的 SEO 与性能
● 架构可长期演进，不引入技术债

2. 核心设计原则（重要）
   2.1 页面不是自由排版，而是结构化组合
   ●❌ 不做富文本自由排版
   ●❌ 不允许运营自定义 CSS / 样式
   ●❌ 不引入低代码拖拽画布
   ●✅ 页面由预定义模块组合
   ●✅ 运营只能选择模块、填写内容、调整顺序
   ●✅ 所有视觉规则由前端统一控制

2.2 技术核心不是 CMS，而是 Schema
本系统的核心不是 CMS 工具，而是 页面 Schema 设计
CMS 只是 Schema 的录入工具
Next.js 是 Schema 的渲染引擎

3.系统整体架构
运营人员
│
▼
Strapi CMS（页面配置 / 内容管理）
│
▼
Next.js BFF（页面数据聚合）
│
▼
前端页面渲染（SSR / ISR）

4. 页面模型设计（Schema）
   4.1 页面抽象模型
   所有 CMS 页面（首页 / 活动页）共用统一模型。
   Page {
   id: string
   slug: string
   seo: SEO
   sections: Section[]
   publishAt: datetime
   unpublishAt: datetime
   }

4.2 Section（页面模块）
Section {
type: string // 模块类型
props: object // 模块配置
dataRefs?: string[] // 关联业务数据（如商品 ID）
}

4.3 示例 Schema（活动页）

{
"slug": "summer-sale",
"sections": [
{
"type": "heroBanner",
"props": {
"title": "Summer Sale",
"subtitle": "Up to 50% off",
"theme": "dark"
}
},
{
"type": "productCarousel",
"dataRefs": ["sku_1", "sku_2", "sku_3"]
}
]
}

5. CMS（Strapi）设计方案
   5.1 Content Type：Page
   字段 类型 说明
   slug string 页面访问路径
   seo component SEO 配置
   sections Dynamic Zone 页面模块
   publishAt datetime 上线时间
   unpublishAt datetime 下线时间

5.2 Dynamic Zone（模块列表）
允许的模块类型（第一期）：
模块 用途
HeroBanner 页面头部主视觉
ImageTextBlock 图文介绍
ProductCarousel 商品推荐
PromoGrid 活动卡片
Countdown 活动倒计时
FAQSection 常见问题
⚠️ CMS 中 只允许配置这些模块

5.3 运营配置边界
能力 是否支持
模块排序 ✅
模块开关 ✅
内容编辑 ✅
自定义样式 ❌
自定义布局 ❌
插入 HTML ❌

6. 前端实现方案（Next.js）
   6.1 页面渲染流程

请求页面
↓
Next.js BFF 根据 slug 获取 Page Schema
↓
解析 sections
↓
按 type 映射 React 组件
↓
SSR / ISR 输出页面

6.2 模块注册机制
const blockMap = {
heroBanner: HeroBanner,
imageText: ImageTextBlock,
productCarousel: ProductCarousel,
}

sections.map(section => {
const Block = blockMap[section.type]
return <Block {...section.props} />
})

7. Design System 与组件库
   7.1 Design System 职责
   ● 字号体系
   ● 颜色 Token
   ● 间距与栅格
   ● 响应式规则
   Design System 不决定页面结构，只约束视觉表达。

7.2 组件库分层
基础组件（不暴露给 CMS）
●Button
●Text
●Grid
●Image
页面模块组件（CMS 可用）
●HeroBanner
●ProductCarousel
●PromoGrid
●ImageTextBlock

8. 渲染与缓存策略
   页面类型 渲染方式
   首页 ISR（短缓存）
   活动页 ISR / SSG
   落地页 ISR
   页面内容变更 → 自动重新生成 → CDN 分发

9. 为什么第一期不做拖拽编辑
   原因说明：
   ●Schema 尚未稳定
   ● 模块数量有限
   ● 拖拽会显著提高维护成本
   ● 表单式配置已满足 80% 运营需求
   规划策略：
   先结构化配置，后可视化增强

10. 第一阶段交付范围（MVP）
    包含
    ●Page Schema 设计
    ●6–8 个核心页面模块
    ●Strapi 页面配置能力
    ●Next.js 页面渲染
    ● 首页 + 活动页落地
    不包含
    ● 拖拽编辑器
    ● 自定义样式
    ● 页面级脚本注入

11. 方案价值总结
    ● 降低页面开发成本
    ● 提升运营效率
    ● 页面结构标准化
    ● 架构可长期演进
    ● 为 AI / 个性化推荐预留空间

12. 结论
    本方案不是低代码工具，而是一套：
    “受控自由度的 CMS 页面配置系统”
    在保证运营效率的同时，最大限度降低技术复杂度与长期维护风险。
