Q&A 结构 · 可长期维护的 CMS 页面配置系统设计
CMS 页面配置系统（Strapi + Next.js）设计 Q&A 总结
本文以 Q&A 形式系统性总结 CMS 页面配置系统中
Page / Section / Schema / 组件演进 / 预览能力等核心设计问题。目标：可维护、可演进、不写屎代码

Q1：sections 在 Strapi 里到底是什么？是数组 + 下拉吗？
不是普通数组字段，也不是 JSON + 下拉选项。
正确答案
sections 在 Strapi 中应设计为 Dynamic Zone（动态模块容器）
Dynamic Zone 的本质是：
● 一个 只能从白名单中选择的模块数组
● 每个模块都有自己独立的 Schema（字段定义）
正确结构
Page Content Type - slug - seo - sections（Dynamic Zone） - publishAt - unpublishAt
Dynamic Zone 中允许的组件例如：
●HeroBanner
●ImageTextBlock
●ProductCarousel
●FAQSection

Q2：运营在 CMS 里实际是怎么配置 sections 的？
运营不是在「选字符串」，而是在「插入模块实例」。
运营真实操作流程 1.点击「Add component」 2.选择模块类型（如 HeroBanner） 3.填写该模块专属表单字段 4.支持：
a.排序
b.删除
c.启用 / 禁用（可选）
明确禁止的能力
●❌ 自定义 CSS
●❌ 自由 HTML
●❌ 富文本自由排版
●❌ 拖拽画布（第一期）
页面不是设计稿，而是 结构化模块组合

Q3：HeroBanner 这种 Section 后期功能变更怎么维护？
核心结论（铁律）
Section 必须版本化，禁止破坏性修改

错误做法（禁止）
直接在原 HeroBanner 上不断加字段：
HeroBanner { title? subtitle? image? video? cta? theme? } 后果：
● 老页面数据不完整
● 组件内部大量 if
● 技术债不可控

正确做法（工业级）
Strapi 层面
新增组件，而不是修改旧组件：
●page.hero-banner-v1 page.hero-banner-v2 V1：历史页面继续使用
●V2：新页面使用
●V1 可标记 Deprecated
Next.js 层面
const blockMap = { heroBannerV1: HeroBannerV1, heroBannerV2: HeroBannerV2, }
好处
● 老数据不迁移
● 新需求不受历史包袱
● 组件保持干净
● 技术债可控

Q4：Section 越来越多版本会不会很重？
是的，但这是正确的。
原因：
● 页面是“历史产物”
● 活动页本身不是长期演进对象
●CMS 页面 ≠ 组件库
你维护的是页面系统，不是 UI Library

Q5：Next.js 应该如何渲染 sections 才不写成屎？
禁止的写法
if (section.type === 'hero') { ... } 或组件内部兜底兼容 CMS 数据。

正确写法：模块注册表
const blockMap = { heroBanner: HeroBanner, imageTextBlock: ImageTextBlock, productCarousel: ProductCarousel, } sections.map(section => { const Block = blockMap[section.type] if (!Block) return null return <Block {...section.props} /> }) 设计原则
● 渲染层不做业务判断
●type 不存在 = 配置错误
●React 组件只接收 设计好的 props

Q6：Design System 和 Section 是什么关系？
错误理解（危险）
Design System 决定页面结构

正确关系

Design System
↓（约束视觉）
基础组件（Button / Text / Grid）

Section Components（页面模块）
↓（组合）
Page Schema

结论
Design System 只约束视觉，不参与页面结构设计

Q7：sections 能不能支持预览？不然运营很懵逼
结论
必须支持预览，但不要一开始追求 100% 真实

推荐方案（最稳）
Next.js 驱动的真实渲染预览

Strapi（Draft 数据）
↓ Preview API
Next.js /preview
↓
真实 Section 渲染

关键点
● 不走 ISR / 缓存
● 使用同一套 Section 渲染逻辑
● 不是 mock，不是截图

运营看到的效果
● 结构正确
● 文案 / 图片真实
● 样式 ≈ 线上
对运营来说：90% 已足够

Q8：哪些预览方案应该避免？
明确禁止
●❌ CMS 内部假渲染组件
●❌ 自研 canvas 拖拽画布
●❌ 前端 mock renderer
原因：
维护两套渲染逻辑 = 系统必死

Q9：如何降低 CMS 表单配置的理解成本？
推荐做法（低成本）
●Section 增加用途描述
● 提供静态示例图
● 枚举字段写“人话”
○❌ variantA
○✅ 深色背景（促销）

