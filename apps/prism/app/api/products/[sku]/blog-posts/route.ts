import { NextResponse } from 'next/server';

export const revalidate = 3600;

// TODO: 接入数据源（Strapi / Magento 自定义属性）后实现
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku: _sku } = await params;

  return NextResponse.json({ success: true, data: [], error: null });
}
