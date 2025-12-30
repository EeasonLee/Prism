/**
 * 工具类型定义
 *
 * 提供常用的 TypeScript 工具类型
 */

/**
 * 深度只读类型
 * 将所有层级的属性都设为只读
 *
 * @example
 * type ReadonlyArticle = DeepReadonly<Article>;
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深度部分类型
 * 将所有层级的属性都设为可选
 *
 * @example
 * type PartialArticle = DeepPartial<Article>;
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 提取 Promise 的返回类型
 *
 * @example
 * type ArticleData = Awaited<Promise<Article>>;
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * 非空类型
 * 排除 null 和 undefined
 *
 * @example
 * type NonNullString = NonNullable<string | null | undefined>;
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 键值对类型
 *
 * @example
 * type StringMap = KeyValuePair<string, string>;
 */
export type KeyValuePair<K extends string | number | symbol, V> = {
  [key in K]: V;
};

/**
 * 可选属性类型
 * 将指定键设为可选
 *
 * @example
 * type ArticleWithOptionalId = Optional<Article, 'id'>;
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 必需属性类型
 * 将指定键设为必需
 *
 * @example
 * type ArticleWithRequiredId = Required<Article, 'id'>;
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * 值类型
 * 提取对象的值类型
 *
 * @example
 * type Value = ValueOf<{ a: string; b: number }>; // string | number
 */
export type ValueOf<T> = T[keyof T];

/**
 * 数组元素类型
 * 提取数组的元素类型
 *
 * @example
 * type Item = ArrayElement<string[]>; // string
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * 函数参数类型
 * 提取函数的参数类型元组
 *
 * @example
 * type Params = Parameters<(a: string, b: number) => void>; // [string, number]
 */
export type Parameters<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: infer P
) => unknown
  ? P
  : never;

/**
 * 函数返回类型
 * 提取函数的返回类型
 *
 * @example
 * type Return = ReturnType<() => string>; // string
 */
export type ReturnType<T extends (...args: unknown[]) => unknown> = T extends (
  ...args: unknown[]
) => infer R
  ? R
  : unknown;
