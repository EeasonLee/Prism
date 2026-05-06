---
name: 面包屑统一设计
description: 统一全站面包屑组件，覆盖 PC 与移动端，按页面类型分级，补充商品详情页与分类页的 BreadcrumbList Schema
type: design
---

# 面包屑统一设计 PRD

## 一、背景与目标

### 1.1 现状问题

当前项目面包屑处于各自为政的状态，存在 4 种不同实现：

| 页面        | 实现方式            | 移动端                 | 组件                       | BreadcrumbList Schema |
| ----------- | ------------------- | ---------------------- | -------------------------- | --------------------- |
| Blog 详情   | `<Breadcrumb>` 组件 | 有（Back to + 当前页） | `libs/blog/Breadcrumb.tsx` | 有                    |
| Recipe 详情 | 内联 HTML           | 有（Back to + 当前页） | 无，手写                   | 有                    |
| 分类页      | 内联 HTML           | **无**                 | 无，手写                   | **无**                |
| 商品详情    | 内联 HTML           | **无**                 | 无，手写                   | **无**                |

核心问题：

1. 4 种不同实现，无统一组件，维护成本高
2. 移动端体验不一致（分类页和商品详情无移动端面包屑）
3. 未使用设计系统 Token，硬编码 `text-gray-400/600/900`
4. JSON-LD BreadcrumbList Schema 输出不完整（分类页、商品详情页缺失）
5. 现有共享组件放在 `libs/blog`，语义上不属于 blog 域

### 1.2 设计目标

- **统一组件**：提取单一 `Breadcrumb` 组件到 `apps/jd-frontend/components/`
- **响应式覆盖**：桌面端完整路径 + 移动端折叠省略/横向滚动
- **设计 Token 化**：全部使用 `text-ink` / `text-ink-muted` / `text-ink-faint`
- **SEO 补齐**：所有目标页面输出 `BreadcrumbList` JSON-LD
- **渐进迁移**：逐页面替换，不影响现有功能

### 1.3 覆盖范围（按页面类型分级）

| 页面        | 面包屑路径                         | 优先级 |
| ----------- | ---------------------------------- | ------ |
| Blog 详情   | `Blog / Category / Article`        | P0     |
| Recipe 详情 | `Recipes / Category / Recipe`      | P0     |
| 分类页      | `Home / Shop / Category`           | P0     |
| 商品详情    | `Home / Shop / Category / Product` | P0     |

静态页（About、Contact 等）不需要面包屑。

---

## 二、组件设计

### 2.1 组件位置

```
apps/jd-frontend/components/Breadcrumb.tsx
```

放在 app 层而非 `libs/ui`，因为面包屑仅此 app 使用，不涉及跨项目复用。

### 2.2 Props API

```typescript
interface BreadcrumbItem {
  /** 显示文本 */
  label: string;
  /** 链接地址，最后一项不传（当前页） */
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}
```

**行为约定：**

- `items` 数组最后一项自动视为当前页：无链接、加粗、`aria-current="page"`
- 空数组或 `undefined` → `return null`
- 组件只负责 UI 渲染，**不输出 Schema**

### 2.3 响应式行为

| 场景         | 桌面端 (≥768px)           | 移动端 (<768px)     |
| ------------ | ------------------------- | ------------------- |
| items ≤ 2 项 | 完整路径：`A / B`         | 同桌面              |
| items ≥ 3 项 | 完整路径：`A / B / C / D` | 折叠态：`A / … / D` |

**移动端交互流程：**

1. 默认显示折叠态：`首项 / … / 当前项`
2. `…` 为可点击按钮，点击后切换为展开态：完整路径横向滚动，自动滚动到末尾（当前页可见）
3. 展开态下可点击任意祖先链接跳转
4. （不在本期范围，后续迭代）点击面包屑区域外部或再次点击 `…` 收起为折叠态

### 2.4 视觉规范

| 元素       | 样式                                 |
| ---------- | ------------------------------------ |
| 分隔符     | `/`（统一）                          |
| 链接文字   | `text-ink-muted`，hover → `text-ink` |
| 当前页     | `text-ink font-medium`               |
| 分隔符颜色 | `text-ink-faint`                     |
| 字号       | `text-sm`（14px）                    |
| 触控区域   | 最小 44×44px（移动端）               |
| 容器       | `flex items-center gap-2 flex-wrap`  |
| 桌面显示   | `hidden md:flex`（完整路径）         |
| 移动端折叠 | `flex md:hidden`（折叠/滚动）        |

### 2.5 可访问性

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="...">Home</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="...">Shop</a></li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">Current</li>
  </ol>
