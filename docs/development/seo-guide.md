# SEO 专题文档

## 1. 目标与范围

本文档说明 `Prism` 项目当前 SEO 的实现方式、已覆盖范围、仍待改进项，以及后续如何验收 SEO 质量。

当前这一轮 SEO 的重点范围是：

- `blog` 模块
- `recipes` 模块
- 页面级 metadata
- Open Graph / Twitter 标签
- JSON-LD 结构化数据
- `robots.txt`
- `sitemap.xml`

当前实现并不是“全站 SEO 完成版”，而是先把内容型页面最关键的搜索入口补齐。

## 2. 当前 SEO 是怎么做的

### 2.1 全站基础能力

全站 SEO 的基础能力分两层：

1. 根布局提供站点级基础 metadata
2. 各业务页面补充页面级 metadata 与结构化数据

页面路由基于 Next.js App Router，SEO 能力主要使用 Next 原生能力实现：

- `metadata`
- `generateMetadata`
- `robots.ts`
- `sitemap.ts`

站点 URL 基准依赖 `NEXT_PUBLIC_APP_URL`，该值会影响：

- canonical URL
- `openGraph.url`
- `sitemap.xml`
- `robots.txt` 中的 host / sitemap

相关实现集中在：

- `apps/prism/lib/seo.ts`
- `apps/prism/app/robots.ts`
- `apps/prism/app/sitemap.ts`

### 2.2 Metadata 统一封装

当前项目没有把 SEO 逻辑分散在每个页面里重复拼装，而是抽到了 `apps/prism/lib/seo.ts`。

这个文件主要负责：

- 统一生成 `title`、`description`
- 统一生成 canonical
- 统一生成 Open Graph
- 统一生成 Twitter card
- 统一生成文章与食谱的 schema
- 统一生成 breadcrumb schema

关键函数：

- `buildStaticMetadata()`
- `buildArticleMetadata()`
- `buildRecipeMetadata()`
- `buildArticleSchema()`
- `buildRecipeSchema()`
- `buildBreadcrumbSchema()`

实现细节：

- `absoluteUrl()` 使用 `env.NEXT_PUBLIC_APP_URL` 拼接绝对 URL
- `normalizeText()` 会把富文本里的 HTML 标签去掉，避免 description 直接带 HTML
- `truncate()` 会对 description 做长度控制
- `resolveImage()` 会把 CMS 图地址处理成可用于 OG 的图片 URL

### 2.3 Blog 页面 SEO

#### 已覆盖页面

- `apps/prism/app/blog/page.tsx`
- `apps/prism/app/blog/[category]/page.tsx`
- `apps/prism/app/blog/[category]/[slug]/page.tsx`

#### 具体做法

`/blog`

- 使用静态 `metadata`
- 适合品牌入口页和聚合页

`/blog/[category]`

- 使用 `generateMetadata`
- 根据路由参数动态生成分类页标题和描述

`/blog/[category]/[slug]`

- 服务端拉取文章详情
- 根据文章真实分类生成 canonical
- 输出文章页 metadata
- 输出 `BlogPosting` schema
- 输出 `BreadcrumbList` schema
- 当 URL 里的 category 与文章真实分类不一致时，执行服务端 `redirect()` 到正确路径

这一点很重要，因为它保证了：

- 用户访问旧路径或错误分类路径时，不会保留错误 canonical
- 搜索引擎抓取到的详情页 URL 更稳定

### 2.4 Recipes 页面 SEO

#### 已覆盖页面

- `apps/prism/app/recipes/page.tsx`
- `apps/prism/app/recipes/[category]/[slug]/page.tsx`

#### 具体做法

`/recipes`

- 使用静态 `metadata`
- 作为食谱主入口页

`/recipes/[category]/[slug]`

- 服务端拉取食谱详情
- 根据食谱真实分类生成 canonical
- 输出食谱详情页 metadata
- 输出 `Recipe` schema
- 输出 `BreadcrumbList` schema
- category 不匹配时做服务端重定向

