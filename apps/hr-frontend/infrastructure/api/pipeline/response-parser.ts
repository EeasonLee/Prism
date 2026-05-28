/**
 * 响应体解析器 — Content-Type 感知
 */

export async function parseResponseBody<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('Content-Type') ?? '';

  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  // 非 JSON 响应 → 文本
  const text = await res.text();

  // 空响应
  if (!text) {
    return undefined as unknown as T;
  }

  // 尝试 JSON 兜底（某些 API 不设 Content-Type 但返回 JSON）
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      return JSON.parse(text) as T;
    } catch {
      // 不是合法 JSON，返回文本
    }
  }

  return text as unknown as T;
}
