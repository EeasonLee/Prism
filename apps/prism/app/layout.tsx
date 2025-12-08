import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { Header } from './components/Header';
import { env } from '../lib/env';

export const metadata: Metadata = {
  title: 'Prism',
  description: 'Prism monorepo powered by Nx + Next.js',
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-app={env.NODE_ENV}>
      <body>
        <AppProviders>
          <Header />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
