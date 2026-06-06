import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  FolderKanban,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const heroImage =
  'https://www.figma.com/api/mcp/asset/95e9f5c8-6d0d-485e-922b-43c7d17604b1';
const logoImage =
  'https://www.figma.com/api/mcp/asset/a2ae4972-b12b-43e1-998c-871366cf0f55';

type NavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type AbilityItem = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName: string;
};

type ProofItem = {
  badge: string;
  badgeClassName: string;
  title: string;
  decision: string;
  result: string;
  inverted?: boolean;
};

type LogItem = {
  category: string;
  categoryClassName: string;
  title: string;
  summary: string;
};

const navItems: NavItem[] = [
  { href: '#proof', label: 'Projects' },
  { href: '#log', label: 'Blog' },
  { href: '#abilities', label: 'Dashboard' },
  { href: '#footer', label: 'About' },
  { href: '#log', label: 'Articles', active: true },
];

const abilityItems: AbilityItem[] = [
  {
    title: 'Frontend Engineering',
    description:
      'Interfaces are built to serve. Architecture is what makes them scale.',
    icon: FolderKanban,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: 'AI Workflows',
    description:
      'Automation, agents, eval loops, and production-ready LLM integration.',
    icon: Bot,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: 'Knowledge Systems',
    description:
      'Grids, modules, notes, and retrieval structures that stay connected.',
    icon: BrainCircuit,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: 'System Thinking',
    description:
      'From branching paths to deploy rules, every move stays functional.',
    icon: GitBranch,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: 'Risk Control',
    description:
      'High standards, sharp rollback paths, and no patience for fragile flows.',
    icon: ShieldCheck,
    accentClassName: 'text-[#8127cf]',
  },
];

const proofItems: ProofItem[] = [
  {
    badge: 'AI Memory OS',
    badgeClassName: 'bg-[#a4d64c] text-[#1f2a00]',
    title: 'Obsidian AI memory architecture',
    decision:
      'A modular vault with typed notes, automation hooks, and retrieval-friendly metadata.',
    result:
      'Structured notes stay queryable at scale and keep context reusable over time.',
  },
  {
    badge: 'Risk Control',
    badgeClassName: 'bg-[#8127cf] text-white',
    title: 'AI translation rollback review',
    decision:
      'Every bulk translation change is versioned, diffed, and prepared for instant rollback.',
    result:
      'Zero production incidents and rollback time kept under two minutes.',
  },
  {
    badge: 'Frontend Eng',
    badgeClassName: 'bg-[#8127cf] text-white',
    title: 'Personal proof-of-skill site',
    decision:
      'An ultra-fast first paint, CSS Grid structure, and a brutalist visual system with strict constraints.',
    result:
      'High Lighthouse scores with a visual identity that is instantly recognizable.',
    inverted: true,
  },
];

const logItems: LogItem[] = [
  {
    category: 'AI Workflow',
    categoryClassName: 'bg-[#8127cf]',
    title: 'How Obsidian became long-term memory for AI',
    summary:
      'A lightweight practice for blending structured notes with large language models.',
  },
  {
    category: 'Engineering Risk',
    categoryClassName: 'bg-[#a4d64c]',
    title: 'Why every major automation change must be reversible',
    summary:
      'Defensive programming matters most when scripts can touch content in bulk.',
  },
  {
    category: 'Frontend Engineering',
    categoryClassName: 'bg-[#8127cf]',
    title: 'Why Chinese semantic memory cannot copy English-first ecosystems',
    summary:
      'Tokenizer differences change architecture decisions more than most teams expect.',
  },
];

function formatUtcTime() {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(new Date());
}

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-end gap-3">
      <span className="font-mono-ui text-base text-[#8127cf]">{index}</span>
      <h2 className="font-display text-4xl uppercase tracking-[-0.04em] text-black sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}

