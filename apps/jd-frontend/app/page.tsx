import { Button, PageContainer } from '@prism/ui';

const preservedLayers = [
  'Nx workspace',
  'Next.js app shell',
  'Design tokens',
  'Shared UI primitives',
  'Infrastructure folders',
];

export default function HomePage() {
  return (
    <main className="flex-1">
      <section className="border-b border-border bg-surface">
        <PageContainer className="py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              Prism Starter
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground md:text-6xl">
              Business code has been cleared.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              This app is back to a clean framework state with the workspace,
              design system, shared utilities, and application shell preserved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button>Start building</Button>
              <Button variant="outline">View components</Button>
            </div>
          </div>
        </PageContainer>
      </section>

      <section>
        <PageContainer className="py-12 md:py-16">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {preservedLayers.map(layer => (
              <div
                key={layer}
                className="rounded-md border border-border bg-card p-4 text-sm font-medium text-card-foreground"
              >
                {layer}
              </div>
            ))}
          </div>
        </PageContainer>
      </section>
    </main>
  );
}
