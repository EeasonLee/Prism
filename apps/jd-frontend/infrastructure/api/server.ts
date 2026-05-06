/**
 * 统一 API 层 — 仅服务端
 *
 * 客户端组件引入此文件 → 构建报错（'server-only' 包保证）。
 */

import { magentoServerClient } from './clients/magento-server';

export { magentoServerClient };

export const apiServer = {
  magento: magentoServerClient,
};
