import Image from 'next/image';
import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  BrainCircuit,
  FolderKanban,
  Gauge,
  Sparkles,
} from 'lucide-react';
import { PipelinePreview } from './PipelinePreview';

const heroImage =
  'https://www.figma.com/api/mcp/asset/95e9f5c8-6d0d-485e-922b-43c7d17604b1';
const logoImage =
  'https://www.figma.com/api/mcp/asset/a2ae4972-b12b-43e1-998c-871366cf0f55';

type NavItem = {
  href: `#${string}`;
  label: string;
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
  summary: string;
  result: string;
};

type LogItem = {
  category: string;
  categoryClassName: string;
  title: string;
  summary: string;
};

const navItems: NavItem[] = [
  { href: '#abilities', label: '能力' },
  { href: '#proof', label: '项目' },
  { href: '#log', label: '文章' },
  { href: '#footer', label: '关于' },
];

const abilityItems: AbilityItem[] = [
  {
    title: '前端工程',
    description: '复杂业务页面、稳定的组件体系，以及真正能落地上线的实现能力。',
    icon: FolderKanban,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: 'AI 工作流',
    description:
      '围绕 AI 协作、上下文设计、自动化链路与实际可用的 LLM 集成能力。',
    icon: Bot,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: '知识管理',
    description: '把笔记、内容地图和检索结构组织成可复用、可持续积累的系统。',
    icon: BrainCircuit,
    accentClassName: 'text-[#8127cf]',
  },
  {
    title: '性能优化',
    description: '以前端性能为重点专项，关注速度、体验、交付成本和可量化结果。',
    icon: Gauge,
    accentClassName: 'text-[#8127cf]',
  },
];

const proofItems: ProofItem[] = [
  {
    badge: '代表项目',
    badgeClassName: 'bg-[#a4d64c] text-[#1f2a00]',
    title: '个人博客能力证明站',
    summary:
      '以内容优先的方式组织能力、项目和文章，让首页本身就成为清晰的能力证明入口。',
    result:
      '让访问者能在很短时间内理解我做什么、怎么思考，以及这些工作为什么值得继续了解。',
  },
  {
    badge: '代表项目',
    badgeClassName: 'bg-[#8127cf] text-white',
    title: '完整电商链路项目',
    summary: '围绕复杂业务流程、前端工程深度和性能取舍展开的完整项目实践。',
    result:
      '证明我不仅能做页面实现，也能在真实业务复杂度里做出稳定且可靠的工程判断。',
  },
];

