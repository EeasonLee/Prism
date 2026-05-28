import type { Metadata } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import { env } from '@/infrastructure/config/env';
import { Footer } from '@/app/_ui/Footer';
import { Header } from '@/app/_ui/Header';
import { AppProviders } from './providers';
import './globals.css';

const notoSans = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export function generateMetadata(): Metadata {
  const isTestEnv = env.NEXT_PUBLIC_APP_URL?.includes('test');

  return {
    title: '华人商城 - 北美华人生活好物',
    description: '华人商城，精选厨房电器与生活好物，服务北美华人社区。',
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
    ...(isTestEnv && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      data-app={env.NODE_ENV}
      suppressHydrationWarning
      className={notoSans.variable}
    >
      <body className="flex min-h-screen flex-col">
        <AppProviders>
          <Header />
          {children}
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
