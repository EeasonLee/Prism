import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

type RevalidateRequestBody = {
  // 单个路径或路径列表，例如 /recipes/category/slug
  path?: string;
  paths?: string[];
  // 单个 tag 或 tag 列表
  tag?: string;
  tags?: string[];
  // 认证用 secret（可选，优先取 header/query）
  secret?: string;
};

const AUTH_HEADER = 'x-revalidate-secret';
const secretFromEnv = process.env.REVALIDATE_SECRET;

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function isNonEmptyArray(arr?: string[]): arr is string[] {
  return Array.isArray(arr) && arr.length > 0;
}

export async function POST(request: NextRequest) {
  if (!secretFromEnv) {
    return NextResponse.json(
      { message: 'Missing REVALIDATE_SECRET in environment' },
      { status: 500 }
    );
  }

  // 读取 secret：header > query > body
  const headerSecret = request.headers.get(AUTH_HEADER);
  const querySecret = request.nextUrl.searchParams.get('secret');
  const body: RevalidateRequestBody = await request
    .json()
    .catch(() => ({} as RevalidateRequestBody));
  const bodySecret = body.secret;

  const providedSecret = headerSecret || querySecret || bodySecret;
  if (providedSecret !== secretFromEnv) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const pathsToRevalidate: string[] = [];
  const tagsToRevalidate: string[] = [];

  if (body.path) {
    pathsToRevalidate.push(normalizePath(body.path));
  }
  if (isNonEmptyArray(body.paths)) {
    pathsToRevalidate.push(...body.paths.map(normalizePath));
  }
  if (body.tag) {
    tagsToRevalidate.push(body.tag);
  }
  if (isNonEmptyArray(body.tags)) {
    tagsToRevalidate.push(...body.tags);
  }

  if (pathsToRevalidate.length === 0 && tagsToRevalidate.length === 0) {
    return NextResponse.json(
      { message: 'path(s) or tag(s) is required' },
      { status: 400 }
    );
  }

  try {
    pathsToRevalidate.forEach(path => revalidatePath(path));
    tagsToRevalidate.forEach(tag => revalidateTag(tag));

    return NextResponse.json({
      revalidatedPaths: pathsToRevalidate,
      revalidatedTags: tagsToRevalidate,
      now: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Revalidation failed',
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
