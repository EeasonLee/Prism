'use client';

import Link from 'next/link';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { useAuth } from '@/features/auth/auth.context';
import { useAuthModal } from '@/features/auth/auth-modal.context';
import { env } from '@/core/config/env';

interface InfoLinkItem {
  href: string;
  label: string;
  requiresAuth: boolean;
  loginOnly?: boolean;
}

const INFO_LINKS: InfoLinkItem[] = [
  { href: '', label: 'Login', requiresAuth: false, loginOnly: true },
  { href: '/account', label: 'My Account', requiresAuth: true },
  { href: '/account/orders', label: 'My Order', requiresAuth: true },
  { href: '/cart', label: 'My Cart', requiresAuth: true },
  { href: '/account/wishlist', label: 'Wishlist', requiresAuth: true },
];

const SERVICE_LINKS = [
  { href: '/about-us', label: 'About Us' },
  { href: '/contact-us', label: 'Contact Us' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/return-policy', label: 'Returns Policy' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
  { href: '/payment-policy', label: 'Payment Policy' },
  { href: '/terms-of-use', label: 'Terms of Use' },
  { href: '/faqs', label: 'FAQs' },
];

export function Footer() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <footer className="bg-neutral-950">
      <PageContainer className="py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-0">
          <div className="flex-1 lg:pl-12">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Information
                </h4>
                <ul className="space-y-3 text-sm">
                  {INFO_LINKS.filter(
                    link => !(isAuthenticated && link.loginOnly)
                  ).map(({ href, label, requiresAuth, loginOnly }) => (
                    <li key={label}>
                      {loginOnly ? (
                        <button
                          type="button"
                          className="text-neutral-400 transition hover:text-white"
                          onClick={() => openLogin('signin')}
                        >
                          {label}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          className="text-neutral-400 transition hover:text-white"
                          onClick={event => {
                            if (requiresAuth && !isAuthenticated) {
                              event.preventDefault();
                              openLogin('signin');
                            }
                          }}
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Services
                </h4>
                <ul className="space-y-3 text-sm">
                  {SERVICE_LINKS.map(({ href, label }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-neutral-400 transition hover:text-white"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-2">
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Company
                </h4>
                <div className="space-y-3 text-sm text-neutral-400">
                  <p>
                    <a
                      href="mailto:customerservice@joydeem.com"
                      className="break-all hover:text-white"
                    >
                      customerservice@joydeem.com
                    </a>
                  </p>
                  <p>
                    Call Us：
                    <a href="tel:888-381-8996" className="hover:text-white">
                      888-381-8996
                    </a>
                    <span className="ml-2 text-xs text-neutral-600">
                      Mon–Fri, 10 AM – 6 PM EST
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-neutral-800 pt-6">
          <p className="text-center text-xs text-neutral-600">
            © {new Date().getFullYear()} Joydeem. All rights reserved.
            {env.NEXT_PUBLIC_APP_VERSION && (
              <span className="ml-2 hidden">
                v{env.NEXT_PUBLIC_APP_VERSION}
              </span>
            )}
          </p>
        </div>
      </PageContainer>
    </footer>
  );
}