Q10：最终可执行设计原则总结
1.Page Schema 是产品，不是数据结构
2.Section 是受控模块，不是自由组件
3.Section 必须版本化
4.Next.js 只做映射，不做理解
5.Design System 约束视觉，不参与结构 6.预览必须走真实前端渲染链路 7.宁可多组件，也不要一个万能组件

Q11：HeroBanner 为什么会有三层 Schema？是不是维护成本太高？
问题背景
HeroBanner 同时存在三层 Schema：
●CMS Schema（Strapi Component）
●Domain Schema（前端 / BFF 层）
●React Props（组件接口）
这意味着一次升级可能涉及多个地方，是否会导致维护成本过高，甚至堆成屎山？

结论先行
三层 Schema 是刻意设计的“可控冗余”，
不是屎山来源。
真正会导致系统腐烂的不是多 Schema，而是：
● 一个万能 Schema
● 破坏性修改旧 Schema
● 把 CMS 当成唯一权威

三层 Schema 的真实职责划分
1️⃣ CMS Schema（Strapi）
定位：表单生成器
负责：
● 字段结构
● 字段类型
● 枚举值
● 基础校验
● 面向运营的字段说明
不负责：
● 业务逻辑
● 跨字段规则
● 渲染行为
● 系统级约束
Strapi 只管「能不能填」，不管「怎么用」。

2️⃣ Domain Schema（前端 / BFF）
定位：系统真实约束（Single Source of Truth）
负责：
● 数据完整性校验
●Schema 版本冻结
● 防止脏数据进入渲染层
● 解耦 CMS 实现
特点：
● 权威
● 稳定
● 可迁移（未来可替换 CMS）

3️⃣ React Props
定位：组件 API
原则：
● 最稳定的一层
● 不应频繁变化
● 若频繁变化，说明 Section 设计本身有问题
Props 不稳定，本身就是设计失败信号。

Q12：HeroBanner 多版本（V1 / V2 / Vn）会不会堆成屎？
结论
不会，只要遵守“冻结 + 增量”原则。
真正的屎山来源不是版本多，而是：
● 旧版本还在不断加能力
● 新版本反向兼容旧版本
● 所有版本互相污染

正确的版本演进模型
HeroBannerV1（frozen） HeroBannerV2（active） HeroBannerV3（future）
●frozen：不新增能力，只修 bug
●active：当前推荐使用
●deprecated：禁止新页面使用
旧页面允许“活着”，但不允许“继续进化”。

HeroBanner 升级的正确流程 1.新增 Strapi Component（不改旧的） 2.新增 Domain Schema 3.新增 React 组件
4.blockMap 注册新版本 5.旧版本保持冻结
永远不做破坏性修改。

Q13：三层 Schema 会不会导致“改一处要改三处”？
关键认知纠偏
90% 的修改只发生在一层，而不是三层同时变化。
实际变化分布
●React Props：几乎不该频繁改
●Domain Schema：新增版本，而不是覆盖
●CMS Schema：新增组件为主，复制成本低
维护成本主要来自：
● 决策
● 纪律
● 版本管理
而不是写代码本身。

Q14：如何防止 Schema 系统长期演进后失控？
必须遵守的工程纪律
1️⃣ 单向依赖
Strapi Schema ← Domain Schema ← React Props 禁止反向驱动设计。

2️⃣ 版本冻结策略（写进规范）
● 旧版本不新增字段
● 新需求只能进新版本
● 禁止“顺手改一下老组件”

3️⃣ 拒绝 DRY 合并版本
“V1 和 V2 差不多，合一下吧”
是屎山诞生的起点。
Q15：在什么阶段可以简化版本机制？
现实建议（非教条）
如果满足以下条件：
● 页面数量 < 20
●Section < 6
●MVP / 个人项目阶段
可以：
● 不显式标 V1 / V2
● 但必须遵守 “冻结约定”
例如：
●HeroBanner（冻结）
●HeroBannerV2（新增）
简化的是形式，不是原则。

终极判断标准
如果未来要做 A/B 测试、个性化推荐、AI 自动生成页面，
当前 Section Schema 能否直接复用？能 → 架构是对的
不能 → Schema 已经腐烂

最终系统级总结
维护成本不是来自多版本，
而是来自你不愿意放弃让旧东西继续进化。
只要允许历史页面“冻结存在”，
Schema 系统天然是稳定的。
