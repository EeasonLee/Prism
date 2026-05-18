# Task: 注册/登录共享组件抽取 + URL 同步

> Date: 2026-05-15
> Scope: `features/auth` 组件重构，`/login` 页面简化

---

## 1. 问题

`app/login/page.tsx` 和 `features/auth/components/LoginModal.tsx` 存在大量重复代码：

- Tab 切换 UI 和状态管理（Sign in / Register）
- Sign In 表单（email、password、forgot password link）
- Register 表单（first/last name、email、password、turnstile）
- 表单提交逻辑（login/register 调用、错误处理、loading 状态）
- Turnstile 验证码处理

两处维护同一套逻辑，修改时需要同步改两份。

---

## 2. 目标

1. **抽取共享组件**：将重复的表单逻辑拆分为独立的可复用组件
2. **简化 LoginPage 和 LoginModal**：两者只负责布局包裹，表单逻辑交给共享组件
3. **URL 同步**：`/login` 页面的 tab 状态与 `?tab=` 查询参数双向同步

---

## 3. 方案

### 3.1 新组件

| 组件           | 路径                                        | 职责                                               |
| -------------- | ------------------------------------------- | -------------------------------------------------- |
| `AuthTabs`     | `features/auth/components/AuthTabs.tsx`     | Tab 切换器（纯 UI）                                |
| `SignInForm`   | `features/auth/components/SignInForm.tsx`   | 登录表单（含 forgot password link）                |
| `RegisterForm` | `features/auth/components/RegisterForm.tsx` | 注册表单（含 turnstile）                           |
| `AuthForm`     | `features/auth/components/AuthForm.tsx`     | 组合层：管理 tab 状态、调用 auth context、URL 同步 |

### 3.2 重构后结构

```
app/login/page.tsx              # 仅保留 PageContainer 布局 + AuthForm
features/auth/components/
  AuthTabs.tsx                  # Tab 切换器
  SignInForm.tsx                # 登录表单
  RegisterForm.tsx              # 注册表单
  AuthForm.tsx                  # 组合层（tab 状态 + URL 同步 + auth 调用）
  LoginModal.tsx                # 仅保留 modal 外壳 + AuthForm
```

### 3.3 URL 同步逻辑

在 `AuthForm` 中实现：

- **读取**：组件 mount 时从 `?tab=` 读取初始 tab
- **写入**：切换 tab 时通过 `router.replace('?tab=...')` 同步到 URL（`scroll: false`）
- **受控模式**：`syncUrl` prop 控制是否启用（LoginPage 启用，LoginModal 不启用）

---

## 4. 实现详情

### 4.1 AuthTabs

```tsx
interface AuthTabsProps {
  activeTab: 'signin' | 'register';
  onTabChange: (tab: AuthTab) => void;
  labels?: { signin: string; register: string };
}
```

### 4.2 SignInForm

```tsx
interface SignInFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitchToRegister?: () => void; // 为 modal 模式提供 tab 切换
  submitLabel?: string;
  loadingLabel?: string;
  forgotPasswordHref?: string;
}
```

内部管理 email、password、error、loading 状态。提交时调用 `onSubmit`，错误由内部捕获并显示。

### 4.3 RegisterForm

```tsx
interface RegisterFormProps {
  onSubmit: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    turnstileToken?: string
  ) => Promise<void>;
  onSwitchToSignIn?: () => void;
  submitLabel?: string;
  loadingLabel?: string;
}
```

内部管理 firstName、lastName、email、password、turnstileToken、error、loading 状态。Turnstile 在注册失败时自动重置。

### 4.4 AuthForm

```tsx
interface AuthFormProps {
  defaultTab?: AuthTab;
  onSuccess?: () => void;
  syncUrl?: boolean; // 是否同步 URL ?tab= 参数
  nextPath?: string; // 登录成功后的跳转路径
}
```

职责：

- 管理 `tab` 状态
- 从 URL 读取初始 tab（`syncUrl=true` 时）
- 切换 tab 时同步到 URL（`syncUrl=true` 时）
- 已登录用户自动跳转到 `nextPath`
- 调用 `useAuth().login()` / `register()`，通过 `onSuccess` 回调通知外层

### 4.5 LoginPage（重构后）

```tsx
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  return (
    <main>
      <PageContainer className="max-w-md py-10">
        <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
          <h1>Sign in to your account</h1>
          <p>Access orders, addresses, and profile settings.</p>
          <AuthForm syncUrl />
          <p>
            Continue shopping? <Link href="/">Go to home</Link>
          </p>
        </div>
      </PageContainer>
    </main>
  );
}
```

### 4.6 LoginModal（重构后）

```tsx
export function LoginModal({ isOpen, onClose, onSuccess, defaultTab }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 ..." role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md">
        <button onClick={onClose}>...</button>
        <div className="rounded-2xl bg-background p-8 shadow-2xl">
          <AuthForm defaultTab={defaultTab} onSuccess={onSuccess} />
        </div>
      </div>
    </div>
  );
}
```

---

## 5. 文件变更

### 新增

- `features/auth/components/AuthTabs.tsx`
- `features/auth/components/SignInForm.tsx`
- `features/auth/components/RegisterForm.tsx`
- `features/auth/components/AuthForm.tsx`

### 修改

- `app/login/page.tsx` — 大幅简化，仅保留布局和 `<AuthForm syncUrl />`
- `features/auth/components/LoginModal.tsx` — 大幅简化，仅保留 modal 外壳
- `features/auth/index.ts` — 导出新的共享组件和类型

---

## 6. 验证

```bash
# Lint 检查
pnpm nx run jd-frontend:lint
```

结果：✅ 0 errors（warnings 为已有代码，与本次修改无关）

---

## 7. 使用方式

### 页面模式（带 URL 同步）

```tsx
// app/login/page.tsx
<AuthForm syncUrl />
```

### Modal 模式（无 URL 同步）

```tsx
// 任意组件中
const { openLogin } = useAuthModal();
openLogin('register');
```

### 独立使用表单

```tsx
// 只需要登录表单
<SignInForm onSubmit={handleLogin} />

// 只需要注册表单
<RegisterForm onSubmit={handleRegister} />
```

---

## 8. 注意事项

- `AuthForm` 内部使用 `useSearchParams()`，因此必须在 `Suspense` 边界内使用（LoginPage 已满足）
- `syncUrl` 仅在页面模式下启用，modal 模式下禁用（避免污染 URL）
- `SignInForm` / `RegisterForm` 内部独立管理状态，互不影响（解决了 LoginModal 中双表单状态独立维护的问题）
- 所有新组件遵循项目规范：使用 `<Link>` 而非 `<a>`，英文文案，无 `any` 类型
