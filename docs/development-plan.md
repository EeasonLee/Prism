# Prism 架构重构与优化开发计划

## 📋 文档说明

本文档详细记录了 Prism 项目从当前状态到企业级架构的完整重构计划，包括目录结构优化、类型体系建立、规范强化、核心能力建设等。

**文档维护原则：**

- 每个阶段完成后更新状态
- 重大决策变更需记录 ADR（Architecture Decision Record）
- 与 `docs/plan.md` 保持同步

---

## 🎯 总体目标

### 核心原则

1. **写代码时就能发现 TS / Lint 错误** - 工具强制，不靠自觉
2. **新增业务不会影响旧模块** - 清晰的模块边界和依赖规则
3. **任何人都知道代码该放哪** - 明确的目录结构和规范文档
4. **规范不是靠自觉，而是靠工具** - ESLint、TypeScript、Git Hooks 三重保障
5. **你敢让别人接手这个项目** - 完善的文档、清晰的架构、可维护的代码

### 成功标准

- ✅ 所有 TypeScript 错误在开发时即可发现
- ✅ 所有 ESLint 规则为 `error` 级别，CI 零警告
- ✅ 模块边界清晰，依赖关系可追踪
- ✅ 新成员可在 1 天内理解项目结构并开始开发
- ✅ 代码审查清单化，审查效率提升 50%

---

## 📅 总体时间线

| 阶段                  | 时间     | 主要目标                            | 状态      |
| --------------------- | -------- | ----------------------------------- | --------- |
| **Phase 1: 基础架构** | Week 1-2 | 目录结构重构 + 基础规范             | ⏳ 待开始 |
| **Phase 2: 核心能力** | Week 3-6 | 请求/错误/权限 + 数据架构 + UI 解耦 | ⏳ 待开始 |
| **Phase 3: 业务集成** | Week 7-8 | Strapi 集成 + 测试完善              | ⏳ 待开始 |
| **Phase 4: 优化完善** | 持续     | 性能优化 + 监控 + 文档              | ⏳ 待开始 |

---

## Phase 1: 基础架构重构（Week 1-2）

### Week 1: 目录结构重构

#### 任务 1.1: 制定目标结构文档（Day 1）✅

**目标：** 明确目标目录结构，作为重构的"宪法"

**任务清单：**

- [x] 创建 `docs/architecture/directory-structure.md`
- [x] 定义每个目录的职责和放置规则
- [x] 绘制目录结构图（使用 Mermaid）
- [x] 说明目录命名规范

**验收标准：**

- 文档清晰说明每个目录的用途
- 包含示例代码说明如何组织文件
- 团队评审通过

**输出物：**

- `docs/architecture/directory-structure.md`

---

#### 任务 1.2: 建立路径别名体系（Day 1-2）✅

**目标：** 统一配置路径别名，为后续迁移做准备

**任务清单：**

- [x] 更新 `tsconfig.base.json` 路径配置
- [x] 更新 `apps/prism/tsconfig.app.json` 路径配置
- [x] 更新 `next.config.js` 路径别名（如需要）- 已确认 Nx 自动处理，无需额外配置
- [x] 验证别名在 IDE 中正常工作 - 类型检查通过
- [x] 创建路径别名使用规范文档

**路径别名配置：**

```json
{
  "paths": {
    // 共享库
    "@prism/shared/*": ["libs/shared/*"],
    "@prism/ui/*": ["libs/ui/*"],

    // 业务域库（动态）
    "@prism/blog/*": ["libs/blog/*"],
    "@prism/recipe/*": ["libs/recipe/*"],

    // 应用层（仅限 apps/prism 内部）
    "@/app/*": ["apps/prism/app/*"],
    "@/components/*": ["apps/prism/components/*"],
    "@/lib/*": ["apps/prism/lib/*"]
  }
}
```

**验收标准：**

- 所有路径别名在 TypeScript 中可正确解析
- IDE 自动补全正常工作
- 文档说明每个别名的使用场景

**输出物：**

- 更新的 `tsconfig.base.json`
- 更新的 `apps/prism/tsconfig.app.json`
- `docs/architecture/import-rules.md`

---

#### 任务 1.3: 创建 libs 目录结构（Day 2）✅

**目标：** 建立共享库的基础结构

**任务清单：**

