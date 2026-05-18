import { PageContainer } from '@prism/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <PageContainer className="max-w-lg py-10">{children}</PageContainer>
    </main>
  );
}
