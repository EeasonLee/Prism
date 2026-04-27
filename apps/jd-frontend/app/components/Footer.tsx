'use client';

// import { useState } from 'react';
// import { Facebook, Instagram, Youtube, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { PageContainer } from '@prism/ui/components/PageContainer';
// import { Button } from '@prism/ui/components/button';
// import { Checkbox } from '@prism/ui/components/checkbox';
import { useAuth } from '../../lib/auth/context';
import { useAuthModal } from '../../lib/auth-modal/context';
import { env } from '../../lib/env';

// const SOCIAL_LINKS: { Icon: LucideIcon; href: string; label: string }[] = [
//   {
//     Icon: Facebook,
//     href: 'https://www.facebook.com/joydeem',
//     label: 'Facebook',
//   },
//   {
//     Icon: Instagram,
//     href: 'https://www.instagram.com/joydeem',
//     label: 'Instagram',
//   },
//   { Icon: Youtube, href: 'https://www.youtube.com/joydeem', label: 'YouTube' },
// ];

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
  // { href: '/wishlist', label: 'Wishlist' },
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
  // const [email, setEmail] = useState('');
  // const [agreeTerms, setAgreeTerms] = useState(false);

  // const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (!agreeTerms) return;
  //   // TODO: 对接订阅接口
  //   void Promise.resolve();
  // };

  return (
    <footer className="bg-neutral-950">
      <PageContainer className="py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-0">
          {/* Left: Newsletter — 占 1/3 */}
          {/* <div className="shrink-0 lg:w-1/3 lg:pr-12">
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

          <div className="hidden w-px bg-neutral-800 lg:block" /> */}

          {/* Right: 三列链接 — 占 2/3，排列 Information(1) + Services(1) + Company(2) */}
          <div className="flex-1 lg:pl-12">
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {/* Information — 1 格 */}
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

              {/* Services — 1 格 */}
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
                    Call Us：
                    <a href="tel:888-381-8996" className="hover:text-white">
                      888-381-8996
                    </a>
                    <span className="ml-2 text-xs text-neutral-600">
                      Mon–Fri, 10 AM – 6 PM EST
                    </span>
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-500">
                    Company Address:
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    US Address: 1926 Kingston Meadow Ln, Katy, TX 77494 US
                  </p>
                  <p className="text-xs leading-relaxed text-neutral-600">
                    Canada Address: 23 Hubner Ave Markham ON L6C 0S8 Canada
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