- [x] 创建 `libs/shared/` 目录结构
- [x] 创建 `libs/ui/` 目录结构
- [x] 创建 `libs/blog/` 目录结构（示例业务域）
- [x] 为每个库创建 `project.json` 和 `tsconfig.json`
- [x] 配置 Nx 标签（tags）

**目录结构：**

```
libs/
├── shared/
│   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   ├── utils/
│   └── constants/
├── ui/
│   └── components/
└── blog/
    ├── api/
    ├── components/
    └── hooks/
```

**验收标准：**

- 所有库的 `project.json` 配置正确
- Nx 可以正确识别和构建这些库
- 类型检查通过

**输出物：**

- `libs/shared/` 目录及配置文件
- `libs/ui/` 目录及配置文件
- `libs/blog/` 目录及配置文件

---

#### 任务 1.4: 迁移共享代码到 libs/shared（Day 3）✅

**目标：** 将通用代码提取到共享库

**任务清单：**

- [x] 迁移 API 通用类型到 `libs/shared/api/types/`
- [x] 迁移通用工具函数到 `libs/shared/utils/`
- [x] 迁移常量到 `libs/shared/constants/`（暂无常量需要迁移）
- [x] 更新所有引用（使用新路径别名）
- [x] 运行类型检查和构建验证

**迁移内容：**

- API 响应类型（`ApiResponse<T>`, `PaginatedResponse<T>`）
- 错误类型定义
- 通用工具函数
- 常量定义

**验收标准：**

- 所有类型检查通过
- 构建成功
- 应用功能正常

**输出物：**

- `libs/shared/api/types/common.ts`
- `libs/shared/api/types/errors.ts`
- `libs/shared/utils/` 下的工具函数
- `libs/shared/constants/` 下的常量

---

#### 任务 1.5: 迁移业务代码到 libs（Day 4-5）

**目标：** 将业务代码按域拆分到独立库

**任务清单：**

- [x] 迁移 blog 相关代码到 `libs/blog/`
  - [x] API 类型和函数 → `libs/blog/api/`
  - [x] 组件 → `libs/blog/components/`
  - [x] Hooks → `libs/blog/hooks/`（待创建）
- [ ] 迁移 recipe 相关代码到 `libs/recipe/`
- [x] 更新所有引用（blog 相关）
- [ ] 验证模块边界规则（ESLint）

**验收标准：**

- 所有业务代码按域清晰分离
- 模块边界规则通过 ESLint 检查
- 应用功能正常

**输出物：**

- `libs/blog/` 完整结构
- `libs/recipe/` 完整结构

---

#### 任务 1.6: 创建 Import 路径迁移工具（Day 5）

**目标：** 自动化处理 import 路径转换

**任务清单：**

- [ ] 创建 `tools/migrate-imports.js` 脚本
- [ ] 实现相对路径到别名的转换逻辑
- [ ] 添加验证机制（转换后类型检查）
- [ ] 编写使用文档

**脚本功能：**

- 扫描所有 `.ts`、`.tsx` 文件
- 识别相对路径 import
- 转换为对应的路径别名
- 生成迁移报告

**验收标准：**

- 脚本可以正确转换常见情况
- 转换后类型检查通过
- 文档清晰说明使用方法

**输出物：**

- `tools/migrate-imports.js`
- `tools/README.md`（工具使用说明）

---

#### 任务 1.7: 执行 Import 路径迁移（Day 6-7）

**目标：** 将所有相对路径转换为路径别名

**任务清单：**

- [ ] 使用迁移工具批量转换
- [ ] 手动处理特殊情况
- [ ] 逐个模块验证（类型检查 + 功能测试）
- [ ] 提交代码（每个模块一个提交）

**迁移顺序：**

1. `libs/shared/`（无依赖）
2. `libs/blog/`、`libs/recipe/`（依赖 shared）
3. `apps/prism/`（依赖所有库）

**验收标准：**

- 所有 import 使用路径别名
- 无相对路径超过 2 层（`../../`）
- 类型检查通过
- 应用功能正常

**输出物：**

- 所有文件的 import 路径已更新

---

### Week 2: 基础规范强化

#### 任务 2.1: 建立 TS 类型体系（Day 1-2）

**目标：** 建立完整的类型定义体系

**任务清单：**

- [ ] 创建通用响应类型（`libs/shared/api/types/common.ts`）
  - [ ] `ApiResponse<T>`
  - [ ] `PaginatedResponse<T, M>`
  - [ ] `ApiErrorResponse`
