import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../lib/env';
import { createLogger } from '../../../../lib/observability/logger';

const logger = createLogger('api-proxy');

/**
 * 处理代理请求
 */
async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // 获取 API 基础 URL
    const apiBaseUrl = env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      logger.error('API URL not configured');
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // 构建目标 URL
    const path = pathSegments.join('/');
    const targetUrl = `${apiBaseUrl}/api/${path}`;

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    // 准备请求头，沿用部分来源头以避免被网关识别为"非浏览器"
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent':
        request.headers.get('user-agent') ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      Referer: request.headers.get('referer') || apiBaseUrl || '',
      Origin: request.headers.get('origin') || apiBaseUrl || '',
    };

    // 添加认证 token（从环境变量读取，服务端专用，不会暴露到客户端）
    if (env.STRAPI_API_TOKEN) {
      headers['token'] = env.STRAPI_API_TOKEN;
    }

    // 准备请求体（POST/PUT/PATCH 请求）
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch {
        // 如果没有请求体或解析失败，忽略
      }
    }

    // 转发请求到后端
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    });

    // 获取响应数据
    const data = await response.text();

    // 尝试解析 JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // 记录错误日志
    if (!response.ok) {
      logger.error('Proxy request failed', {
        method,
        url: fullUrl,
        status: response.status,
        statusText: response.statusText,
      });
    }

    // 返回响应
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    logger.error('Proxy request error', {
      error: error instanceof Error ? error.message : String(error),
      method,
      path: pathSegments.join('/'),
    });

    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'DELETE');
}
