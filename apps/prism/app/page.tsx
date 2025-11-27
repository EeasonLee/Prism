import Link from 'next/link';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-white to-gray-50 px-6 py-12">
      <div className="max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Prism Framework
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Hello Next in Prism
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          一个由 Nx 驱动的 Next.js 模板，开箱即用的
          TypeScript、Tailwind、Vitest、 Playwright
          与日志/指标基线，帮助你更快落地通用前端框架。
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-slate-800"
        >
          查看文档
        </Link>
        <Link
          href="https://nx.dev"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300"
        >
          了解 Nx
        </Link>
      </div>
    </main>
  );
}
