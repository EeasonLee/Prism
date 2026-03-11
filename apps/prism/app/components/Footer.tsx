'use client';

import { useState } from 'react';
import { Facebook, Instagram, Youtube, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { PageContainer } from '@prism/ui/components/PageContainer';
import { Button } from '@prism/ui/components/button';
import { Checkbox } from '@prism/ui/components/checkbox';
import { env } from '../../lib/env';

const SOCIAL_LINKS: { Icon: LucideIcon; href: string; label: string }[] = [
  {
    Icon: Facebook,
    href: 'https://www.facebook.com/joydeem',
    label: 'Facebook',
  },
  {
    Icon: Instagram,
    href: 'https://www.instagram.com/joydeem',
    label: 'Instagram',
  },
  { Icon: Youtube, href: 'https://www.youtube.com/joydeem', label: 'YouTube' },
];

const INFO_LINKS = [
  { href: 'https://www.joydeem.com/customer/account/', label: 'My Account' },
  { href: 'https://www.joydeem.com/customer/account/login/', label: 'Login' },
  { href: 'https://www.joydeem.com/checkout/cart/', label: 'My Cart' },
  { href: 'https://www.joydeem.com/wishlist/', label: 'Wishlist' },
  { href: 'https://www.joydeem.com/checkout/', label: 'Checkout' },
];

const SERVICE_LINKS = [
  { href: 'https://www.joydeem.com/aboutus', label: 'About Us' },
  { href: 'https://www.joydeem.com/privacy-policy', label: 'Privacy Policy' },
  { href: 'https://www.joydeem.com/faqs', label: 'FAQs' },
  { href: 'https://www.joydeem.com/return-policy', label: 'Returns Policy' },
  { href: 'https://www.joydeem.com/shipping-policy', label: 'Shipping Policy' },
  { href: 'https://www.joydeem.com/terms-of-use', label: 'Terms of Use' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreeTerms) return;
    // TODO: 对接订阅接口
    void Promise.resolve();
  };

  return (
    <footer className="bg-neutral-950">
      <PageContainer className="py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-0">
          {/* Left: Newsletter — 占 1/3 */}
          <div className="shrink-0 lg:w-1/3 lg:pr-12">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand">
              Exclusive Offer
            </p>
            <p className="mb-6 text-xl font-semibold leading-snug text-white">
              Get 10% off* one item when you subscribe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="footer-email"
                  className="mb-2 block text-xs text-neutral-400"
                >
                  Email address
                </label>
                <div className="flex gap-2">
                  <input
                    id="footer-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-9 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-white placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none"
                  />
                  <Button
                    type="submit"
                    disabled={!agreeTerms}
                    size="sm"
                    className="shrink-0 px-5"
                  >
                    Sign up
                  </Button>
                </div>
              </div>

              {/* 隐私同意条款 */}
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="footer-terms"
                  checked={agreeTerms}
                  onCheckedChange={checked => setAgreeTerms(checked === true)}
                  className="mt-0.5 shrink-0 border-neutral-600 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                  aria-label="Agree to Terms and Privacy Policy"
                />
                <label
                  htmlFor="footer-terms"
                  className="cursor-pointer text-xs leading-relaxed text-neutral-400"
                >
                  I agree to the{' '}
                  <Link
                    href="https://www.joydeem.com/terms-of-use"
                    className="underline hover:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="https://www.joydeem.com/privacy-policy"
                    className="underline hover:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              <p className="text-xs text-neutral-600">
                *New subscribers only. Limited to 1 item.{' '}
                <Link
                  href="https://www.joydeem.com/faqs"
                  className="underline hover:text-neutral-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View exclusions
                </Link>
                .
              </p>
            </form>

            {/* 社交媒体 */}
            <div className="mt-8 border-t border-neutral-800 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                Follow us
              </p>
              <div className="flex items-center gap-2">
                {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 transition hover:bg-neutral-700 hover:text-white"
                    aria-label={label}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="hidden w-px bg-neutral-800 lg:block" />

          {/* Right: 三列链接 — 占 2/3，排列 Information(1) + Services(1) + Company(2) */}
          <div className="flex-1 lg:pl-12">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {/* Information — 1 格 */}
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Information
                </h4>
                <ul className="space-y-3 text-sm">
                  {INFO_LINKS.map(({ href, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-neutral-400 transition hover:text-white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services — 1 格 */}
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  Services
                </h4>
                <ul className="space-y-3 text-sm">
                  {SERVICE_LINKS.map(({ href, label }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-neutral-400 transition hover:text-white"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company — 2 格 */}
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
                    <a href="tel:888-381-8996" className="hover:text-white">
                      888-381-8996
                    </a>
                    <span className="ml-2 text-xs text-neutral-600">
                      Mon–Fri, 10 AM – 6 PM EST
                    </span>
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    HK: Room A, 9/F, Eton Building, 288 Des Voeux Rd Central,
                    Sheung Wan, Hong Kong
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    CA: 23 Hubner Ave, Markham ON L6C 0S8, Canada
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
