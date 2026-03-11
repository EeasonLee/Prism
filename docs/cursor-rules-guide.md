# Cursor Rules 使用指南

> 本文档说明 Prism 项目中已安装的 Cursor AI Rules 及其使用方式。

## 什么是 Cursor Rules？

Cursor Rules 是 Cursor IDE 的 AI 上下文配置文件（`.mdc` 格式），用于引导 AI 助手遵循项目的编码规范、架构约定和最佳实践。通过设置 Rules，AI 生成的代码将自动符合团队标准，无需在每次对话中重复说明背景。

Rules 文件存放在项目根目录的 `.cursor/rules/` 目录下。

---

## 已安装的 Rules 清单

| 文件名                      | 描述                                           | 触发范围                        |
| --------------------------- | ---------------------------------------------- | ------------------------------- |
| `nextjs-react-tailwind.mdc` | Next.js App Router + React + Tailwind 全栈规范 | `**/*.{ts,tsx,js,jsx}`          |
| `typescript.mdc`            | TypeScript 严格模式和类型安全最佳实践          | `**/*.{ts,tsx}`                 |
| `react.mdc`                 | React 19 组件架构、Hooks 规范、性能优化        | `**/*.{ts,tsx}`                 |
| `tailwind.mdc`              | Tailwind CSS 设计系统配置和组件抽象            | `**/*.{css,html,jsx,tsx}`       |
| `zustand.mdc`               | Zustand 状态管理分片模式和中间件               | `**/*.{ts,tsx}`                 |
| `ui-ux.mdc`                 | Shadcn UI + Radix UI + 可访问性规范            | `**/*.tsx`                      |
| `zod-validation.mdc`        | Zod v4 + React Hook Form 表单验证              | `**/*.{ts,tsx}`                 |
| `project-structure.mdc`     | Prism Nx Monorepo 项目结构规范                 | `**/*.{ts,tsx,json}` (始终应用) |

### Rules 来源

所有 Rules 均来自以下官方和社区维护的知名仓库，经过广泛验证：

