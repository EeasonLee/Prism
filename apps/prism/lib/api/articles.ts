/**
 * Blog API 包装文件
 *
 * 将 blog 库的查询函数与应用层的 apiClient 绑定
 */

import { apiClient } from './client';
import { setApiClient } from '@prism/blog';

// 初始化 blog 库的 apiClient
setApiClient(apiClient);

// 重新导出 blog 库的所有 API 函数和类型
export * from '@prism/blog';
