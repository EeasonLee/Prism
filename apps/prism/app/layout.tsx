import type { Metadata } from 'next';
import { env } from '../lib/env';
import { Header } from './components/Header';
import './globals.css';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'Joydeem Kitchen Appliances - Dough Makers, Rice Cookers & More',
  description:
    'Explore the joy of cooking with Joydeem&#039;s kitchen appliances, designed to blend innovation, simplify cooking, and inspire creativity.',
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