- [ ] 创建错误类型体系（`libs/shared/api/types/errors.ts`）
- [ ] 创建类型工具函数（类型守卫、类型提取等）
- [ ] 更新现有 API 函数使用新类型
- [ ] 编写类型使用文档

**类型定义示例：**

```typescript
// libs/shared/api/types/common.ts
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T, M = unknown> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  } & M;
}
```

**验收标准：**

- 所有 API 函数使用统一的响应类型
- 类型定义清晰、可复用
- 文档说明如何使用

**输出物：**

- `libs/shared/api/types/common.ts`
- `libs/shared/api/types/errors.ts`
- `docs/architecture/typescript-standards.md`

---

#### 任务 2.2: 强化 ESLint 规则（Day 3）

**目标：** 将关键规则升级为 error，添加自定义规则

**任务清单：**

- [ ] 更新 `eslint.config.mjs`，将 `warn` 改为 `error`
  - [ ] `@typescript-eslint/no-explicit-any: error`
  - [ ] `@typescript-eslint/no-non-null-assertion: error`
- [ ] 添加新的严格规则
  - [ ] `@typescript-eslint/no-floating-promises: error`
  - [ ] `@typescript-eslint/await-thenable: error`
- [ ] 创建自定义规则（或使用规则配置）
  - [ ] 禁止在组件中直接调用 API
  - [ ] 强制使用路径别名（超过 2 层相对路径）
- [ ] 更新所有现有代码以符合新规则

**验收标准：**

- 所有规则为 `error` 级别
- 现有代码通过所有规则检查
- CI 零警告

**输出物：**

- 更新的 `eslint.config.mjs`
- 更新的 `apps/prism/eslint.config.mjs`
- 所有代码符合新规则

---

#### 任务 2.3: 强化 Git Hooks 和 CI（Day 4）

**目标：** 确保提交前和 CI 中严格检查

**任务清单：**

- [ ] 更新 `.husky/pre-commit`
  - [ ] 添加类型检查（必须通过）
  - [ ] 添加 ESLint 检查（零警告）
- [ ] 更新 `.github/workflows/ci.yml`
  - [ ] 确保所有检查必须通过
  - [ ] 添加依赖图检查（模块边界）
- [ ] 测试 Git Hooks 是否正常工作
- [ ] 测试 CI 流程

**验收标准：**

- 提交前自动运行所有检查
- CI 中所有检查必须通过
- 不符合规范的代码无法提交

**输出物：**

- 更新的 `.husky/pre-commit`
- 更新的 `.github/workflows/ci.yml`

---

#### 任务 2.4: 完善架构文档（Day 5）

**目标：** 创建完整的架构文档体系

**任务清单：**

- [ ] 创建 `docs/architecture/` 目录
- [ ] 编写 `docs/architecture/overview.md`（架构概览）
- [ ] 编写 `docs/architecture/module-boundaries.md`（模块边界规则）
- [ ] 编写 `docs/architecture/import-rules.md`（导入规范）
- [ ] 编写 `docs/architecture/typescript-standards.md`（TS 规范）
- [ ] 创建架构决策记录（ADR）模板

**验收标准：**

- 文档清晰、完整
- 新成员可以快速理解架构
- 包含示例和最佳实践

**输出物：**

- `docs/architecture/overview.md`
- `docs/architecture/module-boundaries.md`
- `docs/architecture/import-rules.md`
- `docs/architecture/typescript-standards.md`
- `docs/architecture/adr-template.md`

---

#### 任务 2.5: 创建开发指南（Day 6-7）

**目标：** 编写详细的开发指南

**任务清单：**

- [ ] 创建 `docs/development/` 目录
- [ ] 编写 `docs/development/getting-started.md`（快速开始）
- [ ] 编写 `docs/development/code-organization.md`（代码组织）
- [ ] 编写 `docs/development/api-integration.md`（API 集成指南）
- [ ] 编写 `docs/development/checklist.md`（开发检查清单）
- [ ] 创建示例代码（`docs/examples/`）

**验收标准：**

- 指南清晰、可操作
- 包含常见场景的示例
- 新成员可以按照指南快速上手

**输出物：**

- `docs/development/getting-started.md`
- `docs/development/code-organization.md`
- `docs/development/api-integration.md`
- `docs/development/checklist.md`
- `docs/examples/` 下的示例代码

---