食谱页的 description 还额外拼接了耗时信息，例如 `Ready in 3 minutes.`，让搜索摘要更像内容结果页而不是普通列表页。

### 2.5 Schema 结构化数据

当前已经输出的结构化数据：

- Blog 详情页：`BlogPosting`
- Recipe 详情页：`Recipe`
- 两类详情页：`BreadcrumbList`

Schema 数据来源全部来自现有详情接口，不额外造数据层。

这套方式的优点是：

- 与页面真实内容保持一致
- 不容易出现 schema 和页面内容不一致
- 后续维护成本低

### 2.6 Sitemap 与 Robots

#### `robots.txt`

实现文件：`apps/prism/app/robots.ts`

当前职责：

- 允许公开内容路径被抓取
- 屏蔽内部或无索引价值路径
- 暴露 `sitemap.xml`
- 输出站点 host

#### `sitemap.xml`

实现文件：`apps/prism/app/sitemap.ts`

当前会收录：

- `/`
- `/blog`
- `/recipes`
- blog 分类页
- blog 详情页
- recipe 详情页

当前实现已经补上了这几件关键事情：

- article / recipe 改为分页抓取，不再只依赖第一页结果
- 只收录合法 slug 对应的 URL
- 只收录带真实主分类的详情页 canonical URL
- 不再把 `/blog/all/...`、`/recipes/all/...` 这类 fallback 详情页 URL 放进 sitemap
- 会对最终 URL 去重并稳定排序
- 数据源失败时会记录日志，而不是静默吞掉

并为每类 URL 设置：

- `lastModified`
- `changeFrequency`
- `priority`

### 2.7 数据更新策略

SEO 页面并不是纯静态，而是内容驱动页面，所以当前策略是：

- `revalidate = 3600` 作为 ISR 兜底
- 主要依赖 On-Demand Revalidation 在 CMS 发布后刷新页面

相关背景文档：

- `docs/on-demand-revalidation-design.md`

这意味着：

- 页面级 SEO 标签不是写死的
- 它们跟随 CMS 内容变化更新
- 生产环境里 SEO 质量不仅取决于前端实现，也取决于 CMS 内容质量

## 3. 当前已完成的 SEO 能力清单

目前可以认为已经落地的能力有：

- blog 首页 metadata
- blog 分类页 metadata
- blog 详情页 metadata
- blog 详情页 OG / Twitter
- blog 详情页 `BlogPosting` schema
- blog 详情页 `BreadcrumbList` schema
- recipes 首页 metadata
- recipe 详情页 metadata
- recipe 详情页 OG / Twitter
- recipe 详情页 `Recipe` schema
- recipe 详情页 `BreadcrumbList` schema
- `robots.txt`
- `sitemap.xml`
- sitemap 分页抓取 article / recipe 内容
- sitemap slug 合法性过滤
- sitemap canonical URL 过滤（不收录 `/all` fallback 详情页）
- sitemap URL 去重与稳定排序
- sitemap 数据源异常日志输出
- canonical URL 生成
- category 错误路径自动重定向到规范 URL
- 公共 SEO 工具抽取与复用

## 4. 当前还存在哪些待改进项

### 4.1 Sitemap 质量仍需继续加强

这一项已经完成了第一轮高优先级收口，但还没有到“长期免维护”的程度。

这一轮已解决：

- `sitemap.xml` 已改为分页抓取 article / recipe 内容
- 已增加 slug 合法性过滤
- 已增加 URL 去重
- 已限制只收录带真实主分类的详情页 canonical URL
- 已补上错误日志，避免数据源失败时静默变空

当前仍值得继续关注的问题：

- 仍然主要依赖 CMS / 搜索接口返回数据本身的质量
- 目前的 slug 过滤规则偏保守，后续如果 CMS 规则变化需要同步评估
- 还没有专门的“测试数据 / 占位内容”识别规则
- 还没有把 sitemap 验证接入更正式的线上巡检流程

