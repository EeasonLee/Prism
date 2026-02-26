/**
 * 统一的请求日志记录器
 * 支持客户端和服务端，格式统一，类似浏览器 Network 面板
 */

/**
 * 获取配置的日志级别
 */
function getConfiguredLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  if (typeof process === 'undefined' || !process.env) {
    return 'info';
  }

  const level = process.env.NEXT_PUBLIC_LOG_LEVEL as
    | 'debug'
    | 'info'
    | 'warn'
    | 'error'
    | undefined;

  if (
    level === 'debug' ||
    level === 'info' ||
    level === 'warn' ||
    level === 'error'
  ) {
    return level;
  }

  return 'info';
}

/**
 * 检查是否应该记录请求日志
 *
 * 规则：
 * - 开发环境：总是记录（不管日志级别）
 * - 生产环境：根据 NEXT_PUBLIC_LOG_LEVEL 决定
 *   - debug: 记录所有请求（包括成功和错误）
 *   - info/warn/error: 只记录错误请求（status >= 400）
 */
function shouldLogRequest(isError: boolean): boolean {
  const logLevel = getConfiguredLogLevel();

  // 检查是否为开发环境
  const isDevelopment =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development';

  // 开发环境：总是记录请求日志
  if (isDevelopment) {
    return true;
  }

  // 生产环境：根据日志级别决定
  // debug 级别：记录所有请求
  if (logLevel === 'debug') {
    return true;
  }

  // 其他级别（info/warn/error）：只记录错误请求
  return isError;
}

/**
 * 请求日志数据
 */
export interface RequestLogData {
  requestId: string;
  method: string;
  url: string;
  endpoint: string;
  status?: number;
  statusText?: string;
  duration: number;
  requestHeaders?: Record<string, string> | Headers;
  responseHeaders?: Headers;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: Error | string;
  timestamp: number;
  environment: 'client' | 'server';
}

/**
 * 生成请求 ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 格式化请求头（转换为普通对象）
 */
function formatHeaders(
  headers?: Record<string, string> | Headers
): Record<string, string> | undefined {
  if (!headers) return undefined;

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  return headers;
}

/**
 * 格式化 JSON 数据（安全处理大对象）
 */
function formatJSON(data: unknown, maxDepth = 3, currentDepth = 0): string {
  if (currentDepth >= maxDepth) {
    return '[Max Depth Reached]';
  }

  try {
    const json = JSON.stringify(data, null, 2);
    // 限制总长度
    if (json.length > 2000) {
      return `${json.slice(0, 2000)}... (truncated)`;
    }
    return json;
  } catch {
    return String(data);
  }
}

/**
 * 获取状态码颜色（用于控制台样式）
 */
function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return '#10b981'; // green
  if (status >= 300 && status < 400) return '#f59e0b'; // yellow
  if (status >= 400) return '#ef4444'; // red
  return '#6b7280'; // gray
}

/**
 * 获取 HTTP 方法颜色
 */
function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#0ea5e9', // blue
    POST: '#10b981', // green
    PUT: '#f59e0b', // orange
    PATCH: '#8b5cf6', // purple
    DELETE: '#ef4444', // red
  };
  return colors[method.toUpperCase()] || '#6b7280';
}

/**
 * 在浏览器控制台显示格式化日志（类似 Network 面板）
 */
