# SSO 服务 API 对接规范

> 文档生成时间：2026-02-26
> 适用版本：node-sso v1.0.0

---

## 一、服务地址

| 环境                  | 地址                                |
| --------------------- | ----------------------------------- |
| 开发（Docker）        | `http://localhost:13000`            |
| 公开 Swagger 文档     | `http://localhost:13000/docs`       |
| 管理后台 Swagger 文档 | `http://localhost:13000/docs/admin` |

---

## 二、认证机制

需要认证的接口，请求头必须携带 JWT Access Token：

```
Authorization: Bearer <accessToken>
```

### Token 有效期

| Token 类型     | 有效期  |
| -------------- | ------- |
| `accessToken`  | 15 分钟 |
| `refreshToken` | 7 天    |

### Token 刷新策略

- `accessToken` 过期后，调用 `POST /auth/refresh` 换取新 Token
- 收到 `401 TOKEN_EXPIRED` 时，前端应自动静默刷新，刷新失败则跳转登录页
- 登出时客户端直接清除本地 Token（当前为无状态 JWT，服务端不维护黑名单）

---

## 三、统一响应格式

### 成功响应

各接口成功响应结构不完全相同，分两类：

**认证类接口**（`/auth/*`）直接返回业务数据：

```json
{
  "user": { ... },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Magento 代理接口**（`/magento/*`）统一包装：

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 错误响应（RFC 7807）

**所有错误**统一格式：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": null,
    "request_id": "req_a1b2c3d4e5f6"
  }
}
```

| 字段               | 说明                              |
| ------------------ | --------------------------------- |
| `error.code`       | 机器可读错误码，见下方错误码表    |
| `error.message`    | 人类可读错误描述                  |
| `error.details`    | 附加详情，可为 `null`             |
| `error.request_id` | 请求追踪 ID，报错时提供给后端排查 |

> 支持通过请求头 `X-Request-Id` 传入自定义追踪 ID

---

## 四、错误码速查表

| 错误码                      | HTTP 状态 | 说明                     |
| --------------------------- | --------- | ------------------------ |
| `MISSING_AUTH_HEADER`       | 401       | 未携带 Authorization 头  |
| `INVALID_TOKEN`             | 401       | Token 无效               |
| `TOKEN_EXPIRED`             | 401       | Token 已过期             |
| `INVALID_CREDENTIALS`       | 401       | 邮箱或密码错误           |
| `FORBIDDEN`                 | 403       | 无权限                   |
| `ADMIN_REQUIRED`            | 403       | 需要管理员权限           |
| `USER_NOT_FOUND`            | 404       | 用户不存在               |
| `PRODUCT_NOT_FOUND`         | 404       | 商品不存在               |
| `CATEGORY_NOT_FOUND`        | 404       | 分类不存在               |
| `VALIDATION_ERROR`          | 400       | 参数校验失败             |
| `MISSING_REQUIRED_FIELD`    | 400       | 缺少必填字段             |
| `EMAIL_ALREADY_VERIFIED`    | 400       | 邮箱已验证               |
| `VERIFICATION_CODE_SENT`    | 400       | 验证码已发送，需等待冷却 |
| `INVALID_VERIFICATION_CODE` | 400       | 验证码无效或已过期       |
| `REGISTRATION_FAILED`       | 400       | 注册失败（如邮箱已存在） |
| `EXTERNAL_SERVICE_ERROR`    | 502       | Magento 服务不可用       |
| `INTERNAL_ERROR`            | 500       | 服务器内部错误           |

---

## 五、接口清单

### 5.1 认证模块 `/auth`

| 方法 | 路径             | 认证 | 说明                     |
| ---- | ---------------- | ---- | ------------------------ |
| POST | `/auth/register` | 否   | 用户注册                 |
| POST | `/auth/login`    | 否   | 用户登录                 |
| POST | `/auth/refresh`  | 否   | 刷新 Token               |
| GET  | `/auth/me`       | 是   | 获取当前用户信息         |
| POST | `/auth/logout`   | 是   | 登出（客户端清除 Token） |

#### 注册 `POST /auth/register`

```json
// 请求体
{
  "email": "user@example.com",      // 必填
  "password": "Abc123!@#",          // 必填，≥8位，含大小写+数字+特殊字符
  "username": "john",               // 可选，默认取邮箱前缀
  "first_name": "John",             // 可选
  "last_name": "Doe"                // 可选
}

// 成功响应 201
{
  "user": { "id": "uuid", "email": "...", "username": "...", ... },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

#### 登录 `POST /auth/login`

```json
// 请求体
{ "email": "user@example.com", "password": "Abc123!@#" }

// 成功响应 200
{
  "user": { ... },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

#### 刷新 Token `POST /auth/refresh`

```json
// 请求体
{ "refreshToken": "eyJ..." }

// 成功响应 200
{
  "user": { ... },
  "tokens": { "accessToken": "...", "refreshToken": "..." }
}
```

---

### 5.2 邮箱验证 & 密码重置 `/auth`

| 方法 | 路径                        | 认证 | 说明                                    |
| ---- | --------------------------- | ---- | --------------------------------------- |
| POST | `/auth/send-verification`   | 否   | 发送邮箱验证码（6 位数字，15 分钟有效） |
| POST | `/auth/verify-email`        | 否   | 验证邮箱                                |
| POST | `/auth/resend-verification` | 是   | 重新发送验证码（已登录用户）            |
| POST | `/auth/forgot-password`     | 否   | 发送密码重置码（10 分钟有效）           |
| POST | `/auth/reset-password`      | 否   | 重置密码                                |

**注意：**

- 验证码有发送冷却限制，重复请求会返回 `VERIFICATION_CODE_SENT`，`details.remaining_seconds` 为剩余等待秒数
- `forgot-password` 无论邮箱是否存在均返回 200（防止邮箱枚举攻击）

---

### 5.3 Magento 购物车 `/magento`（需认证）

| 方法 | 路径                          | 说明                                |
| ---- | ----------------------------- | ----------------------------------- |
| POST | `/magento/cart/create`        | 创建购物车（自动创建 Magento 客户） |
| POST | `/magento/cart/items/add`     | 添加商品到购物车                    |
| GET  | `/magento/cart/items`         | 获取购物车商品列表                  |
| POST | `/magento/cart/redirect-link` | 生成购物车重定向链接（10 分钟有效） |

#### 添加商品 `POST /magento/cart/items/add`

```json
// 简单商品
{ "sku": "PROD-001", "qty": 2, "storeId": 1 }

// 可配置商品（需传 productOptionsJson）
{
  "sku": "PROD-CONF-001",
  "qty": 1,
  "storeId": 1,
  "productOptionsJson": "{\"super_attribute\":{\"93\":\"56\",\"144\":\"167\"}}"
}
```

#### 购物车重定向链接

`POST /magento/cart/redirect-link` 返回的 `redirect_url` 可直接在浏览器打开，用户会自动登录 Magento 并跳转到结账页，有效期 10 分钟。

---

### 5.4 Magento 商品目录 `/magento`（无需认证）

| 方法 | 路径                              | 说明                           |
| ---- | --------------------------------- | ------------------------------ |
| GET  | `/magento/products`               | 产品列表（支持筛选/搜索/分页） |
| GET  | `/magento/products/:sku`          | 产品详情                       |
| GET  | `/magento/categories/tree`        | 分类树                         |
| GET  | `/magento/categories/:categoryId` | 分类详情                       |

#### 产品列表查询参数

| 参数         | 类型    | 说明                                                         |
| ------------ | ------- | ------------------------------------------------------------ |
| `categoryId` | integer | 按分类筛选                                                   |
| `keyword`    | string  | 名称/SKU 模糊搜索                                            |
| `skus`       | string  | 逗号分隔的 SKU 批量查询，如 `SKU1,SKU2`                      |
| `page`       | integer | 页码，默认 1                                                 |
| `pageSize`   | integer | 每页数量，默认 20                                            |
| `storeId`    | integer | Magento Store ID，默认 1                                     |
| `sort`       | string  | 排序字段：`entity_id`/`name`/`price`/`created_at`/`position` |
| `order`      | string  | `asc`/`desc`，默认 `desc`                                    |

> `sort=position` 需配合 `categoryId` 使用

---

## 六、用户对象结构

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "john",
  "first_name": "John",
  "last_name": "Doe",
  "email_verified": true,
  "active": true,
  "role": "user",
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z",
  "last_login_at": "2026-02-26T10:00:00Z"
}
```

---

## 七、常见对接注意事项

1. **密码强度**：注册和重置密码时，密码必须 ≥8 位，且同时包含大写字母、小写字母、数字和特殊字符，否则返回 400。

2. **Token 自动刷新**：建议在请求拦截器中统一处理 `TOKEN_EXPIRED`，静默调用 `/auth/refresh` 后重试原请求。

3. **Magento 接口响应**：`/magento/*` 接口响应体固定为 `{ success, data, error }` 三层结构，业务数据在 `data` 字段内。

4. **购物车流程**：首次使用购物车前需先调用 `POST /magento/cart/create`，该接口会自动在 Magento 中创建客户账号并绑定。

5. **可配置商品**：添加可配置商品时必须传 `productOptionsJson`，格式为 `{"super_attribute":{"属性ID":"选项值ID"}}`，属性 ID 和选项值 ID 从产品详情接口的 `configurable_options` 字段获取。

6. **502 错误处理**：Magento 服务不可用时返回 502，前端应提示"商城服务暂时不可用，请稍后重试"。

7. **请求追踪**：可在请求头加 `X-Request-Id: 自定义ID`，方便联调时追踪问题。