## Phase 2: 核心能力建设（Week 3-6）

### Week 3: 请求/错误/权限统一收口

#### 任务 3.1: API 类型体系完善（Day 1-2）

**目标：** 完善 API 类型定义，支持所有业务场景

**任务清单：**

- [ ] 扩展通用响应类型
  - [ ] 支持不同的 meta 结构
  - [ ] 支持错误响应格式
- [ ] 创建请求参数类型工具
  - [ ] `RequestParams<T>` 类型工具
  - [ ] 查询参数构建工具
- [ ] 更新所有 API 函数使用新类型
- [ ] 添加类型文档

**验收标准：**

- 所有 API 函数有完整的类型定义
- 类型可以正确推断
- 文档说明类型使用方式

**输出物：**

- 更新的 `libs/shared/api/types/common.ts`
- 类型工具函数
- 更新的 API 函数

---

#### 任务 3.2: 错误处理统一（Day 3-4）

**目标：** 建立统一的错误处理机制

**任务清单：**

- [ ] 完善错误类型体系
  - [ ] 扩展 `ApiError` 系列
  - [ ] 添加错误代码枚举
- [ ] 创建错误处理工具
  - [ ] 错误类型守卫函数
  - [ ] 错误消息格式化
  - [ ] 错误日志记录
- [ ] 实现全局错误边界
  - [ ] React Error Boundary
  - [ ] Next.js Error Handler
- [ ] 更新 API Client 错误处理逻辑

**验收标准：**

- 所有错误有明确的类型
- 错误可以正确捕获和显示
- 错误日志完整记录

**输出物：**

- 更新的 `libs/shared/api/types/errors.ts`
- `libs/shared/api/utils/error-handlers.ts`
- 错误边界组件
- 更新的 API Client

---

#### 任务 3.3: 权限系统设计（Day 5-6）

**目标：** 设计并实现权限检查机制

**任务清单：**

- [ ] 设计权限模型
  - [ ] 权限类型定义
  - [ ] 权限检查接口
- [ ] 实现认证拦截器
  - [ ] Token 管理
  - [ ] 自动刷新机制
- [ ] 实现权限检查工具
  - [ ] 服务端权限检查
  - [ ] 客户端权限检查
- [ ] 创建权限相关的 React Hooks
- [ ] 更新 API Client 支持权限

**验收标准：**

- 权限检查机制完整
- 可以正确拦截未授权请求
- 权限相关的 UI 组件可以正常工作

**输出物：**

- `libs/shared/api/auth/` 目录
- 权限检查工具和 Hooks
- 更新的 API Client

---

#### 任务 3.4: 日志系统增强（Day 7）

**目标：** 增强请求日志的可观测性

**任务清单：**

- [ ] 实现请求 ID 生成和传递
- [ ] 增强服务端日志
  - [ ] 完整 URL、请求头、请求体
  - [ ] 响应状态、响应体摘要
  - [ ] 结构化日志格式
- [ ] 优化客户端日志
  - [ ] 请求去重标识
  - [ ] 并发检测
  - [ ] 数据预览功能
- [ ] 添加生产环境指标收集

**验收标准：**

- 日志信息完整、可读
- 可以追踪请求生命周期
- 生产环境可以收集指标

**输出物：**

- 更新的日志系统
- 指标收集工具
- 日志使用文档

---

### Week 4: 数据 & 状态架构

#### 任务 4.1: 状态管理方案确定（Day 1-2）

**目标：** 确定数据获取和状态管理方案

**任务清单：**

- [ ] 分析当前数据获取模式
- [ ] 设计状态管理架构
  - [ ] Server Components 数据获取
  - [ ] Client Components 状态管理
  - [ ] 服务端/客户端数据同步
- [ ] 选择状态管理库（如需要）
  - [ ] 评估 React Query / SWR
  - [ ] 评估 Zustand / Jotai
- [ ] 创建状态管理规范文档

**验收标准：**

- 状态管理方案清晰
- 文档说明使用场景和最佳实践
- 团队评审通过

**输出物：**

- `docs/architecture/state-management.md`
- 状态管理工具和 Hooks（如需要）

---

#### 任务 4.2: 数据获取层设计（Day 3-4）

**目标：** 实现统一的数据获取接口

**任务清单：**

- [ ] 创建 Server Actions
  - [ ] 统一的 Server Action 模板
  - [ ] 错误处理机制
