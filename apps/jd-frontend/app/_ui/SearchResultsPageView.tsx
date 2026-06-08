import Link from 'next/link';
import {
  ArrowUpRight,
  Command,
  FileText,
  Filter,
  Github,
  Grid2X2,
  Search,
} from 'lucide-react';

type FilterItem = {
  label: string;
  active?: boolean;
};

type ResultHref = '/' | '/articles/performance-optimization';

type ResultItem = {
  index: string;
  category: string;
  categoryClassName: string;
  title: string;
  summary: string;
  tags: string[];
  timestamp: string;
  href: ResultHref;
};

const filters: FilterItem[] = [
  { label: 'ALL', active: true },
  { label: 'ARTICLES' },
  { label: 'PROJECTS' },
  { label: 'LOGS' },
];

const resultItems: ResultItem[] = [
  {
    index: '/RS.01',
    category: 'PROJECT',
    categoryClassName: 'bg-[#bef264] text-black',
    title: 'NEO-STRUCTURE_ARCHITECTURE_V2',
    summary:
      'An exploration into distributed infrastructure visuals. Leveraging cyber brutalism principles to define raw digital spaces.',
    tags: ['distributed', 'cyber', 'architecture'],
    timestamp: '2026.06.13 / 14:02',
    href: '/',
  },
  {
    index: '/RS.02',
    category: 'TECH',
    categoryClassName: 'bg-black text-white',
    title: 'REACT_WASP_INDEXER',
    summary:
      'A high-performance node indexing library for React. Optimizing distributed state management in multi-threaded environments.',
    tags: ['performance', 'indexing', 'distributed'],
    timestamp: '2024.05.01 / 09:45',
    href: '/articles/performance-optimization',
  },
  {
    index: '/RS.03',
    category: 'MANIFESTO',
    categoryClassName: 'bg-[#a855f7] text-white',
    title: 'THE_LIGHT_BRUTALIST_MANIFESTO',
    summary:
      'Defining the intersection of raw UI and technical precision. Why distributed design requires structural honesty in the browser.',
    tags: ['distributed', 'structure', 'ui'],
    timestamp: '2026.06.27 / 23:11',
    href: '/',
  },
  {
    index: '/RS.04',
    category: 'LOG',
    categoryClassName: 'bg-[#f3f3f5] text-black',
    title: 'DEV_LOG_012_SYSTEM_REFACTOR',
    summary:
      'Migrating the distributed component library to the neo-structure framework. Identifying key latency nodes.',
    tags: ['distributed', 'neo-structure', 'latency'],
    timestamp: '2026.06.15 / 12:00',
    href: '/',
  },
];

const footerColumns = [
  {
    title: 'NAVIGATE',
    links: ['Changelog', 'System'],
  },
  {
    title: 'RESOURCE',
    links: ['Source', 'License'],
  },
] as const;

function QueryTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[#bef264] px-1 font-mono-ui text-[11px] text-black">
      {children}
    </span>
  );
}

