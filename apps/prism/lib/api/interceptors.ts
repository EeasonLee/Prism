/**
 * 浏览器端请求拦截器
 * 在浏览器控制台显示类似 Network 面板的请求信息
 */

interface RequestLog {
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders?: RequestInit['headers'];
  responseHeaders?: Headers;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: Error;
}

/**
 * 格式化请求日志（类似浏览器 Network 面板）
 */
function formatRequestLog(log: RequestLog): string {
  const { method, url, status, statusText, duration, error } = log;

  if (error) {
    return `%c${method}%c ${url} %c❌ ${error.message}`;
  }

  if (status) {
    return `%c${method}%c ${url} %c${status} ${
      statusText || ''
    }%c ${duration}ms`;
  }

  return `%c${method}%c ${url}`;
}

/**
 * 获取样式参数
 */
function getStyleArgs(log: RequestLog): string[] {
  const { method, status, error } = log;

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'color: #0ea5e9; font-weight: bold',
      POST: 'color: #10b981; font-weight: bold',
      PUT: 'color: #f59e0b; font-weight: bold',
      PATCH: 'color: #8b5cf6; font-weight: bold',
      DELETE: 'color: #ef4444; font-weight: bold',
    };
    return colors[method] || 'color: #999; font-weight: bold';
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'color: #0c0; font-weight: bold';
    if (status >= 300 && status < 400) return 'color: #fa0; font-weight: bold';
    if (status >= 400) return 'color: #f00; font-weight: bold';
    return 'color: #999';
  };

  const styles: string[] = [getMethodColor(method), 'color: inherit'];

  if (error) {
    styles.push('color: #f00; font-weight: bold');
  } else if (status) {
    styles.push(getStatusColor(status), 'color: #999; font-size: 0.9em');
  }

  return styles;
}

/**
 * 在浏览器控制台显示请求日志（仅开发环境）
 */
export function logRequest(log: RequestLog): void {
  // 只在浏览器环境且开发环境下执行

  if (
    typeof (globalThis as { window?: unknown }).window === 'undefined' ||
    process.env.NODE_ENV !== 'development'
  ) {
    return;
  }

  const format = formatRequestLog(log);
  const styles = getStyleArgs(log);

  // 使用 console.group 创建可展开的日志组
  console.group(format, ...styles);

  // 请求信息
  console.log('%cRequest:', 'color: #666; font-weight: bold', {
    method: log.method,
    url: log.url,
    headers: log.requestHeaders,
    body: log.requestBody,
  });

  // 响应信息
  if (log.status) {
    console.log('%cResponse:', 'color: #666; font-weight: bold', {
      status: log.status,
      statusText: log.statusText,
      duration: `${log.duration}ms`,
      headers: log.responseHeaders
        ? Object.fromEntries(log.responseHeaders.entries())
        : undefined,
      body: log.responseBody,
    });
  }

  // 错误信息
  if (log.error) {
    console.error('%cError:', 'color: #f00; font-weight: bold', log.error);
  }

  console.groupEnd();
}

/**
 * 简化版日志（单行显示，仅开发环境）
 */
export function logRequestSimple(log: RequestLog): void {
  // 只在浏览器环境且开发环境下执行

  if (
    typeof (globalThis as { window?: unknown }).window === 'undefined' ||
    process.env.NODE_ENV !== 'development'
  ) {
    return;
  }

  const format = formatRequestLog(log);
  const styles = getStyleArgs(log);

  console.log(format, ...styles);
}