- [ ] 创建数据获取 Hooks
  - [ ] `useServerData` Hook
  - [ ] `useClientData` Hook
- [ ] 实现缓存策略
  - [ ] Next.js Cache 配置
  - [ ] React Query 缓存（如使用）
- [ ] 创建数据获取规范文档

**验收标准：**

- 数据获取接口统一
- 缓存策略合理
- 文档清晰说明使用方法

**输出物：**

- Server Actions 模板
- 数据获取 Hooks
- 缓存配置
- `docs/development/data-fetching.md`

---

#### 任务 4.3: 状态同步机制（Day 5-6）

**目标：** 确保服务端和客户端数据一致性

**任务清单：**

- [ ] 设计数据同步策略
- [ ] 实现乐观更新机制
- [ ] 实现数据失效和重新获取
- [ ] 创建状态同步工具

**验收标准：**

- 服务端和客户端数据保持一致
- 可以正确处理数据更新
- 文档说明同步机制

**输出物：**

- 状态同步工具
- 更新的数据获取 Hooks
- 文档更新

---

#### 任务 4.4: 测试与验证（Day 7）

**目标：** 测试数据架构的完整性和正确性

**任务清单：**

- [ ] 编写数据获取的单元测试
- [ ] 编写状态管理的集成测试
- [ ] 测试缓存机制
- [ ] 性能测试

**验收标准：**

- 所有测试通过
- 性能指标符合预期
- 文档完整

**输出物：**

- 测试文件
- 测试报告
- 性能报告

---

### Week 5: UI 与业务逻辑解耦

#### 任务 5.1: 组件分层设计（Day 1-2）

**目标：** 建立清晰的组件分层架构

**任务清单：**

- [ ] 定义组件分层
  - [ ] UI 组件（纯展示）
  - [ ] 容器组件（数据获取）
  - [ ] 页面组件（路由）
- [ ] 创建组件模板
- [ ] 迁移现有组件到新结构
- [ ] 编写组件开发规范

**验收标准：**

- 组件分层清晰
- 所有组件符合分层规范
- 文档说明组件开发方式

**输出物：**

- `libs/ui/components/` 下的 UI 组件
- 组件模板
- `docs/development/component-standards.md`

---

#### 任务 5.2: 业务逻辑提取（Day 3-4）

**目标：** 将业务逻辑从组件中提取出来

**任务清单：**

- [ ] 识别组件中的业务逻辑
- [ ] 提取到 Hooks 或 Server Actions
- [ ] 重构组件使用新的逻辑层
- [ ] 编写业务逻辑规范

**验收标准：**

- 组件只负责展示
- 业务逻辑独立可测试
- 文档说明逻辑组织方式

**输出物：**

- 重构后的组件
- 业务逻辑 Hooks/Actions
- `docs/development/business-logic.md`

---

#### 任务 5.3: 组件库建立（Day 5-6）

**目标：** 建立可复用的 UI 组件库

**任务清单：**

- [ ] 迁移基础 UI 组件到 `libs/ui/`
- [ ] 建立组件文档（Storybook 或文档站点）
- [ ] 创建组件使用示例
- [ ] 建立组件开发流程

**验收标准：**

- 组件库结构清晰
- 组件文档完整
- 可以快速查找和使用组件

**输出物：**

- `libs/ui/components/` 下的组件
- 组件文档站点
- 组件使用示例

---

#### 任务 5.4: 组件文档（Day 7）

**目标：** 完善组件文档和使用指南

**任务清单：**

- [ ] 为每个组件编写文档
- [ ] 创建组件使用示例
- [ ] 建立组件审查清单
- [ ] 更新开发指南

**验收标准：**

- 所有组件有完整文档
- 示例代码可运行
- 文档易于查找

**输出物：**

- 组件文档
- 使用示例
- 更新的开发指南

---

### Week 6: Strapi 集成

#### 任务 6.1: Strapi SDK 封装（Day 1-2）

**目标：** 封装 Strapi API 客户端

**任务清单：**

- [ ] 分析 Strapi API 结构
- [ ] 创建 Strapi 类型定义
- [ ] 封装 Strapi API 客户端
- [ ] 实现类型安全的 API 调用

**验收标准：**

- Strapi API 调用类型安全
- 客户端接口清晰易用
- 文档说明使用方法

**输出物：**

- `libs/shared/api/strapi/` 目录
- Strapi 类型定义
- Strapi API 客户端

