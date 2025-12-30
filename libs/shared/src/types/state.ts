/**
 * 状态管理类型定义
 *
 * 定义通用的状态管理类型，用于服务端和客户端状态
 */

/**
 * 异步状态类型
 * 表示一个异步操作的三种状态：加载中、成功、失败
 *
 * @template T 数据类型
 * @template E 错误类型（默认为 Error）
 *
 * @example
 * const [state, setState] = useState<AsyncState<Article>>({
 *   data: null,
 *   loading: false,
 *   error: null,
 * });
 */
export interface AsyncState<T, E = Error> {
  /** 数据（成功时） */
  data: T | null;
  /** 是否加载中 */
  loading: boolean;
  /** 错误信息（失败时） */
  error: E | null;
}

/**
 * 分页状态类型
 * 扩展异步状态，添加分页信息
 *
 * @template T 数据项类型
 *
 * @example
 * const [state, setState] = useState<PaginatedState<ArticleListItem>>({
 *   data: null,
 *   loading: false,
 *   error: null,
 *   pagination: {
 *     page: 1,
 *     pageSize: 10,
 *     total: 0,
 *     hasMore: false,
 *   },
 * });
 */
export interface PaginatedState<T> extends AsyncState<T[]> {
  /** 分页信息 */
  pagination: {
    /** 当前页码（从 1 开始） */
    page: number;
    /** 每页数量 */
    pageSize: number;
    /** 总数量 */
    total: number;
    /** 是否还有更多数据 */
    hasMore: boolean;
  };
}

/**
 * 状态操作类型
 * 用于 reducer 模式的状态更新操作
 *
 * @template T 数据类型
 *
 * @example
 * type ArticleStateAction = StateAction<Article>;
 *
 * const reducer = (state: AsyncState<Article>, action: ArticleStateAction) => {
 *   switch (action.type) {
 *     case 'LOADING':
 *       return { ...state, loading: true, error: null };
 *     case 'SUCCESS':
 *       return { data: action.payload, loading: false, error: null };
 *     case 'ERROR':
 *       return { data: null, loading: false, error: action.payload };
 *     case 'RESET':
 *       return { data: null, loading: false, error: null };
 *   }
 * };
 */
export type StateAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };

/**
 * 状态更新函数类型
 *
 * @template T 数据类型
 */
export type StateUpdater<T> = (state: AsyncState<T>) => AsyncState<T>;

/**
 * 创建初始异步状态
 *
 * @template T 数据类型
 * @returns 初始状态对象
 *
 * @example
 * const initialState = createInitialAsyncState<Article>();
 */
export function createInitialAsyncState<T>(): AsyncState<T> {
  return {
    data: null,
    loading: false,
    error: null,
  };
}

/**
 * 创建初始分页状态
 *
 * @template T 数据项类型
 * @param pageSize - 每页数量（默认 10）
 * @returns 初始状态对象
 *
 * @example
 * const initialState = createInitialPaginatedState<ArticleListItem>(20);
 */
export function createInitialPaginatedState<T>(
  pageSize = 10
): PaginatedState<T> {
  return {
    data: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      pageSize,
      total: 0,
      hasMore: false,
    },
  };
}
