import type { Metadata } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import { env } from '@/infrastructure/config/env';
import { Footer } from '@/app/_ui/Footer';
import { Header } from '@/app/_ui/Header';
import { MobileTabbar } from '@/app/_ui/MobileTabbar';
// import { PromoBar } from '@/app/_ui/PromoBar';
import './globals.css';
import { AppProviders } from './providers';
// import { DevtoolsPanel } from '@/infrastructure/api/devtools/panel';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

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
  const gtmId = env.NEXT_PUBLIC_GTM_CONTAINER_ID;

  return (
    <html
      lang="en"
      data-app={env.NODE_ENV}
      suppressHydrationWarning
      className={`${inter.variable} ${montserrat.variable}`}
    >
      <head>
        {gtmId && (
          <script
            id="gtm-init"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
        )}
      </head>
      <body className="mobile-tabbar-safe-padding">
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <AppProviders>
          {/* <PromoBar /> */}
          <Header />
          {children}
          <MobileTabbar />
          <Footer />
        </AppProviders>
        {/* {process.env.NODE_ENV === 'development' && <DevtoolsPanel />} */}
      </body>
    </html>
  );
}
