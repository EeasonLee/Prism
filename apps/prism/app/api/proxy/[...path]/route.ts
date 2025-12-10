import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../lib/env';

/**
 * Next.js API 代理路由
 * 用于代理所有后端的请求，避免 CORS 问题
 *
 * 使用方式：
 * - 前端请求: /api/proxy/recipe-filters/types
 * - 实际转发到: env.NEXT_PUBLIC_API_URL/api/recipe-filters/types
 */
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'DELETE');
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // 获取 API 基础 URL
    const apiBaseUrl = env.NEXT_PUBLIC_API_URL;

    // 构建目标 URL
    const path = pathSegments.join('/');
    const targetUrl = `${apiBaseUrl}/api/${path}`;

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 如果需要，可以在这里添加认证头
    // const authToken = request.headers.get('authorization');
    // if (authToken) {
    //   headers['Authorization'] = authToken;
    // }

    // 准备请求体（仅 POST/PUT 请求）
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT') {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch {
        // 如果没有请求体，忽略
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
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // 返回响应
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy request failed:', error);
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