- **[PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules)** - GitHub 上最受欢迎的 Cursor Rules 集合（30k+ stars）
- **[sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc)** - 专为 MDC 格式优化的规则库，覆盖 240+ 技术栈
- **[cursor.directory](https://cursor.directory/rules)** - Cursor 官方规则目录

---

## Cursor Rules 工作原理

### MDC 文件结构

每个 `.mdc` 文件包含两个部分：

```markdown
---
description: 规则描述（AI 使用时参考）
globs: **/*.{ts,tsx}      # 匹配的文件类型
alwaysApply: false         # 是否始终应用
---

# 规则内容

规则的具体指导内容...
```

### 三种激活方式

1. **自动附加（Auto Attach）**：当你编辑的文件匹配 `globs` 模式时，规则自动激活
2. **始终应用（Always Apply）**：`alwaysApply: true` 的规则在所有对话中始终生效
3. **手动引用（Manual）**：在 Cursor 对话中输入 `@rules` 或 `@ruleName` 手动引用

---

## 在 Cursor 中使用 Rules

### 方法一：直接提问（自动激活）

打开 TSX/TS 文件后，直接向 Cursor 提问。相关 Rules 会根据文件类型自动附加到上下文：

```
User: 帮我创建一个用户列表组件
```

Cursor 会自动参考 `react.mdc`、`typescript.mdc`、`ui-ux.mdc` 等规则生成符合规范的代码。

### 方法二：手动引用特定规则

在 Cursor Chat 中使用 `@` 引用特定规则：

```
User: @nextjs-react-tailwind 帮我创建一个 Next.js 的服务端渲染页面
User: @zustand 帮我实现用户认证的状态管理
User: @zod-validation 帮我为这个表单添加验证
```

### 方法三：查看所有规则

在 Cursor 中：

- 打开命令面板（`Ctrl+Shift+P` / `Cmd+Shift+P`）
- 搜索 `Cursor: View Rules`

---

## 各 Rules 使用场景

### `project-structure.mdc` - 项目结构规范

**始终生效**，适用于：

- 询问"新功能应该放在哪里"
- 创建新的页面、组件或服务
- 了解项目的 Nx 命令

```
Q: 我要创建一个可以在所有 app 中复用的 Banner 组件，应该放哪里？
A: (AI 会根据规则指导你放到 libs/ui/)
```

### `nextjs-react-tailwind.mdc` - 全栈开发规范

适用于：

- 创建 Next.js 页面或布局
- Server Components vs Client Components 的决策
- 数据获取模式

```
Q: 如何在 Next.js App Router 中实现服务端数据获取？
Q: 这个组件应该用 'use client' 吗？
```

### `react.mdc` - React 组件规范

适用于：

- 创建新组件
- 设计 Props 接口
- 选择状态管理方案

```
Q: 帮我重构这个组件，分离数据逻辑和 UI 渲染
Q: 这个 useEffect 的依赖数组对吗？
```

### `typescript.mdc` - TypeScript 规范

适用于：

- 定义类型和接口
- 处理未知类型
- API 响应类型定义

```
Q: 如何为这个 API 响应定义类型？
Q: 我应该用 type 还是 interface？
```

### `tailwind.mdc` - Tailwind CSS 规范

适用于：

- 创建响应式布局
- 实现深色模式
- 组件样式抽象

```
Q: 帮我实现一个移动端优先的响应式卡片组件
Q: 如何用 cva 实现按钮的多种变体？
```

### `zustand.mdc` - 状态管理

适用于：

- 创建新的 Zustand store
- 实现异步操作
- 优化 store 性能

```
Q: 帮我创建一个管理购物车状态的 Zustand store
Q: 如何防止 Zustand selector 导致不必要的重渲染？
```

### `ui-ux.mdc` - UI/UX 规范

适用于：

- 使用 Shadcn UI 组件
- 实现可访问性
- 表单 UI 设计

```
Q: 帮我用 Shadcn UI 实现一个带确认弹窗的删除按钮
Q: 这个表单的可访问性有问题吗？
```

### `zod-validation.mdc` - 表单验证

适用于：

- 创建表单验证 Schema
- API 路由请求验证
- 环境变量验证

```
Q: 帮我为用户注册表单创建 Zod Schema
Q: 如何在 Next.js API 路由中验证请求体？
```

---

## 自定义和扩展 Rules

### 修改现有 Rules

直接编辑 `.cursor/rules/` 目录下的 `.mdc` 文件即可。建议：

- 保留原始规则内容
- 在文件末尾添加项目特定的约定
- 注明修改来源和原因

### 创建新 Rules

```markdown
---
description: 你的规则描述
globs: **/*.{ts,tsx}
alwaysApply: false
---

# 规则标题

规则内容...
```

将文件保存到 `.cursor/rules/your-rule.mdc`。

### 规则优先级

多个规则同时激活时，Cursor 会将所有规则内容合并提供给 AI。规则之间不会相互冲突，而是互补。

---

## 推荐工作流

1. **开发新功能前**：浏览相关 Rules，了解规范要求
2. **生成代码时**：让 AI 自动应用规则，无需手动指定
3. **代码审查时**：参考 Rules 中的 ❌ BAD / ✅ GOOD 示例
4. **发现不符合规范的代码**：告诉 AI `@react 请按照 React 规范重构这段代码`

---

## 参考资源

- [Cursor Rules 官方文档](https://docs.cursor.com/context/rules-for-ai)
- [PatrickJS/awesome-cursorrules](https://github.com/PatrickJS/awesome-cursorrules) - 30k+ stars 的官方集合
- [sanjeed5/awesome-cursor-rules-mdc](https://github.com/sanjeed5/awesome-cursor-rules-mdc) - MDC 格式规则库
- [cursor.directory/rules](https://cursor.directory/rules) - 官方规则目录
- [cursor.directory/rules/popular](https://cursor.directory/rules/popular) - 最热门规则