export function HomePageView() {
  const utcTime = `${formatUtcTime()} UTC`;

  return (
    <div className="relative isolate overflow-hidden bg-[#f9f9fb] text-black">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_15%,rgba(207,196,197,0.55),transparent_22%),linear-gradient(180deg,#ffffff_0%,#f9f9fb_100%)]" />
      <div className="yason-grid pointer-events-none absolute inset-0 -z-10 opacity-30" />

      <header className="sticky top-0 z-30 border-b border-[#cfc4c54d] bg-[rgba(249,249,251,0.82)] backdrop-blur-md">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between gap-8 px-5 sm:px-8 xl:px-12">
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logoImage}
                alt="Yason logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-display text-2xl uppercase tracking-[-0.05em] text-black">
                Yason_
              </span>
            </Link>

            <nav aria-label="Primary navigation" className="hidden lg:flex">
              <ul className="flex items-center gap-12">
                {navItems.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`border-b-2 pb-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                        item.active
                          ? 'border-[#8127cf] text-black'
                          : 'border-transparent text-[#4c4546] hover:text-black'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <label className="relative block">
              <span className="sr-only">Search articles</span>
              <input
                type="search"
                placeholder="Search"
                className="h-11 w-32 rounded-sm border border-[#cfc4c54d] bg-[#f3f3f5] px-4 pr-10 text-xs text-black outline-none transition focus:border-[#8127cf]"
              />
              <BookOpen className="absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7e7576]" />
            </label>

            <div className="h-8 w-px bg-[#cfc4c580]" />

            <div className="text-right">
              <p className="font-mono-ui text-[10px] uppercase leading-none text-[#7e7576]">
                Sys.Time
              </p>
              <p className="font-mono-ui mt-1 text-[11px] text-black">
                {utcTime}
              </p>
            </div>

            <div className="h-8 w-px bg-[#cfc4c580]" />

            <div className="text-right">
              <p className="font-mono-ui text-[10px] uppercase leading-none text-[#7e7576]">
                Sys.State
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a4d64c]" />
                <span className="font-mono-ui text-[11px] uppercase text-black">
                  Connection Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-col px-5 pb-24 pt-8 sm:px-8 xl:px-12">
        <section className="relative isolate grid items-center gap-12 py-12 lg:grid-cols-[minmax(0,603px)_minmax(420px,1fr)] lg:py-20">
          <div className="relative z-20">
            <p className="font-mono-ui text-xs font-medium tracking-[0.16em] text-[#8127cf]">
              /01 HERO_PROMPT
            </p>
            <p className="mt-4 text-xs tracking-[0.16em] text-[#4c4546] uppercase">
              Frontend engineering / AI workflows / knowledge systems
            </p>

            <h1 className="font-display mt-6 max-w-[620px] text-[clamp(4rem,9vw,6rem)] uppercase leading-[0.9] tracking-[-0.06em] text-black">
              Love technology embrace life
            </h1>

            <div className="mt-10 border-l-4 border-[#8127cf] pl-7">
              <p className="max-w-[44rem] text-base leading-7 text-[#4c4546]">
                I use engineering thinking to decode complex systems and I am
                actively exploring AI-driven workflows for long-term knowledge
                management.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-6">
              <Link
                href="#proof"
                className="yason-button-shadow inline-flex items-center gap-3 border border-black bg-black px-8 py-4 font-display text-sm uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-1"
              >
                Explore Proof
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#log"
                className="yason-button-shadow inline-flex items-center gap-3 border border-black bg-[#f9f9fb] px-8 py-4 font-display text-sm uppercase tracking-[0.08em] text-black transition-transform hover:-translate-y-1"
              >
                Read Articles
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="relative z-10 mx-auto flex h-full max-h-[540px] min-h-[320px] w-full max-w-[533px] items-center justify-center">
            <div className="absolute inset-[5%] -z-10 rounded-[24px] bg-[#f3f3f5] opacity-80 blur-3xl" />
            <Image
              src={heroImage}
              alt="Structural cube illustration"
              width={500}
              height={500}
              priority
              className="relative h-auto w-full max-w-[500px]"
            />
          </div>
        </section>

        <section id="abilities" className="py-16 lg:py-24">
          <SectionHeading index="/02" title="Core Abilities" />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {abilityItems.map(item => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="yason-card rounded-2xl border border-transparent p-8 transition-transform duration-200"
                >
                  <Icon className={`h-5 w-5 ${item.accentClassName}`} />
                  <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-black">
                    {item.title}
                  </h3>
                  <p className="font-mono-ui mt-4 text-xs leading-6 text-[#4c4546]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-12 border-t border-[#cfc4c54d] py-16 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:gap-14 lg:py-24">
          <div id="proof">
            <SectionHeading index="/04" title="Selected Proof" />

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {proofItems.slice(0, 2).map(item => (
                <article
                  key={item.title}
                  className="yason-card rounded-3xl bg-white p-8 transition-transform duration-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 font-mono-ui text-[11px] font-bold uppercase tracking-[0.08em] ${item.badgeClassName}`}
                    >
                      {item.badge}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#4c4546]" />
                  </div>
                  <h3 className="mt-8 max-w-[14ch] text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-black">
                    {item.title}
                  </h3>
                  <div className="font-mono-ui mt-6 space-y-3 text-[11px] leading-4 text-[#4c4546]">
                    <p>
                      <span className="font-bold uppercase text-black">
                        Proof:
                      </span>{' '}
                      {item.decision}
                    </p>
                    <p>
                      <span className="font-bold uppercase text-black">
                        Result:
                      </span>{' '}
                      {item.result}
                    </p>
                  </div>
                </article>
              ))}

              {proofItems[2] ? (
                <article className="rounded-3xl bg-black p-8 text-white lg:col-span-2">
                  <div className="grid gap-10 lg:grid-cols-[295px_minmax(0,1fr)]">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex items-center border border-white px-2.5 py-1 font-mono-ui text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                          {proofItems[2].badge}
                        </span>
                        <ArrowRight className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="mt-10 max-w-[10ch] text-[2.3rem] font-semibold leading-none tracking-[-0.05em] text-white">
                        {proofItems[2].title}
                      </h3>
                    </div>

                    <div className="border-l border-white/20 pl-0 lg:pl-8">
                      <div className="space-y-6 font-mono-ui text-xs uppercase tracking-[-0.02em]">
                        <p className="text-white">
                          <span className="font-bold">Decision:</span>{' '}
                          <span className="normal-case text-white/70">
                            {proofItems[2].decision}
                          </span>
                        </p>
                        <p className="text-white">
                          <span className="font-bold">Result:</span>{' '}
                          <span className="normal-case text-white/70">
                            {proofItems[2].result}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
          </div>

          <aside id="log">
            <SectionHeading index="/05" title="Thinking Log" />

            <div className="mt-12 space-y-4">
              {logItems.map(item => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#cfc4c526] bg-white/55 p-8 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${item.categoryClassName}`}
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8127cf]">
                      {item.category}
                    </p>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold leading-8 tracking-[-0.03em] text-black">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#4c4546]">
                    {item.summary}
                  </p>
                </article>
              ))}
            </div>
          </aside>
        </section>
      </div>

      <footer id="footer" className="bg-black py-24 text-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 md:grid-cols-2 xl:grid-cols-4 xl:px-12">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src={logoImage}
                alt="Yason logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-display text-2xl uppercase tracking-[-0.05em]">
                Yason_
              </span>
            </div>
            <p className="font-mono-ui mt-8 max-w-[18rem] text-xs leading-5 text-white/50">
              © 2024 Yason. All nodes active. Precision over aesthetic
              compromise.
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Navigation
            </p>
            <div className="mt-8 space-y-4 font-mono-ui text-sm">
              <Link href="#proof" className="block hover:text-[#a4d64c]">
                Work
              </Link>
              <Link href="#abilities" className="block hover:text-[#a4d64c]">
                Services
              </Link>
              <Link href="#footer" className="block hover:text-[#a4d64c]">
                About
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Resources
            </p>
            <div className="mt-8 space-y-4 font-mono-ui text-sm">
              <Link href="#log" className="block hover:text-[#a4d64c]">
                Manifesto
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="block hover:text-[#a4d64c]"
              >
                GitHub
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              System Status
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#a4d64c]" />
              <span className="font-mono-ui text-[11px] uppercase tracking-[-0.03em] text-white">
                Connection Secure
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono-ui text-xs text-white/60">
              <Sparkles className="h-4 w-4 text-[#8127cf]" />
              Crafted for precise engineering stories.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
