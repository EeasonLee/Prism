'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Youtube } from 'lucide-react';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { useAuth } from '@/features/auth';
import { useAuthModal } from '@/features/auth';
import { env } from '@/infrastructure/config/env';
import {
  FacebookBrandIcon,
  InstagramBrandIcon,
} from './share/social-brand-icons';

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

const SOCIAL_LINKS = [
  {
    href: 'https://www.facebook.com/joydeemkitchen',
    label: 'Facebook',
    icon: FacebookBrandIcon,
  },
  {
    href: 'https://www.instagram.com/joydeemkitchen',
    label: 'Instagram',
    icon: InstagramBrandIcon,
  },
  {
    href: 'https://www.youtube.com/@Joydeem',
    label: 'YouTube',
    icon: Youtube,
  },
];

const PAYMENT_METHODS = [
  {
    label: 'American Express',
    src: '/images/payments/amex.svg',
    width: 36,
    height: 24,
  },
  {
    label: 'Google Pay',
    src: '/images/payments/google-pay.svg',
    width: 56,
    height: 24,
  },
  {
    label: 'Mastercard',
    src: '/images/payments/mastercard.svg',
    width: 38,
    height: 24,
  },
  {
    label: 'PayPal',
    src: '/images/payments/paypal.svg',
    width: 58,
    height: 24,
  },
  {
    label: 'Shop Pay',
    src: '/images/payments/shop-pay.svg',
    width: 64,
    height: 24,
  },
  {
    label: 'Visa',
    src: '/images/payments/visa.svg',
    width: 50,
    height: 24,
  },
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
                  <ul className="flex flex-wrap gap-3 pt-1">
                    {SOCIAL_LINKS.map(({ href, label, icon: Icon }) => (
                      <li key={label}>
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Visit Joydeem on ${label}`}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-600">
                      We accept
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {PAYMENT_METHODS.map(({ label, src, width, height }) => (
                        <li key={label}>
                          <span className="inline-flex h-8 items-center justify-center rounded bg-white px-2 shadow-sm">
                            <Image
                              src={src}
                              alt={label}
                              width={width}
                              height={height}
                              className="max-h-5 w-auto"
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
