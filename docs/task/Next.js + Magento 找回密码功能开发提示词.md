Next.js + Magento 找回密码功能开发提示词
任务背景
项目为 Next.js 前端 + Magento 后端,接口走 Magento REST API。
Magento 密码重置邮件中的链接指向原生路径:
https://www.joydeem.com/customer/account/createPassword/?id=469&token=hnJ5Brdf1ZlhIr0RRkmawrS2vaOpOWFe
需要把这个原生路径 301 跳转 到 Next.js 的新页面,并实现完整的找回密码流程。账户相关页面统一收拢到 app/account 下管理。
路径规划
项目根目录:
/www/webapp/pages.joydeem.com/dev_html/jd-frontend-dev/apps/jd-frontend/
功能 Next.js 路由文件忘记密码/account/forgot-passwordapp/account/forgot-password/page.tsx 重置密码/account/reset-passwordapp/account/reset-password/page.tsx

forgot-password 当前位于 app/forgot-password(已上线 https://test1.joydeem.com/forgot-password),需移动到 app/account/forgot-password
reset-password 为新增页面,直接建在 app/account/reset-password。
reset-password 页面从 URL query 读取 id(customerId)和 token(resetPasswordToken)。

1. 301 跳转配置
   在 next.config.js 的 redirects() 中配置以下规则,query 参数自动透传:
   jsasync redirects() {
   return [
   // Magento 原生重置密码页 → 新页面
   {
   source: '/customer/account/createPassword',
   destination: '/account/reset-password',
   permanent: true, // 301
   },
   {
   source: '/customer/account/createPassword/',
   destination: '/account/reset-password',
   permanent: true,
   },
   // Magento 原生忘记密码页 → 新页面
   {
   source: '/customer/account/forgotpassword',
   destination: '/account/forgot-password',
   permanent: true,
   },
   {
   source: '/customer/account/forgotpassword/',
   destination: '/account/forgot-password',
   permanent: true,
   },
   }

Next.js redirects() 默认透传 query string,?id=469&token=xxx 会带到 /account/reset-password,无需额外处理。
如果 Next.js 前面有 Nginx,需确认 /customer/\* 没有被直接 proxy 给 Magento;若有,要么在 Nginx 层 return 301,要么把该路径放行给 Next.js,否则 redirects() 不生效。
验证点:访问旧链接,最终 URL 变为 https://www.joydeem.com/account/reset-password?id=469&token=xxx,状态码 301。

2. Magento REST 接口对接
   第一步 — 请求重置邮件(forgot-password 页面使用):
   PUT /rest/V1/customers/password
   Content-Type: application/json

{
"email": "user@example.com",
"template": "email_reset",
"websiteId": 1
}
成功返回 true。
第二步 — 用 token 重置密码(reset-password 页面使用):
POST /rest/V1/customers/resetPassword
Content-Type: application/json

{
"email": "user@example.com",
"resetToken": "hnJ5Brdf1ZlhIr0RRkmawrS2vaOpOWFe",
"newPassword": "NewPass123"
}
成功返回 true;token 失效/过期返回 400 + 错误信息。

⚠️ 关键点: resetPassword 接口需要 email,但邮件链接里只有 id 和 token,没有 email。
解决方案: 在 reset-password 页面增加「邮箱」输入框,让用户手动填注册邮箱 —— Magento 官方页面也是这么做的,无需改后端。
id(customerId)在 REST 接口里用不上,但仍读取并用于:校验链接完整性、出错时辅助提示。

3. 页面移动:forgot-password

将 app/forgot-password 整个目录移动到 app/account/forgot-password。
页面内所有指向 /forgot-password 的内部链接(如登录页的「忘记密码?」入口)同步改为 /account/forgot-password。
确认接口调用仍走 PUT /rest/V1/customers/password,逻辑不变。

4. reset-password 页面要求(新增)

读取 query 中的 id、token;任一缺失则显示「链接无效或已过期」错误态。
表单字段:邮箱、新密码、确认密码。
校验:

邮箱格式。
密码符合 Magento 规则:最少 8 位,至少包含 3 类字符(大写、小写、数字、特殊字符)。
两次密码一致。

提交调用 POST /rest/V1/customers/resetPassword,带上 email、resetToken(query 里的 token)、newPassword。
错误处理:token 失效 / 过期 / 不匹配时,展示后端返回的错误信息,并提供「重新发送重置邮件」入口跳回 /account/forgot-password。
重置成功后跳转登录页,并提示「密码已重置,请用新密码登录」。
loading 状态、提交按钮防重复点击。

5. 技术规范

TypeScript,复用项目现有 UI 组件库、表单组件、Magento REST client 封装,不硬编码 endpoint。
复用 app/account 下已有布局与样式,保持账户页面 UI 一致。
错误信息走项目 i18n(若已接入)。
统一无论邮箱是否注册,forgot-password 提交后都显示「如果该邮箱已注册,我们已发送重置邮件」,防止邮箱枚举。

6. 交付清单

app/forgot-password 移动至 app/account/forgot-password,内部链接同步更新
新增 app/account/reset-password/page.tsx
相关表单组件 / hooks(如 useResetPassword)
next.config.js redirects 配置(含旧 /forgot-password 的 301)
验证:访问 https://www.joydeem.com/customer/account/createPassword/?id=469&token=xxx 能 301 到 /account/reset-password 且参数完整
验证:访问旧 /forgot-password 能 301 到 /account/forgot-password
验证:完整跑通「忘记密码 → 收邮件 → 点链接 → 设新密码 → 登录」全流程