function logToBrowserConsole(data: RequestLogData): void {
  const {
    method,
    url,
    status,
    statusText,
    duration,
    requestHeaders,
    responseHeaders,
    requestBody,
    responseBody,
    error,
  } = data;

  const methodColor = getMethodColor(method);
  const statusColor = status ? getStatusColor(status) : '#6b7280';

  // 提取 URL 路径（用于显示）
  let urlPath = url;
  try {
    const urlObj = new URL(url);
    urlPath = urlObj.pathname + urlObj.search;
  } catch {
    // 如果不是完整的 URL，直接使用
    urlPath = url;
  }

  // 构建标题行（类似 Network 面板的单行显示）
  // 格式: [Method] Path [Status] [Duration]
  let title = `%c${method.padEnd(6)}%c %c${urlPath}%c`;
  const styles: string[] = [
    `color: ${methodColor}; font-weight: bold; font-size: 11px; font-family: monospace`,
    'color: inherit; font-size: 11px',
    'color: #1e40af; font-size: 11px; cursor: pointer',
    'color: inherit; font-size: 11px',
  ];

  // 如果有状态码，添加状态和耗时
  if (status) {
    const statusLabel = `${status} ${statusText || ''}`;
    title += ` %c${statusLabel}%c %c${duration}ms`;
    styles.push(
      `color: ${statusColor}; font-weight: bold; font-size: 11px; font-family: monospace`,
      'color: inherit; font-size: 11px',
      'color: #6b7280; font-size: 10px; font-family: monospace'
    );
  } else if (error) {
    title += ` %c❌ Failed`;
    styles.push('color: #ef4444; font-weight: bold; font-size: 11px');
  }

  // 使用 console.groupCollapsed 创建默认折叠的日志组
  console.groupCollapsed(title, ...styles);

  // 请求详情（默认折叠，需要时才查看）
  if (requestHeaders || requestBody !== undefined) {
    console.groupCollapsed(
      '%c📤 Request Details',
      'color: #3b82f6; font-weight: bold'
    );
    if (requestHeaders) {
      console.log('%cHeaders:', 'color: #6b7280; font-weight: bold');
      console.table(formatHeaders(requestHeaders));
    }
    if (requestBody !== undefined) {
      console.log('%cBody:', 'color: #6b7280; font-weight: bold');
      // 如果已经是对象，直接显示；如果是字符串，尝试解析
      if (typeof requestBody === 'string') {
        try {
          console.log(JSON.parse(requestBody));
        } catch {
          console.log(requestBody);
        }
      } else {
        console.log(requestBody);
      }
    }
    console.groupEnd();
  }

  // 响应详情（默认展开，直接显示返回数据，这是最重要的信息）
  if (status && (responseHeaders || responseBody !== undefined)) {
    // 使用 console.group 而不是 groupCollapsed，这样在展开外层后自动展开
    console.group(
      '%c📥 Response Details',
      statusColor === '#10b981'
        ? 'color: #10b981; font-weight: bold'
        : 'color: #ef4444; font-weight: bold'
    );
    if (responseHeaders) {
      const formattedHeaders: Record<string, string> = {};
      responseHeaders.forEach((value, key) => {
        formattedHeaders[key] = value;
      });
      console.log('%cHeaders:', 'color: #6b7280; font-weight: bold');
      console.table(formattedHeaders);
    }
    if (responseBody !== undefined) {
      console.log('%cBody:', 'color: #6b7280; font-weight: bold');
      // 如果已经是对象，直接显示；如果是字符串，尝试解析
      if (typeof responseBody === 'string') {
        try {
          console.log(JSON.parse(responseBody));
        } catch {
          console.log(responseBody);
        }
      } else {
        console.log(responseBody);
      }
    }
    console.groupEnd();
  }

  // 错误详情（默认展开，便于调试）
  if (error) {
    console.group('%c❌ Error Details', 'color: #ef4444; font-weight: bold');
    if (error instanceof Error) {
      console.error(
        '%cMessage:',
        'color: #dc2626; font-weight: bold',
        error.message
      );
      if (error.stack) {
        console.error(
          '%cStack:',
          'color: #dc2626; font-weight: bold',
          error.stack
        );
      }
    } else {
      console.error('Error:', error);
    }
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * 在服务端控制台显示格式化日志
 */
function logToServerConsole(data: RequestLogData): void {
  const {
    requestId,
    method,
    url,
    status,
    statusText,
    duration,
    requestHeaders,
    requestBody,
    responseBody,
    error,
  } = data;

  // 构建单行日志（简洁格式）
  const statusText_ = status
    ? `${status} ${statusText || ''}`
    : error
    ? '❌ Failed'
    : 'Pending';

  const method_ = method.padEnd(7);
  const status_ = statusText_.padEnd(20);
  const duration_ = `${duration}ms`.padStart(8);

  // 使用颜色标识（ANSI 颜色代码）
  const methodColor = getMethodColor(method);
  const statusColor = status ? getStatusColor(status) : '#6b7280';

  // 转换为 ANSI 颜色（简化版，只处理常见颜色）
  let methodColorCode = '';
  let statusColorCode = '';

  if (methodColor === '#0ea5e9') methodColorCode = '\x1b[34m'; // blue
  else if (methodColor === '#10b981') methodColorCode = '\x1b[32m'; // green
  else if (methodColor === '#f59e0b') methodColorCode = '\x1b[33m'; // yellow
  else if (methodColor === '#ef4444') methodColorCode = '\x1b[31m'; // red

  if (statusColor === '#10b981') statusColorCode = '\x1b[32m'; // green
  else if (statusColor === '#f59e0b') statusColorCode = '\x1b[33m'; // yellow
  else if (statusColor === '#ef4444') statusColorCode = '\x1b[31m'; // red

  const resetCode = '\x1b[0m';

  // 构建标题（用于 console.group）
  const title = `${methodColorCode}${method_}${resetCode} ${url} ${statusColorCode}${status_}${resetCode} ${duration_} [${requestId.substring(
    0,
    13
  )}...]`;

  // 使用 console.groupCollapsed 创建默认折叠的日志组
  console.groupCollapsed(title);

  // 基本信息（类似表格格式）
  console.log('\x1b[90m┌─ Request Info ───────────\x1b[0m');
  console.log(`\x1b[90m│\x1b[0m ID:       \x1b[37m${requestId}\x1b[0m`);
  console.log(`\x1b[90m│\x1b[0m Method:   ${methodColorCode}${method}\x1b[0m`);
  console.log(`\x1b[90m│\x1b[0m URL:      \x1b[36m${url}\x1b[0m`);
  console.log(
    `\x1b[90m│\x1b[0m Status:   ${statusColorCode}${
      status ? `${status} ${statusText || ''}` : 'Pending'
    }\x1b[0m`
  );
  console.log(`\x1b[90m│\x1b[0m Duration: \x1b[37m${duration}ms\x1b[0m`);
  console.log(`\x1b[90m│\x1b[0m Env:      \x1b[37m${data.environment}\x1b[0m`);
  console.log('\x1b[90m└───────────────────────────\x1b[0m');

  // 安全地访问 process.env，避免在客户端环境中出错
  const isDevelopment =
    typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // 请求详情（平铺，避免 group 转发到浏览器后内容丢失）
    if (requestHeaders || requestBody !== undefined) {
      console.log('  \x1b[34m📤 Request Details\x1b[0m');
      if (requestHeaders) {
        console.log(
          '\x1b[90m    Headers:\x1b[0m',
          formatHeaders(requestHeaders)
        );
      }
      if (requestBody !== undefined) {
        console.log('\x1b[90m    Body:\x1b[0m');
        try {
          const parsed =
            typeof requestBody === 'string'
              ? JSON.parse(requestBody)
              : requestBody;
          console.log(parsed);
        } catch {
          console.log(requestBody);
        }
      }
    }

    // 响应详情 —— 用平铺 console.log 而非 console.group，
    // 确保 Next.js 转发到浏览器 DevTools 时内容可见（group 内层日志转发后会丢失）
    if (responseBody !== undefined && status) {
      const isSuccess = status >= 200 && status < 300;
      const sectionLabel = isSuccess
        ? '\x1b[32m📥 Response Details\x1b[0m'
        : '\x1b[31m📥 Response Details\x1b[0m';

      console.log(`  ${sectionLabel}`);
      console.log('\x1b[90m    Body:\x1b[0m');

      const bodyStr = formatJSON(responseBody, 2);
      try {
        const parsed =
          typeof responseBody === 'string'
            ? JSON.parse(responseBody)
            : responseBody;
        console.log(parsed);
      } catch {
        console.log(responseBody);
      }
      if (bodyStr.length > 500) {
        console.log(
          `\x1b[90m    ... (response truncated, full length: ${bodyStr.length} chars)\x1b[0m`
        );
      }
    }

    // 错误详情（平铺，避免 group 转发到浏览器后内容丢失）
    if (error) {
      console.log('  \x1b[31m❌ Error Details\x1b[0m');
      if (error instanceof Error) {
        console.error('\x1b[31m    Message:\x1b[0m', error.message);
        if (error.stack) {
          console.error('\x1b[31m    Stack:\x1b[0m', error.stack);
        }
      } else {
        console.error('\x1b[31m    Error:\x1b[0m', error);
      }
    }
  }

  // 结束分组
  console.groupEnd();
}

/**
 * 记录请求日志
 */
export function logRequest(
  data: Omit<RequestLogData, 'requestId' | 'timestamp' | 'environment'>
): void {
  const requestId = generateRequestId();
  const timestamp = Date.now();

  // 直接内联环境检测，避免函数调用问题
  // 在 Next.js 中，typeof window === 'undefined' 是最可靠的检测方式
  const environment: 'client' | 'server' =
    typeof window === 'undefined' ? 'server' : 'client';

  const logData: RequestLogData = {
    ...data,
    requestId,
    timestamp,
    environment,
  };

  // 检查是否应该记录日志（考虑 NEXT_PUBLIC_LOG_LEVEL 配置）
  const isError =
    !!data.error || (data.status !== undefined && data.status >= 400);
  if (!shouldLogRequest(isError)) {
    return;
  }

  // 根据环境选择日志输出方式
  if (environment === 'client') {
    logToBrowserConsole(logData);
  } else {
    logToServerConsole(logData);
  }
}

/**
 * 记录请求开始（仅用于追踪）
 * @deprecated 当前实现中未使用，保留以便将来扩展
 */
export function logRequestStart(
  _method: string,
  _url: string,
  _endpoint: string
): string {
  const requestId = generateRequestId();
  // 请求开始时不立即打印，等待请求完成一起打印
  return requestId;
}
