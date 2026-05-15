Quick Auth 统一入口开发提示词
任务背景
项目为 Next.js 前端 + Magento 后端,接口走 Magento REST API。
将现有登录/注册改为统一入口的两步流程:
Step 1 (Email): 输入邮箱 → Continue
↓
判断邮箱是否已注册
↓
Step 2A (Sign in): 已注册 → 显示密码框 → 登录
Step 2B (Sign up): 未注册 → 显示姓名/密码字段(邮箱已预填) → 注册
页面标题与文案:

主标题:Sign in or create an account
副标题:You can sign in using your account to access our services.
Step 1 输入框 label:Email address
按钮:Continue

相关路径:
/www/webapp/pages.joydeem.com/dev_html/jd-frontend-dev/apps/jd-frontend/
├─ app/(auth)/login/page.tsx ← 改造
├─ features/auth/components/LoginModal.tsx ← 改造
└─ features/auth/ ← 现有目录,沿用

1. URL 与路径规划
   功能 Next.js 路由说明统一入口(Step 1)/login 邮箱输入,ContinueStep 2A 登录/login?email=xxx&step=password 输入密码 Step 2B 注册/login?email=xxx&step=signup 填写姓名 + 密码完成注册忘记密码/forgot-password 已存在,保留账户中心/account/\*已存在,登录后页面

单页 URL 同步:Step 切换通过 query 参数控制(step + email),用 router.replace 静默更新,不创建新历史记录,但浏览器后退仍能回到 Step 1。
直接访问 /login?email=xxx&step=password 应能直接进入对应步骤(刷新页面不丢状态)。
Magento 原生路径 301:

/customer/account/login → /login
/customer/account/create → /login 2. Magento 邮箱检查接口
Magento REST API:
POST /rest/{locale}/V1/customers/isEmailAvailable
Content-Type: application/json

{
"customerEmail": "user@example.com",
"websiteId": 1
}
返回值:

true → 邮箱可用(未注册),走注册分支
false → 邮箱已被使用(已注册),走登录分支

示例:https://www.joydeem.com/rest/en/V1/customers/isEmailAvailable,locale 沿用项目现有处理方式。
安全防护(必做)
isEmailAvailable 有账户枚举风险,前端不直接调 Magento,必须通过 Next.js API Route 代理:
新增 app/api/auth/check-email/route.ts:

前端 POST /api/auth/check-email,body: { email, turnstileToken }
服务端:

验证 Turnstile token(复用 features/auth/services/cloudflare-turnstile.ts),失败返回 400。
IP 限流:同 IP 每分钟最多 10 次,超限返回 429。简单实现可用内存 Map + 时间窗;若有 Redis 走 Redis。
通过后代理调用 Magento isEmailAvailable,返回 { exists: boolean }(把 Magento 的 true/false 反向后返回,前端语义更直观:exists=true 表示邮箱已注册)。
网络错误处理:Magento 异常时返回 500 + 友好错误信息,前端展示「服务暂不可用,请稍后重试」。

ts// 接口契约
// 请求
POST /api/auth/check-email
{ "email": "user@example.com", "turnstileToken": "..." }

// 响应
200 { "exists": true } // 已注册,走登录
200 { "exists": false } // 未注册,走注册
400 { "error": "Invalid captcha" }
429 { "error": "Too many requests" }
500 { "error": "Service unavailable" } 3. 页面与组件结构
组件目录
承接之前的组件抽取规划,新增 Quick Auth 相关组件:
features/auth/components/
├─ AuthPanel.tsx ← 主入口容器,负责 step 状态机
├─ EmailStep.tsx ← Step 1:邮箱输入 + Turnstile + Continue
├─ PasswordStep.tsx ← Step 2A:密码输入,内部复用登录逻辑
├─ SignUpStep.tsx ← Step 2B:姓名+密码,内部复用注册逻辑
├─ LoginModal.tsx ← 薄壳,内嵌 <AuthPanel mode="modal" />
├─ auth.context.tsx (保留)
└─ auth-modal.context.tsx (保留)
视觉与共享样式
沿用现有页面版的卡片与字段样式(PageContainer max-w-md、rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8、input / label class)。
页面顶部固定区:

<h1>Sign in or create an account</h1>
<p>You can sign in using your account to access our services.</p>
这两行在所有 step 中都保留,只切换下方表单内容,视觉上是一个连贯的流程而非跳页。
<AuthPanel /> —— 主状态机
职责:管理 step 状态、URL 同步、step 间数据传递。
tstype Step = 'email' | 'password' | 'signup';

interface AuthPanelProps {
mode: 'page' | 'modal';
onSuccess?: () => void; // modal 模式由 LoginModal 传入(关闭弹窗 + 刷新)
}
逻辑要点:

初始 step:

mode="page":读 searchParams 的 step 与 email。若 step=password 且 email 存在 → Step 2A;step=signup 且 email 存在 → Step 2B;否则 → Step 1。
mode="modal":始终从 Step 1 开始。

URL 同步(仅 page 模式):每次 step 切换调 router.replace(/login?email={email}&step=
{step}),保留 next query。
state lifting:email 在 Panel 中持有,Step 1 提交后写入,Step 2A/B 只读 + 显示「Change email」链接回 Step 1(清空密码字段,保留邮箱以便修改)。
成功跳转:

mode="page":router.replace(searchParams.get('next') || '/account')。
mode="modal":调 onSuccess?.()。

<EmailStep /> —— Step 1
字段:邮箱 + Turnstile(已存在 NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY 时显示)。
按钮:Continue(loading 时显示 Checking…)。
提交流程:

校验邮箱格式。
POST /api/auth/check-email,带 email 与 turnstileToken。
根据返回:

exists: true → 调用 onNext('password', email),父级切到 Step 2A。
exists: false → 调用 onNext('signup', email),父级切到 Step 2B。

失败处理:Turnstile 失败/过期 → 重置 token,提示重试;429 → 提示「Too many attempts, please wait a moment」;其他 → 通用错误。

额外:

输入框默认聚焦。
按回车键提交。

<PasswordStep /> —— Step 2A(登录)
字段:

邮箱(只读展示 + 右侧 Change email 文字按钮,点击回 Step 1)。
密码(autocomplete="current-password")。
隐藏的 username input(type="hidden" 或 style="display:none" 但带正确属性),值为 email,让密码管理器能关联邮箱 ⚠️ 必须有,否则 1Password/Chrome 无法保存或填充。

html<input
type="email"
name="username"
autoComplete="username"
value={email}
readOnly
style={{ display: 'none' }}
/>
按钮:Sign in(loading 时 Signing in…)。
额外:

Forgot password? 链接 → /forgot-password?email=${email}(把邮箱预填到忘记密码页)。
提交调用 useAuth().login(email, password),逻辑与现有 SignInForm 一致。
错误处理:401 显示「Incorrect password」(因为邮箱已确认存在,不会是「邮箱不存在」)。

<SignUpStep /> —— Step 2B(注册)
字段:

邮箱(只读 + Change email,同上)。
First Name(autoComplete="given-name")。
Last Name(autoComplete="family-name")。
密码(autoComplete="new-password")+ 密码规则提示「At least 8 characters with uppercase, lowercase, a number, and a special character.」。
隐藏 username input 同上。
不需要再显示 Turnstile(Step 1 已经验证过)。

按钮:Create account。
提交:调用 useAuth().register(email, password, firstName, lastName),不传 turnstileToken(注册的 Turnstile 已在 Step 1 校验)。

⚠️ 这里有个细节:现有 register 函数签名带 turnstileToken 参数,且后端可能要求 Turnstile 校验。两种处理方式,选其一:

复用 Step 1 的 token:EmailStep 把验证通过的 token 传给父组件,父组件再传给 SignUpStep。但 Cloudflare Turnstile token 默认只能验证一次,服务端 /api/auth/check-email 已用过,后端 register 再用会失败。
SignUpStep 再渲染一次 Turnstile:用户无需操作(invisible mode 或自动续期),取新 token 提交。推荐这种,稳妥。

决定后告诉我,我可以补具体实现细节。

<LoginModal /> —— 改造

删除内部 tab state、表单 state、submit 逻辑。
保留弹窗外壳(fixed inset-0、关闭按钮、role="dialog")。
内容区:<AuthPanel mode="modal" onSuccess={() => { onSuccess?.(); onClose(); }} />。
props 保持向后兼容(isOpen、onClose、onSuccess)。移除 defaultTab prop(统一入口不再有 tab 概念),若调用方有传则忽略。

