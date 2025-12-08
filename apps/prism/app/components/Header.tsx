import Link from 'next/link';
import type { ReactNode } from 'react';

type NavLink = {
  label: string;
  href: string;
};

type ProductLink = NavLink;

type IconButtonProps = {
  label: string;
  badge?: number;
  children: ReactNode;
};

function IconButton({ label, badge, children }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
    >
      {children}
      {typeof badge === 'number' && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold leading-none text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export function Header() {
  const navLinks: NavLink[] = [
    { label: 'About Us', href: '/aboutus' },
    { label: 'Support', href: '/support' },
    { label: 'Recipes', href: '/recipes' },
  ];

  const productLinks: ProductLink[] = [
    {
      label: 'Dough Mixers',
      href: 'https://www.joydeem.com/kitchen-appliances/dough-makers.html',
    },
    {
      label: 'Rice Cookers',
      href: 'https://www.joydeem.com/kitchen-appliances/rice-cookers.html',
    },
    {
      label: 'Blenders & Juicers',
      href: 'https://www.joydeem.com/kitchen-appliances/kitchen-appliances-blenders-juicers-html.html',
    },
    { label: 'Hot Pots With Grill', href: '/products/hot-pots-with-grill' },
    { label: 'Kettles & Tea Machines', href: '/products/kettles-tea' },
    { label: 'Meat Grinders', href: '/products/meat-grinders' },
    { label: 'Steam Ovens', href: '/products/steam-ovens' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto,1fr,auto] items-center gap-6 px-4 py-4 md:px-8">
        <Link
          href="/"
          className="text-2xl font-semibold tracking-tight text-orange-500"
        >
          Joydeem
        </Link>

        <nav
          aria-label="主导航"
          className="hidden items-center justify-center gap-4 md:flex"
        >
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
              aria-expanded="false"
            >
              Products
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="pointer-events-none invisible absolute left-0 top-full z-20 w-60 translate-y-2 overflow-hidden rounded-xl border border-slate-100 bg-white opacity-0 shadow-xl transition duration-200 ease-out group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 focus-within:pointer-events-auto focus-within:visible focus-within:translate-y-0 focus-within:opacity-100">
              <ul className="divide-y divide-slate-100 p-2">
                {productLinks.map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {navLinks.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <IconButton label="Search">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="6" />
              <path d="m15.5 15.5 3.5 3.5" />
            </svg>
          </IconButton>

          <IconButton label="Account">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.5-3 4.5-4.5 8-4.5s6.5 1.5 8 4.5" />
            </svg>
          </IconButton>

          <IconButton label="Favorites" badge={0}>
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17.5 6.5 21l1.5-6-5-4.5 6.6-.5L12 4l2.4 6 6.6.5-5 4.5 1.5 6z" />
            </svg>
          </IconButton>

          <IconButton label="Cart" badge={0}>
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="20" r="1.5" />
              <circle cx="17" cy="20" r="1.5" />
              <path d="M3 4h2l1.5 12.5h11l1-9H6.2" />
            </svg>
          </IconButton>

          <IconButton label="Menu">
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </IconButton>
        </div>
      </div>
    </header>
  );
}
