import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-border bg-surface">
        <div className="hr-container flex flex-col items-start gap-6 py-16 md:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            Huaren Store
          </p>
          <h1 className="max-w-2xl text-4xl font-bold leading-tight text-ink md:text-5xl">
            华人商城前端已就绪
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
            共享底层 API 与目录结构，UI 独立开发。接下来可按业务模块在{' '}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-sm">
              features/
            </code>{' '}
            中逐步扩展。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/categories" className="hr-btn-primary">
              浏览分类
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-touch items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              搜索商品
            </Link>
          </div>
        </div>
      </section>

      <section className="hr-container py-12">
        <h2 className="text-lg font-semibold text-ink">开发说明</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-muted">
          <li>开发端口：3093（`pnpm dev:hr`）</li>
          <li>共享层：`infrastructure/`（API 客户端、配置、日志）</li>
          <li>UI 层：`app/_ui/`、`ui/tokens.css`（与 Joydeem 独立）</li>
          <li>业务模块：在 `features/` 下按领域扩展</li>
        </ul>
      </section>
    </main>
  );
}