4. 后端工具函数
   新增 features/auth/services/check-email.ts(前端调用封装):
   tsexport async function checkEmailAvailable(
   email: string,
   turnstileToken: string | null
   ): Promise<{ exists: boolean }> {
   const res = await fetch('/api/auth/check-email', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ email, turnstileToken }),
   });
   if (!res.ok) {
   const data = await res.json().catch(() => ({}));
   throw new Error(data.error || `Request failed (${res.status})`);
   }
   return res.json();
   }
5. 301 跳转配置
   next.config.js:
   jsasync redirects() {
   return [
   { source: '/customer/account/login', destination: '/login', permanent: true },
   { source: '/customer/account/login/', destination: '/login', permanent: true },
   { source: '/customer/account/create', destination: '/login', permanent: true },
   { source: '/customer/account/create/', destination: '/login', permanent: true },
   { source: '/customer/account/forgotpassword',destination: '/forgot-password', permanent: true },
   { source: '/customer/account/forgotpassword/',destination:'/forgot-password', permanent: true },
   ];
   }

注册的 Magento 路径也跳 /login,因为新流程不再区分入口,统一从邮箱开始。

6. 已登录态保护
   沿用现有逻辑:AuthPanel 内 useEffect 监听 isAuthenticated,已登录直接 router.replace(searchParams.get('next') || '/account')。
7. 文案与细节

主标题:Sign in or create an account
副标题:You can sign in using your account to access our services.
Step 1 按钮:Continue / Checking…
Step 2A 提示语:页面副标题下加一行小字 Welcome back. Please enter your password.
Step 2B 提示语:副标题下加一行小字 Looks like you're new here. Let's create your account.
Change email 按钮:文字按钮,放在邮箱只读字段右侧或下方
错误信息:

Step 1:邮箱格式错误「Please enter a valid email address.」
Step 1:429「Too many attempts. Please wait a moment and try again.」
Step 2A:401「Incorrect password.」+ 提供 Forgot password? 入口
Step 2B:邮箱已存在(极少出现,Step 1 漏判时兜底)「This email is already registered. [Sign in]」

8. 技术规范

TypeScript,复用现有 UI 组件库与 useAuth hook。
AuthPanel 与子组件均为 'use client'。
共享卡片样式与现有 app/login/page.tsx 一致。
所有按钮防重复点击,loading 态显示对应文案。
移动端单屏可见,Step 1 极简(一个输入框 + 一个按钮 + Turnstile)。
浏览器密码管理器兼容:Step 2A/B 必须有隐藏的 autocomplete="username" input,值为 email。

9. 交付清单

新增 app/api/auth/check-email/route.ts(Turnstile 验证 + IP 限流 + 代理 Magento)
新增 features/auth/services/check-email.ts(前端调用封装)
新增 features/auth/components/EmailStep.tsx
新增 features/auth/components/PasswordStep.tsx
新增 features/auth/components/SignUpStep.tsx
新增 features/auth/components/AuthPanel.tsx(step 状态机 + URL 同步 + 已登录保护)
改造 features/auth/components/LoginModal.tsx 为薄壳
改造 app/login/page.tsx,内容改为 <AuthPanel mode="page" />,保留 Suspense + Skeleton
next.config.js redirects 配置
全站搜索 LoginModal 调用方,确认兼容(移除 defaultTab prop 后是否有调用方传过)
验证:/login 输入未注册邮箱 → 跳到注册步骤,邮箱已预填,可注册成功
验证:/login 输入已注册邮箱 → 跳到密码步骤,可登录成功
验证:Step 2A/B 点 Change email 能回 Step 1,邮箱保留可修改
验证:浏览器后退按钮从 Step 2 回到 Step 1 正常
验证:直接访问 /login?email=xxx&step=password 能直接显示 Step 2A
验证:/login?email=xxx&step=signup 能直接显示 Step 2B
验证:密码管理器(Chrome saved passwords / 1Password)能正确识别 username + password 关联保存
验证:IP 限流生效,11 次/分钟时返回 429
验证:Turnstile 失败/过期能正确重置并提示
验证:已登录访问 /login 自动跳 next 或 /account
验证:LoginModal 弹窗内全流程正常,成功后关闭弹窗
验证:/customer/account/login、/customer/account/create 均 301 到 /login