---

#### 任务 6.2: 内容类型映射（Day 3-4）

**目标：** 建立 Strapi 内容类型到前端类型的映射

**任务清单：**

- [ ] 分析 Strapi 内容类型
- [ ] 创建类型映射工具
- [ ] 实现自动类型生成（如可能）
- [ ] 创建类型映射文档

**验收标准：**

- 类型映射准确
- 可以自动或半自动生成类型
- 文档说明映射规则

**输出物：**

- 类型映射工具
- 生成的类型定义
- 映射文档

---

#### 任务 6.3: 媒体处理（Day 5-6）

**目标：** 实现 Strapi 媒体的优化处理

**任务清单：**

- [ ] 实现图片 URL 提取和转换
- [ ] 集成 Next.js Image 优化
- [ ] 实现 CDN 集成（如需要）
- [ ] 创建媒体处理工具

**验收标准：**

- 图片可以正确加载和优化
- CDN 集成正常（如使用）
- 工具易用

**输出物：**

- 媒体处理工具
- 更新的图片组件
- 媒体处理文档

---

#### 任务 6.4: 测试与验证（Day 7）

**目标：** 测试 Strapi 集成的完整性和正确性

**任务清单：**

- [ ] 编写 Strapi API 调用的测试
- [ ] 测试类型映射
- [ ] 测试媒体处理
- [ ] 端到端测试

**验收标准：**

- 所有测试通过
- Strapi 集成功能正常
- 文档完整

**输出物：**

- 测试文件
- 测试报告
- 更新的文档

---

## Phase 3: 优化与完善（持续）

### 性能优化

- [ ] 代码分割和懒加载
- [ ] 图片优化
- [ ] 缓存策略优化
- [ ] 性能监控

### 测试覆盖

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖关键流程
- [ ] E2E 测试覆盖主要用户路径

### 监控与可观测性

- [ ] 错误追踪（Sentry 等）
- [ ] 性能监控（Web Vitals）
- [ ] 用户行为分析

### 文档持续完善

- [ ] 架构决策记录（ADR）
- [ ] API 文档
- [ ] 组件文档
- [ ] 最佳实践总结

---

## 🔄 依赖关系图

```
Phase 1 (基础架构)
  ├─ 1.1 目标结构文档
  ├─ 1.2 路径别名体系 ──┐
  ├─ 1.3 libs 目录结构 ──┤
  ├─ 1.4 迁移共享代码 ──┼─→ 1.5 迁移业务代码 ──→ 1.6 迁移工具 ──→ 1.7 执行迁移
  │
  └─ Week 2 (基础规范)
      ├─ 2.1 TS 类型体系
      ├─ 2.2 ESLint 规则
      ├─ 2.3 Git Hooks/CI
      ├─ 2.4 架构文档
      └─ 2.5 开发指南

Phase 2 (核心能力)
  ├─ Week 3 (请求/错误/权限) ──→ Week 4 (数据架构) ──→ Week 5 (UI 解耦) ──→ Week 6 (Strapi)
  │
  └─ 所有任务依赖 Phase 1 完成

Phase 3 (优化完善)
  └─ 依赖 Phase 2 完成
```

---

## ⚠️ 风险控制

### 风险识别

1. **重构影响现有功能**

   - 缓解：小步提交、持续验证、功能测试

2. **Import 路径迁移出错**

   - 缓解：使用工具、分模块迁移、类型检查验证

3. **团队协作冲突**

   - 缓解：明确时间窗口、及时沟通、代码审查

4. **时间估算不准确**
   - 缓解：预留缓冲时间、优先级调整、分阶段交付

### 回滚策略

- 每个阶段完成后创建 Git 标签
- 重要变更前创建备份分支
- 保持主分支稳定，重构在独立分支进行

---

## 📊 进度跟踪

### 完成标准

每个任务完成后需要：

- ✅ 代码提交并合并
- ✅ 文档更新
- ✅ 团队评审通过
- ✅ 功能验证通过

### 状态更新

每周更新 `docs/plan.md` 中的任务状态，确保团队对进度有清晰认知。

---

## 📝 备注

- 本计划为动态文档，根据实际情况调整
- 重大变更需记录 ADR
- 每个阶段完成后进行复盘，优化后续计划

---

**最后更新：** 2024-12-19  
**维护者：** 架构团队  
**审核状态：** ⏳ 待审核
