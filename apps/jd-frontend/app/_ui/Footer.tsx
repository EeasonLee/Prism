import { PageContainer } from '@prism/ui';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <PageContainer className="flex flex-col gap-2 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>Prism frontend starter</p>
        <p>Built with Nx and Next.js</p>
      </PageContainer>
    </footer>
  );
}