建议继续改进：

- 根据实际内容库补充更细的脏数据识别规则
- 结合生产数据观察是否需要进一步限制或放宽 slug 规则
- 把 sitemap 校验加入上线后的例行验收
- 明确哪些新增页面未来应该进入 sitemap，哪些继续排除

### 4.2 CMS 内容质量会直接影响 SEO 结果

当前前端已经做了基础清洗，例如去 HTML、截断 description，但无法完全修复源内容问题。

实际风险包括：

- description 含异常字符
- 内容里混入测试文本
- 标题、摘要、分类名本身质量不足
- 图片缺失或图片 alt 质量差

这类问题不是前端 SEO 代码能彻底解决的，需要 CMS 内容治理配合。

### 4.3 本地环境 URL 与生产 URL 需要严格区分

当前 canonical、sitemap、robots 都依赖 `NEXT_PUBLIC_APP_URL`。

如果该值配置错误，会直接导致：

- canonical 指向错误域名
- `sitemap.xml` 输出错误域名
- `robots.txt` 中的 sitemap 地址错误

所以环境变量正确性本身就是 SEO 验收的一部分。

### 4.4 覆盖范围还可以继续扩展

当前已经优先覆盖高价值页面，但仍可考虑第二阶段扩展：

- `recipes` 分类聚合页（如果后续新增此路由）
- 更多静态页的 metadata 细化
- 更细的 social image 策略
- `WebSite` / `Organization` 级别 schema
- 搜索结果页是否要索引的策略

## 5. 我应该如何理解这个项目 SEO 的工作方式

可以把当前项目 SEO 理解为三层：

### 第一层：页面标签层

目标是让每个核心页面都有自己的：

- `title`
- `description`
- canonical
- OG
- Twitter

这一层决定搜索结果页和社交分享的基本表现。

### 第二层：结构化数据层

目标是让搜索引擎更容易理解页面内容类型。

当前：

- 文章页告诉搜索引擎“这是 BlogPosting”
- 食谱页告诉搜索引擎“这是 Recipe”
- 同时补充 breadcrumb 语义

这一层影响富结果理解能力。

### 第三层：抓取与索引入口层

目标是让搜索引擎找到页面，并按规范路径理解页面。

当前主要依赖：

- `robots.txt`
- `sitemap.xml`
- canonical
- 正确分类路径的 redirect

这一层影响抓取入口和 URL 规范化。

## 6. 我自己应该如何验收这个 SEO 的质量

建议把验收分成三类：实现正确、内容正确、索引质量正确。

### 6.1 实现正确性验收

这是第一层验收，判断功能有没有真正生效。

重点检查页面：

- `/blog`
- `/blog/[category]`
- `/blog/[category]/[slug]`
- `/recipes`
- `/recipes/[category]/[slug]`
- `/robots.txt`
- `/sitemap.xml`

你需要确认：

- 页面源码里确实输出了 `title`
- 有 `meta name="description"`
- 有 canonical
- 有 `og:title`
- 有 `og:description`
- 有 `og:url`
- 有 `twitter:card`
- 详情页有 `application/ld+json`

本地最直接的看法：

1. 打开页面
2. 查看页面源代码，不只是 DevTools Elements
3. 搜索 `title`、`description`、`canonical`、`og:`、`application/ld+json`

也可以直接用命令行看：

```bash
curl -s http://127.0.0.1:3010/blog/some-category/some-slug | rg -o "<title[^>]*>.*</title>|<meta[^>]+(description|og:title|og:description|og:url|twitter:card)[^>]*>|<link[^>]+rel=\"canonical\"[^>]*>|<script type=\"application/ld\+json\">.*?</script>"
```

### 6.2 内容正确性验收

这是第二层验收，判断输出内容是不是“对的”。

重点检查：