</nav>
```

- `aria-label="Breadcrumb"` 标识导航区域
- `aria-current="page"` 标识当前页
- `aria-hidden="true"` 隐藏分隔符（屏幕阅读器不需要）
- `focus-visible:outline` 保留键盘焦点样式

---

## 三、数据源策略（混合式）

### 3.1 各页面数据获取方式

| 页面        | 数据来源 | 获取路径                                                |
| ----------- | -------- | ------------------------------------------------------- |
| Blog 详情   | Strapi   | `article.categories[0]` + 硬编码 "Blog" 根节点          |
| Recipe 详情 | Strapi   | `recipe.categories[0]` + 硬编码 "Recipes" 根节点        |
| 分类页      | Magento  | `categoryService.getCategoryDetail(id).breadcrumbs`     |
| 商品详情    | Magento  | `product.categories[0]` + 硬编码 "Home" / "Shop" 根节点 |

### 3.2 数据转换约定

各页面在服务端将原始数据转换为统一的 `{ label, href }[]`：

```typescript
// 示例：商品详情页
const breadcrumbItems = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  ...(product.categories?.[0]
    ? [
        {
          label: product.categories[0].name,
          href: `/categories/${product.categories[0].url_key}`,
        },
      ]
    : []),
  { label: product.display_name }, // 当前页，无 href
];
```

### 3.3 现有组件迁移

- `libs/blog/src/components/Breadcrumb.tsx` → **删除**，改为从 `@/components/Breadcrumb` 导入
- `libs/blog/src/index.ts` → 移除 Breadcrumb 导出
- 各页面内联面包屑 HTML → 替换为 `<Breadcrumb items={...} />`

---

## 四、SEO Schema 规范

### 4.1 组件与 Schema 分离

- 组件 `Breadcrumb` 只负责 UI，不输出 `<script>` 标签
- 各页面在服务端组件中同时输出 Schema + 渲染组件

### 4.2 Schema 输出

使用已有的 `buildBreadcrumbSchema()` in `apps/jd-frontend/shared/utils/seo.ts`：

```typescript
// 各页面中的使用模式
const breadcrumbSource = [
  { name: 'Blog', path: '/blog' },
  { name: category.name, path: `/blog/${category.slug}` },
  { name: article.title, path: `/blog/${category.slug}/${article.slug}` },
];
const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbSource);

// 输出
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify([breadcrumbSchema, articleSchema]),
  }}
/>;
```

### 4.3 需要补齐的页面

- **分类页**：当前无 BreadcrumbList Schema，需补充
- **商品详情页**：当前无 BreadcrumbList Schema，需补充

---

## 五、实施范围

### 5.1 新建文件

- `apps/jd-frontend/components/Breadcrumb.tsx` — 统一面包屑组件

### 5.2 修改文件

| 文件                                                         | 改动                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| `apps/jd-frontend/app/blog/[category]/[slug]/page.tsx`       | 替换导入路径，`@prism/blog` → `@/components/Breadcrumb` |
| `apps/jd-frontend/features/recipe/RecipeDetail.tsx`          | 内联面包屑 → `<Breadcrumb>`                             |
| `apps/jd-frontend/features/category/CategoryPageContent.tsx` | 内联面包屑 → `<Breadcrumb>`，补充移动端                 |
| `apps/jd-frontend/app/products/[slug]/page.tsx`              | 内联面包屑 → `<Breadcrumb>`，补充移动端                 |
| `libs/blog/src/components/index.ts`                          | 移除 Breadcrumb 导出                                    |
| `libs/blog/src/index.ts`                                     | 移除 Breadcrumb 导出                                    |

### 5.3 删除文件

- `libs/blog/src/components/Breadcrumb.tsx`

---

## 六、验证标准

### 6.1 功能验证

- [ ] 所有 4 类页面（Blog / Recipe / 分类 / 商品）桌面端显示完整面包屑
- [ ] 所有页面移动端（320px-428px）显示折叠面包屑
- [ ] 移动端点击 "…" 展开为横向滚动完整路径
- [ ] 面包屑各链接可点击跳转
- [ ] 空 items 时不渲染任何内容

### 6.2 SEO 验证

- [ ] 所有 4 类页面源码中存在 `<script type="application/ld+json">`
- [ ] JSON-LD 中包含 `BreadcrumbList`，`@type: "ListItem"` 的 `position` 正确递增
- [ ] `item` 字段为绝对 URL（`https://www.joydeem.com/...`）

### 6.3 可访问性验证

- [ ] `<nav aria-label="Breadcrumb">` 存在
- [ ] 当前页有 `aria-current="page"`
- [ ] 分隔符有 `aria-hidden="true"`
- [ ] 键盘 focus 可见

### 6.4 视觉验证

- [ ] 全局无硬编码 `text-gray-*`，全部使用 token（`text-ink-muted` / `text-ink` / `text-ink-faint`）
- [ ] 分隔符统一为 `/`
- [ ] 移动端触控区域 ≥ 44×44px
- [ ] 响应式断点：320px / 375px / 768px / 1280px 均正常
