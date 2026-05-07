# 清理 shop 模块并迁移到 categories 入口

> **日期**：2026-05-07
> **状态**：设计阶段
> **背景**：项目未上线，shop 为历史入口，categories 为新入口，直接替换即可

---

## 一、背景

- `apps/jd-frontend/app/shop/` 为历史遗留的商品浏览入口（全部商品 + 分类商品）
- `apps/jd-frontend/app/categories/` 为新的入口，功能更完善（Suspense 流式渲染、客户端无限滚动、面包屑、分类介绍等）
- 两者功能重叠，需要清理 shop 模块，统一使用 categories 入口
- 项目未上线，无需考虑 SEO 过渡或向后兼容

---

## 二、改动范围

### 2.1 删除目录

```
apps/jd-frontend/app/shop/          # 整个目录删除（page.tsx + [slug]/page.tsx）
```

### 2.2 路由重定向（next.config.ts）

```
/shop           → /categories        (308 Permanent Redirect)
/shop/:slug     → /categories/:slug  (308 Permanent Redirect)
```

### 2.3 代码引用更新（11 处）

所有 `/shop` 引用改为 `/categories`：

| 文件                                               | 改动                                             |
| -------------------------------------------------- | ------------------------------------------------ |
| `features/navigation/nav-config.ts`                | href `/shop` → `/categories`，match pattern 更新 |
| `app/_ui/Header.tsx`                               | 兜底菜单 url `/shop` → `/categories`             |
| `app/categories/[slug]/CategoryPageContent.tsx`    | 面包屑 Shop 链接 `/shop` → `/categories`         |
| `features/category/components/CategorySidebar.tsx` | "All Products" 链接 `/shop` → `/categories`      |
| `app/products/[slug]/page.tsx`                     | 面包屑 Shop 链接 `/shop` → `/categories`         |
| `app/cart/page.tsx`                                | "Continue shopping" `/shop` → `/categories`      |
| `app/account/wishlist/page.tsx`                    | "Start shopping" `/shop` → `/categories`         |
| `features/cms-page/components/DealCategoryNav.tsx` | `/shop/${key}` → `/categories/${key}`            |

---

## 三、不改的内容

- `app/categories/` 现有代码不做功能改动
- `app/api/categories/` API 路由保持不变
- 不需要新增 `/categories` 全部商品列表页（方案 B 选择）

---

## 四、实施步骤

1. 删除 `apps/jd-frontend/app/shop/` 整个目录
2. 在 `next.config.ts` 添加 `redirects()` 配置
3. 更新 8 个文件中的 `/shop` → `/categories` 引用
4. 运行 `pnpm typecheck && pnpm lint` 确保无错误
5. 运行 `pnpm test` 确保测试通过

---

## 五、验证标准

- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 单元测试通过
- [ ] `/shop` 和 `/shop/:slug` 返回 308 重定向
- [ ] 所有页面中不再出现 `/shop` 引用（除 redirects 配置外）
