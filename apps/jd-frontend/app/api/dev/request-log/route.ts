import { NextResponse } from 'next/server';

export async function GET() {
  const { tracer } = await import('@/core/api/tracer');
  if (!tracer) {
    return NextResponse.json(
      { error: 'Tracer not available in production' },
      { status: 404 }
    );
  }
  return NextResponse.json(tracer.getAll());
}

export async function DELETE() {
  const { tracer } = await import('@/core/api/tracer');
  if (tracer) {
    tracer.clear();
  }
  return NextResponse.json({ ok: true });
}
