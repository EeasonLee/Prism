import type { Metadata } from 'next';
import { env } from '@/infrastructure/config/env';
import { Footer } from '@/app/_ui/Footer';
import { Header } from '@/app/_ui/Header';
import { MobileTabbar } from '@/app/_ui/MobileTabbar';
// import { PromoBar } from '@/app/_ui/PromoBar';
import './globals.css';
import { AppProviders } from './providers';
import { DevtoolsPanel } from '@/infrastructure/api/devtools/panel';

export const metadata: Metadata = {
  title: 'Joydeem Kitchen Appliances - Dough Makers, Rice Cookers & More',
  description:
    'Explore the joy of cooking with Joydeem kitchen appliances, designed to blend innovation, simplify cooking, and inspire creativity.',
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  icons: {
    icon: 'https://www.joydeem.com/media/favicon/stores/14/joydeem_logo_html_2.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-app={env.NODE_ENV} suppressHydrationWarning>
      <body className="mobile-tabbar-safe-padding">
        <AppProviders>
          {/* <PromoBar /> */}
          <Header />
          {children}
          <MobileTabbar />
          <Footer />
        </AppProviders>
        {process.env.NODE_ENV === 'development' && <DevtoolsPanel />}
      </body>
    </html>
  );
}
