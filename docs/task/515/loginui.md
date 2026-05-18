# Quick Auth 全套 UI 优化提示词

## 任务

按现有截图与设计语言,为 Quick Auth 流程(Email Step / Password Step / SignUp Step)统一 UI,以及登录后 LoginModal 弹窗壳的视觉。

涉及文件:

```
/www/webapp/pages.joydeem.com/dev_html/jd-frontend-dev/apps/jd-frontend/
├─ features/auth/components/EmailStep.tsx
├─ features/auth/components/PasswordStep.tsx
├─ features/auth/components/SignUpStep.tsx
├─ features/auth/components/AuthPanel.tsx
├─ features/auth/components/LoginModal.tsx
└─ app/login/page.tsx
```

## 全局设计规范

### 卡片容器

```
rounded-2xl border border-black/5 bg-background p-8
shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]
```

柔和阴影 + 细边框,比 `shadow-2xl` 更精致。

### 标题

- 主标题:`text-2xl font-semibold tracking-tight text-ink`
- 副标题:`mt-2 text-sm text-ink-muted`
- 标题区与表单区:`space-y-6`

### 表单内部间距

- 字段之间:`space-y-5`
- label 与 input 之间:`mb-2`

### 输入框统一样式

```
w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm text-ink
placeholder:text-ink-muted transition-all
focus:border-brand focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/15
```

- 内边距 `py-3`(与主按钮等高)
- 聚焦光晕大半径低透明度(`ring-4 ring-brand/15`),柔和
- 聚焦时背景从 surface 变 background(从灰变白),反馈明显

### Label

```
block text-sm font-medium text-ink
```

### 主按钮

```
btn-primary w-full py-3 text-sm font-semibold
transition-all hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none
```

### 次级按钮(Back / Use different email)

```
flex w-full items-center justify-center gap-1.5 py-2
text-sm font-medium text-ink-muted transition-colors hover:text-ink
```

左侧带 `ChevronLeft h-3.5 w-3.5` 图标。

### 链接(Forgot password / Go to home)

```
text-sm font-medium text-brand transition-colors hover:underline
```

### 错误提示

```
text-sm text-red-500
role="alert"
```

## 各组件详细要求

### 1. EmailStep(Step 1)

**结构**:

```tsx
<div className="space-y-6">
  <div>
    <h2 className="text-2xl font-semibold tracking-tight text-ink">
      Sign in or create account
    </h2>
    <p className="mt-2 text-sm text-ink-muted">
      Enter your email to get started.
    </p>
  </div>

  <form className="space-y-5" onSubmit={...}>
    <div>
      <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoFocus
        autoComplete="email"
        placeholder="you@example.com"
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 text-sm text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/15"
      />
    </div>

    {/* Turnstile,居中 */}
    {NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY && (
      <div className="flex justify-center">
        <Turnstile ... />
      </div>
    )}

    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

    <button type="submit" disabled={loading || !turnstileToken} className="btn-primary w-full py-3 text-sm font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none">
      {loading ? 'Checking…' : 'Continue'}
    </button>
  </form>

  <p className="text-center text-xs text-ink-muted">
    Continue shopping?{' '}
    <Link href="/" className="font-medium text-brand hover:underline">
      Go to home
    </Link>
  </p>
</div>
```

**要点**:

- 邮箱输入框 `autoFocus`
- Turnstile 居中显示,与字段同间距
- 按钮文案 loading 态显示 `Checking…`,默认 `Continue`
- `Go to home` 链接放在卡片最底部(在按钮下方)

### 2. PasswordStep(Step 2A 登录)

**结构**:

```tsx
<div className="space-y-6">
  <div>
    <h2 className="text-2xl font-semibold tracking-tight text-ink">
      Enter your password
    </h2>
    <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
      <User className="h-4 w-4 flex-shrink-0" />
      <span className="truncate font-medium text-ink">{email}</span>
    </p>
  </div>

  <form className="space-y-5" onSubmit={...}>
    {/* 隐藏 username 给密码管理器 */}
    <input type="email" name="username" autoComplete="username" value={email} readOnly style={{ display: 'none' }} />

    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="signin-password" className="block text-sm font-medium text-ink">
          Password
        </label>
        <Link
          href={`/forgot-password?email=${encodeURIComponent(email)}`}
          className="text-sm font-medium text-brand transition-colors hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="relative">
        <input
          id="signin-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          autoFocus
          placeholder="••••••••"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 pr-16 text-sm text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>

    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

    <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none">
      {loading ? 'Signing in…' : 'Sign in'}
    </button>

    <button
      type="button"
      onClick={onBack}
      className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Use a different email
    </button>
  </form>
</div>
```

**要点**:

- 邮箱区带 `User` 图标(`lucide-react`),邮箱加粗显示,作为视觉锚点
- 密码框 `autoFocus`,进入页面自动聚焦
- 密码框右侧 `Show / Hide` 切换按钮,`useState` 管理
- `Forgot password?` 带 `email` query 传到忘记密码页
- `Back` 按钮改为 `Use a different email`,带左箭头

### 3. SignUpStep(Step 2B 注册)

**结构**:

