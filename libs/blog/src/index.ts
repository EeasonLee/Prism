/**
 * Blog 业务域库
 *
 * 包含 Blog 业务域的所有代码：
 * - API 类型和函数
 * - 业务组件
 * - 业务 Hooks
 */

// 显式导出 API 类型和函数
export * from './api/types';
export * from './api/queries';
export type { ApiClientAdapter } from './api/client-adapter';

// 显式导出组件（避免与类型命名冲突）
export { ArticleDetail } from './components/ArticleDetail';
export * from './components/ArticleSearchBox';
export * from './components/ArticlesSearchClient';
export * from './components/ArticleSidebar';
export * from './components/Breadcrumb';
export * from './components/ProductCategories';
export * from './components/ThemeCategories';

// export * from './hooks';