- `title` 是否准确表达页面主题
- `description` 是否可读，是否被截断得合理
- canonical 是否是规范 URL
- OG 图片是否存在且合理
- schema 内容是否和页面正文一致
- 分类页与详情页 URL 是否一致

尤其要重点看：

- 错误分类访问时是否跳到真实分类路径
- description 有没有脏字符、测试文本、重复数字
- schema 中的标题、时间、图片、面包屑是否正确

### 6.3 抓取质量验收

这是第三层验收，判断搜索引擎是否会“正确发现并理解”页面。

你需要重点检查：

- `robots.txt` 是否暴露了正确的 sitemap 地址
- `sitemap.xml` 是否包含主要公开页面
- `sitemap.xml` 是否有脏 URL、错误 URL、重复 URL
- `sitemap.xml` 域名是否正确
- 不该收录的页面是否被排除
- `sitemap.xml` 是否已经覆盖分页后的内容，而不只是第一页数据
- 详情页 URL 是否只使用真实主分类，而不是 `/all` fallback

### 6.4 工具验收

除了本地查看源码，建议用外部工具再验一次。

推荐至少使用：

- Google Rich Results Test：验证 schema 是否可被识别
- Schema Validator：验证 JSON-LD 结构是否规范
- Search Console：后续线上看抓取、索引、Enhancements
- Open Graph 调试工具：看社交分享抓取结果

注意：

- 本地通过，不代表线上通过
- 线上通过，也不代表内容质量足够好

## 7. 一份实用的验收清单

你可以按下面这份清单做验收。

### 页面级

- 每个目标页面都有独立 `title`
- 每个目标页面都有独立 `description`
- canonical 正确
- OG 标签存在且内容正确
- Twitter 标签存在且内容正确
- 页面间没有明显重复 metadata

### 详情页

- 文章详情页有 `BlogPosting` schema
- 食谱详情页有 `Recipe` schema
- 两类详情页都有 `BreadcrumbList`
- schema 字段与页面正文一致
- 错误 category URL 会重定向到规范路径

### 抓取入口

- `robots.txt` 正常返回
- `sitemap.xml` 正常返回
- sitemap 没有脏 URL
- sitemap 没有重复 URL
- sitemap 域名正确
- sitemap 已覆盖分页后的公开内容
- sitemap 不包含 `/blog/all/...`、`/recipes/all/...` 这类 fallback 详情页 URL

### 内容质量

- 标题不是 CMS 占位文案
- description 没有乱码、测试文本、异常字符
- 主图存在
- 分类与 URL 一致
- 页面正文不是薄内容

## 8. 后续建议怎么继续改进

如果要继续做下一轮优化，优先级建议如下：

1. 继续补内容治理规则，减少 CMS 脏数据直接进入 SEO 标签
2. 建立 sitemap 的线上巡检与验收流程，验证分页、去重和域名输出是否持续正确
3. 然后评估是否需要扩展更多路由或更完整的 schema 体系

当前阶段最值得继续投入的，不是再多写一层 metadata，而是把“已输出内容的质量”做扎实。

## 9. 相关代码入口

核心实现文件：

- `apps/prism/lib/seo.ts`
- `apps/prism/app/robots.ts`
- `apps/prism/app/sitemap.ts`
- `apps/prism/app/blog/page.tsx`
- `apps/prism/app/blog/[category]/page.tsx`
- `apps/prism/app/blog/[category]/[slug]/page.tsx`
- `apps/prism/app/recipes/page.tsx`
- `apps/prism/app/recipes/[category]/[slug]/page.tsx`

相关背景文档：

- `docs/on-demand-revalidation-design.md`

## 10. 结论

如果从“这一轮 blog + recipes SEO 基础建设”来看，这项工作已经基本完成。

如果从“可长期稳定支撑搜索增长的 SEO 体系”来看，还差两类关键收口：

- sitemap 质量治理
- CMS 内容质量治理

所以现在最准确的结论是：

- SEO 实现层已经基本完成
- SEO 质量层还需要继续打磨