```tsx
<div className="space-y-6">
  <div>
    <h2 className="text-2xl font-semibold tracking-tight text-ink">
      Create your account
    </h2>
    <p className="mt-2 flex items-center gap-2 text-sm text-ink-muted">
      <User className="h-4 w-4 flex-shrink-0" />
      <span className="truncate font-medium text-ink">{email}</span>
    </p>
  </div>

  <form className="space-y-5" onSubmit={...}>
    {/* 隐藏 username */}
    <input type="email" name="username" autoComplete="username" value={email} readOnly style={{ display: 'none' }} />

    <div>
      <label htmlFor="signup-password" className="mb-2 block text-sm font-medium text-ink">
        Create password
      </label>

      <div className="relative">
        <input
          id="signup-password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          autoFocus
          minLength={8}
          placeholder="••••••••"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-3 pr-16 text-sm text-ink placeholder:text-ink-muted transition-all focus:border-brand focus:bg-background focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-muted hover:text-ink"
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* 密码规则实时反馈 */}
      <div className="mt-2 space-y-1">
        <PasswordRule met={password.length >= 8} text="At least 8 characters" />
        <PasswordRule met={/[A-Z]/.test(password) && /[a-z]/.test(password)} text="Upper and lowercase letters" />
        <PasswordRule met={/\d/.test(password)} text="At least one number" />
      </div>
    </div>

    {/* 不再显示 Turnstile,Step 1 已验证;如后端要求,这里 invisible 模式重新取 token */}

    {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

    <button type="submit" disabled={loading || !allRulesMet} className="btn-primary w-full py-3 text-sm font-semibold transition-all hover:shadow-md disabled:opacity-60 disabled:hover:shadow-none">
      {loading ? 'Creating account…' : 'Create account'}
    </button>

    <button
      type="button"
      onClick={onBack}
      className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      Use a different email
    </button>
  </form>

  <p className="text-center text-xs leading-relaxed text-ink-muted">
    By creating an account, you agree to our{' '}
    <Link href="/terms" className="font-medium text-ink hover:underline">Terms of Use</Link>{' '}
    and{' '}
    <Link href="/privacy" className="font-medium text-ink hover:underline">Privacy Policy</Link>.
  </p>
</div>
```

**`PasswordRule` 子组件**:

```tsx
function PasswordRule({ met, text }: { met: boolean; text: string }) {
  return (
    <p
      className={`flex items-center gap-1.5 text-xs ${
        met ? 'text-green-600' : 'text-ink-muted'
      }`}
    >
      <Check className={`h-3.5 w-3.5 ${met ? 'opacity-100' : 'opacity-30'}`} />
      {text}
    </p>
  );
}
```

**要点**:

- **不显示 firstname / lastname 字段**(极简注册,后端用 email 前缀兜底)
- 标题用 `Create your account`(区别于 Step 2A 的 `Enter your password`)
- 密码规则实时反馈:每条规则前的 ✓ 根据是否满足显示绿色或灰色
- 同样有 Show/Hide 切换、autoFocus、隐藏 username input、Use a different email
- 底部加 Terms / Privacy 声明,但**不强制勾选 checkbox**(降低门槛)

### 4. AuthPanel(容器)

`AuthPanel` 不动 UI,只负责 step 状态机与卡片外壳。结构:

```tsx
<div className="rounded-2xl border border-black/5 bg-background p-8 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]">
  {step === 'email' && <EmailStep ... />}
  {step === 'password' && <PasswordStep ... />}
  {step === 'signup' && <SignUpStep ... />}
</div>
```

**Step 切换动画**(可选,但效果显著):

```tsx
<div
  key={step}
  className="animate-in fade-in slide-in-from-right-2 duration-200"
>
  {/* step content */}
</div>
```

需要 `tailwindcss-animate` 插件,或在 `tailwind.config.js` 自定义 keyframes。

### 5. LoginModal(弹窗壳)

弹窗外壳不动逻辑,只调整视觉:

- 卡片 padding `p-8`,圆角 `rounded-2xl`
- 阴影改为柔和版:`shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]`
- 关闭按钮保持现有位置(右上角)
- 内容区直接嵌 `<AuthPanel mode="modal" />`

### 6. 页面版(`app/login/page.tsx`)

- 使用 `PageContainer max-w-md py-10`
- 卡片样式同上
- 已登录态保护:`useEffect` 监听 `isAuthenticated`,跳 `next` 或 `/account`

## 颜色与图标速查

引入图标:

```tsx
import { User, ChevronLeft, Check } from 'lucide-react';
```

主要颜色变量(沿用项目现有 token):

- `text-ink` / `text-ink-muted` —— 主要 / 次要文本
- `bg-background` / `bg-surface` —— 白底 / 浅灰底
- `border-border` / `border-black/5` —— 字段边框 / 卡片细边框
- `text-brand` / `btn-primary` —— 品牌色 / 主按钮
- `text-green-600` / `text-red-500` —— 成功 / 错误反馈

## 交付清单

- [ ] `EmailStep`:标题 `text-2xl tracking-tight`,邮箱框 `autoFocus + py-3 + focus 光晕`,按钮 `Continue / Checking…`,底部 `Go to home`
- [ ] `PasswordStep`:邮箱带 User 图标 + 加粗,密码 Show/Hide 切换,`autoFocus`,`Use a different email` 带左箭头,Forgot password 带 email query
- [ ] `SignUpStep`:无 firstname/lastname,密码规则实时反馈(3 条 ✓ 列表),底部 Terms/Privacy
- [ ] 所有按钮:`hover:shadow-md` 反馈、disabled 态去 hover
- [ ] 所有输入框:`focus:ring-4 focus:ring-brand/15` + `focus:bg-background`
- [ ] 隐藏 `autocomplete="username"` input 在 Step 2A/B 都有(密码管理器兼容)
- [ ] 卡片外壳:`rounded-2xl border border-black/5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12)]`
- [ ] Step 切换动画(可选):`fade-in slide-in-from-right-2 duration-200`
- [ ] 移动端验证:卡片不溢出、字段不挤压、按钮可点击区域足够
- [ ] 密码管理器(Chrome / 1Password)能正确保存与填充
- [ ] Tab 键焦点顺序正常,所有交互元素可键盘访问
