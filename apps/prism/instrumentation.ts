export async function register() {
  // 开发环境跳过自签名证书验证（与 SSO 项目 MAGENTO_REJECT_UNAUTHORIZED=false 保持一致）
  if (process.env.NODE_ENV !== 'production') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}