function ResultCard({ item }: { item: ResultItem }) {
  return (
    <article className="border border-black bg-[#f9f9fb]">
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <span className="font-mono-ui text-[10px] text-[#7e7576]">
          {item.index}
        </span>
        <span
          className={`border border-black px-2 py-1 font-mono-ui text-[9px] uppercase ${item.categoryClassName}`}
        >
          {item.category}
        </span>
      </div>

      <div className="px-6 pb-5 pt-5">
        <h2 className="break-words font-display text-3xl leading-none text-black [overflow-wrap:anywhere] md:text-4xl">
          {item.title}
        </h2>
        <p className="mt-4 text-sm leading-6 text-[#4c4546]">
          {item.summary.split('distributed').map((part, partIndex) => (
            <span key={`${item.index}-${partIndex}`}>
              {part}
              {partIndex < item.summary.split('distributed').length - 1 ? (
                <QueryTag>distributed</QueryTag>
              ) : null}
            </span>
          ))}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {item.tags.map(tag => (
            <span
              key={`${item.index}-${tag}`}
              className="border border-black bg-white px-2 py-1 font-mono-ui text-[10px] text-[#4c4546]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto] border-t border-black">
        <div className="px-6 py-4 font-mono-ui text-[10px] uppercase text-[#7e7576]">
          TIMESTAMP: <span className="text-black">{item.timestamp}</span>
        </div>
        <Link
          href={item.href}
          className="inline-flex items-center gap-2 border-l border-black bg-black px-5 py-4 font-mono-ui text-[10px] uppercase text-white transition-colors hover:bg-[#8127cf]"
        >
          View node
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function SearchResultsPageView() {
  const summaryText = '12 NODES';

  return (
    <div className="min-h-screen bg-[#f9f9fb] text-black">
      <header className="border-b border-black">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-2xl leading-none text-black"
          >
            YASON_
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-10 font-mono-ui text-[10px] uppercase tracking-[0.12em] text-[#4c4546] md:flex"
          >
            <Link href="/" className="hover:text-black">
              Projects
            </Link>
            <Link
              href="/articles/performance-optimization"
              className="hover:text-black"
            >
              Dev
            </Link>
            <Link href="/search" className="text-black">
              Stack
            </Link>
            <Link href="/" className="hover:text-black">
              Lab
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="打开网格视图"
              className="hidden h-8 w-8 items-center justify-center border border-black bg-white hover:bg-[#bef264] sm:flex"
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="hidden h-8 w-8 items-center justify-center border border-black bg-white hover:bg-[#bef264] sm:flex"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@yason.tech"
              className="border border-black bg-black px-5 py-2 font-mono-ui text-[10px] uppercase tracking-[0.12em] text-white"
            >
              Connect
            </a>
          </div>
        </div>
      </header>

      <section className="border-b border-black">
        <div className="mx-auto grid max-w-[1280px] gap-0 md:grid-cols-[1fr_236px]">
          <div className="px-6 py-10 md:py-14">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-[#8127cf]">
              /REL_STATUS_PROTOCOL
            </p>
            <h1 className="mt-3 break-words font-display text-[clamp(3.1rem,10vw,5.5rem)] leading-[0.9] text-black [overflow-wrap:anywhere]">
              SEARCH_QUERY:{' '}
              <span className="text-[#8127cf]">[DISTRIBUTED]</span>
            </h1>
          </div>

          <aside className="grid border-t border-black md:border-l md:border-t-0">
            <div className="flex items-center justify-between border-b border-black px-6 py-4 md:block">
              <p className="font-mono-ui text-[10px] uppercase text-[#7e7576]">
                MATCH_TOTAL:
              </p>
              <p className="font-display text-4xl leading-none md:mt-2 md:text-5xl">
                {summaryText}
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 font-mono-ui text-[10px] uppercase text-[#4c4546]">
              <Command className="h-4 w-4 text-[#8127cf]" />
              INDEX ONLINE
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-black">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 font-mono-ui text-[10px] uppercase text-[#4c4546]">
            <Filter className="h-4 w-4" />
            FILTER_TYPE:
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => (
              <button
                key={filter.label}
                type="button"
                className={`border border-black px-4 py-2 font-mono-ui text-[10px] uppercase ${
                  filter.active
                    ? 'bg-black text-white'
                    : 'bg-[#f9f9fb] text-black hover:bg-[#bef264]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase text-[#4c4546]">
            <Search className="h-4 w-4 text-[#8127cf]" />
            SYSTEM_STATUS_01
          </div>
        </div>
      </section>

      <section className="bg-black py-8">
        <div className="mx-auto grid max-w-[1280px] gap-px px-6 md:grid-cols-2">
          {resultItems.map(item => (
            <ResultCard key={item.index} item={item} />
          ))}
        </div>
      </section>

      <section className="border-b border-black bg-[#f9f9fb]">
        <div className="mx-auto flex min-h-56 max-w-[1280px] flex-col items-center justify-center gap-4 bg-[linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[length:64px_64px] px-6 py-12">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.42em] text-[#7e7576]">
            END OF RESULT INDEX
          </p>
          <div className="flex gap-3">
            <span className="h-1.5 w-1.5 bg-black" />
            <span className="h-1.5 w-1.5 bg-[#8127cf]" />
            <span className="h-1.5 w-1.5 bg-[#bef264]" />
          </div>
        </div>
      </section>

      <footer className="border-b border-black bg-[#f9f9fb]">
        <div className="mx-auto grid max-w-[1280px] gap-px bg-black md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="bg-[#f9f9fb] px-6 py-8">
            <p className="font-display text-3xl leading-none">Yason</p>
            <p className="mt-2 font-mono-ui text-[10px] uppercase text-[#4c4546]">
              SYSTEM_STABLE_01
            </p>
          </div>

          {footerColumns.map(column => (
            <div key={column.title} className="bg-[#f9f9fb] px-6 py-8">
              <p className="font-mono-ui text-[10px] uppercase text-[#4c4546]">
                {column.title}
              </p>
              <div className="mt-5 space-y-3">
                {column.links.map(link => (
                  <Link
                    key={link}
                    href="/"
                    className="block font-mono-ui text-[11px] text-black hover:text-[#8127cf]"
                  >
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-[#f9f9fb] px-6 py-8">
            <p className="font-mono-ui text-[10px] uppercase text-[#4c4546]">
              © 2026 Yason_ // System_status_01
            </p>
            <Link
              href="/search"
              className="mt-5 inline-flex items-center gap-2 border border-black bg-white px-3 py-2 font-mono-ui text-[10px] uppercase hover:bg-[#bef264]"
            >
              <FileText className="h-3.5 w-3.5" />
              Search index
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