const logItems: LogItem[] = [
  {
    category: '项目策略',
    categoryClassName: 'bg-[#8127cf]',
    title: '为什么这个站点按“证明”而不是按时间来组织',
    summary:
      '首页的目标不是展示我发了多少内容，而是帮助访问者快速判断这些内容是否值得继续看下去。',
  },
  {
    category: 'AI 工作流',
    categoryClassName: 'bg-[#a4d64c]',
    title: '结构化笔记如何成为 AI 协作中的长期上下文',
    summary:
      '当笔记系统具备连接关系后，提示词、记忆和项目背景就会随着时间不断变得更可复用。',
  },
  {
    category: '前端工程',
    categoryClassName: 'bg-[#8127cf]',
    title: '在真实前端项目里，性能优化到底证明了什么',
    summary:
      '真正有价值的优化，不只是分数更高，而是它能同时支撑业务流程、视觉质量和交付信心。',
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
                      className="border-b-2 border-transparent pb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4c4546] transition-colors hover:text-black"
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
              <span className="sr-only">搜索文章</span>
              <input
                type="search"
                placeholder="搜索"
                className="h-11 w-32 rounded-sm border border-[#cfc4c54d] bg-[#f3f3f5] px-4 pr-10 text-xs text-black outline-none transition focus:border-[#8127cf]"
              />
              <BookOpen className="absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#7e7576]" />
            </label>

            <div className="h-8 w-px bg-[#cfc4c580]" />

            <div className="text-right">
              <p className="font-mono-ui text-[10px] uppercase leading-none text-[#7e7576]">
                系统时间
              </p>
              <p className="mt-1 font-mono-ui text-[11px] text-black">
                {utcTime}
              </p>
            </div>

            <div className="h-8 w-px bg-[#cfc4c580]" />

            <div className="text-right">
              <p className="font-mono-ui text-[10px] uppercase leading-none text-[#7e7576]">
                系统状态
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#a4d64c]" />
                <span className="font-mono-ui text-[11px] text-black">
                  运行正常
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
              /01 首页引导
            </p>
            <p className="mt-4 text-xs tracking-[0.16em] text-[#4c4546]">
              前端工程 / AI 工作流 / 知识管理
            </p>

            <h1 className="mt-6 max-w-[620px] font-display text-[clamp(4rem,9vw,6rem)] leading-[0.9] tracking-[-0.06em] text-black">
              Love technology embrace life
            </h1>

            <div className="mt-10 border-l-4 border-[#8127cf] pl-7">
              <p className="max-w-[44rem] text-base leading-7 text-[#4c4546]">
                用工程思维理解复杂世界 · 正在探索 AI 驱动知识管理的工作流
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-6">
              <Link
                href="#proof"
                className="yason-button-shadow inline-flex items-center gap-3 border border-black bg-black px-8 py-4 font-display text-sm uppercase tracking-[0.08em] text-white transition-transform hover:-translate-y-1"
              >
                查看项目
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#log"
                className="yason-button-shadow inline-flex items-center gap-3 border border-black bg-[#f9f9fb] px-8 py-4 font-display text-sm uppercase tracking-[0.08em] text-black transition-transform hover:-translate-y-1"
              >
                阅读文章
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
          <SectionHeading index="/02" title="核心能力" />

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
                  <p className="mt-4 font-mono-ui text-xs leading-6 text-[#4c4546]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="relative left-1/2 mt-12 w-screen -translate-x-1/2">
            <PipelinePreview />
          </div>
        </section>

        <section className="grid gap-12 border-t border-[#cfc4c54d] py-16 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:gap-14 lg:py-24">
          <div id="proof">
            <SectionHeading index="/03" title="代表项目" />

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {proofItems.map(item => (
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
                  <div className="mt-6 space-y-3 font-mono-ui text-[11px] leading-4 text-[#4c4546]">
                    <p>
                      <span className="font-bold uppercase text-black">
                        证明：
                      </span>{' '}
                      {item.summary}
                    </p>
                    <p>
                      <span className="font-bold uppercase text-black">
                        结果：
                      </span>{' '}
                      {item.result}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside id="log">
            <SectionHeading index="/04" title="思考记录" />

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
            <p className="mt-8 max-w-[18rem] font-mono-ui text-xs leading-5 text-white/50">
              © 2026 Yason。一个围绕能力、判断与执行力展开的个人博客。
            </p>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.18em] text-white/40">导航</p>
            <div className="mt-8 space-y-4 font-mono-ui text-sm">
              <Link href="#proof" className="block hover:text-[#a4d64c]">
                项目
              </Link>
              <Link href="#abilities" className="block hover:text-[#a4d64c]">
                能力
              </Link>
              <Link href="#footer" className="block hover:text-[#a4d64c]">
                关于
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.18em] text-white/40">资源</p>
            <div className="mt-8 space-y-4 font-mono-ui text-sm">
              <Link href="#log" className="block hover:text-[#a4d64c]">
                文章
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
            <p className="text-[10px] tracking-[0.18em] text-white/40">
              系统状态
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <span className="h-2.5 w-2.5 rounded-full bg-[#a4d64c]" />
              <span className="font-mono-ui text-[11px] tracking-[-0.03em] text-white">
                运行正常
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2 font-mono-ui text-xs text-white/60">
              <Sparkles className="h-4 w-4 text-[#8127cf]" />
              让能力、项目与思考更容易被看见。
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
