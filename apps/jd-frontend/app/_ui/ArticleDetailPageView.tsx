import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Github,
  Mail,
  Share2,
} from 'lucide-react';

type TocItem = {
  id: string;
  index: string;
  title: string;
  progress: string;
};

type Metric = {
  label: string;
  before: string;
  after: string;
  target: string;
  status: 'good' | 'watch';
};

type TraceStep = {
  label: string;
  duration: string;
  offsetClassName: string;
  widthClassName: string;
  colorClassName: string;
};

type RelatedPost = {
  index: string;
  title: string;
  category: string;
  summary: string;
};

const tocItems: TocItem[] = [
  {
    id: 'architecture',
    index: '/01',
    title: '为什么首屏速度是架构问题',
    progress: 'ACTIVE',
  },
  {
    id: 'critical-path',
    index: '/02',
    title: '关键渲染路径',
    progress: 'READY',
  },
  {
    id: 'priority',
    index: '/03',
    title: '资源优先级',
    progress: 'READY',
  },
  {
    id: 'nextjs',
    index: '/04',
    title: 'Next.js 策略',
    progress: 'READY',
  },
  {
    id: 'budget',
    index: '/05',
    title: '性能预算',
    progress: 'READY',
  },
  {
    id: 'checklist',
    index: '/06',
    title: '落地 Checklist',
    progress: 'READY',
  },
];

const metrics: Metric[] = [
  {
    label: 'FCP',
    before: '2.1s',
    after: '0.9s',
    target: '< 1.8s',
    status: 'good',
  },
  {
    label: 'LCP',
    before: '4.7s',
    after: '1.8s',
    target: '< 2.5s',
    status: 'good',
  },
  {
    label: 'CLS',
    before: '0.19',
    after: '0.03',
    target: '< 0.10',
    status: 'good',
  },
  {
    label: 'JS',
    before: '612KB',
    after: '238KB',
    target: '< 280KB',
    status: 'watch',
  },
];

const traceSteps: TraceStep[] = [
  {
    label: 'HTML',
    duration: '120ms',
    offsetClassName: 'left-[4%]',
    widthClassName: 'w-[18%]',
    colorClassName: 'bg-black',
  },
  {
    label: 'CSSOM',
    duration: '260ms',
    offsetClassName: 'left-[18%]',
    widthClassName: 'w-[27%]',
    colorClassName: 'bg-[#a855f7]',
  },
  {
    label: 'FONT',
    duration: '180ms',
    offsetClassName: 'left-[42%]',
    widthClassName: 'w-[20%]',
    colorClassName: 'bg-[#8127cf]',
  },
  {
    label: 'LCP IMG',
    duration: '520ms',
    offsetClassName: 'left-[58%]',
    widthClassName: 'w-[34%]',
    colorClassName: 'bg-[#bef264]',
  },
];

const resourceLinks = [
  'Chrome DevTools Performance',
  'web.dev Core Web Vitals',
  'Next.js Image Optimization',
  'HTTP Cache-Control',
] as const;

const checklistItems = [
  '把首屏必要资源列成白名单，非首屏资源默认延后。',
  '确认 LCP 元素稳定可预测，图片必须有明确尺寸。',
  '删除首屏同步执行的非关键脚本，把分析、评论、低优先级组件延后。',
  '为字体、关键 CSS、LCP 图片设定加载策略，并记录每次变更后的指标。',
  '在 CI 或发布前检查 bundle 体积和性能预算，避免优化成果回退。',
] as const;

const relatedPosts: RelatedPost[] = [
  {
    index: '/R1',
    title: '从交互延迟看组件边界',
    category: '前端工程',
    summary: '当页面变慢时，真正该拆的往往不是组件，而是交互责任。',
  },
  {
    index: '/R2',
    title: '如何给个人站设计可验证的能力证据',
    category: '项目策略',
    summary: '把文章、项目和结果组织成证据链，而不是时间线。',
  },
  {
    index: '/R3',
    title: 'AI 协作中的长期上下文设计',
    category: 'AI 工作流',
    summary: '让笔记系统、仓库文档和任务状态成为可复用的协作材料。',
  },
];

function ModuleLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-black bg-white">
      <span className="border-r border-black px-3 py-2 font-mono-ui text-[11px] text-[#8127cf]">
        {index}
      </span>
      <span className="min-w-0 px-3 py-2 text-right font-mono-ui text-[10px] uppercase text-[#4c4546]">
        {label}
      </span>
    </div>
  );
}

function ArticleSection({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-black pt-10">
      <p className="font-mono-ui text-xs text-[#8127cf]">{index}</p>
      <h2 className="mt-3 font-display text-4xl leading-none text-black md:text-5xl">
        {title}
      </h2>
      <div className="mt-7 space-y-5 text-[15px] leading-8 text-[#2f3132]">
        {children}
      </div>
    </section>
  );
}

function SidebarModule({
  index,
  label,
  children,
}: {
  index: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-black bg-[#f9f9fb]">
      <ModuleLabel index={index} label={label} />
      <div className="p-5">{children}</div>
    </section>
  );
}

function PerformanceTrace() {
  return (
    <div className="border border-black bg-white">
      <ModuleLabel index="/TRACE" label="critical rendering path" />
      <div className="p-5">
        <div className="grid grid-cols-4 border border-black font-mono-ui text-[10px] text-[#4c4546]">
          <span className="border-r border-black px-2 py-2">0ms</span>
          <span className="border-r border-black px-2 py-2">500ms</span>
          <span className="border-r border-black px-2 py-2">1000ms</span>
          <span className="px-2 py-2">1500ms</span>
        </div>
        <div className="relative mt-4 h-48 border border-black bg-[linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[length:48px_48px]">
          {traceSteps.map((step, stepIndex) => (
            <div
              key={step.label}
              className={`absolute ${step.offsetClassName} ${step.widthClassName}`}
              style={{ top: `${28 + stepIndex * 34}px` }}
            >
              <div
                className={`h-5 border border-black ${step.colorClassName}`}
              />
              <div className="mt-1 flex justify-between font-mono-ui text-[10px] text-black">
                <span>{step.label}</span>
                <span>{step.duration}</span>
              </div>
            </div>
          ))}
          <div className="absolute bottom-4 left-[58%] top-4 border-l-2 border-[#8127cf]" />
          <div className="absolute bottom-5 left-[60%] bg-[#bef264] px-2 py-1 font-mono-ui text-[10px] text-black">
            LCP CANDIDATE
          </div>
        </div>
      </div>
    </div>
  );
}

function CodeBlock() {
  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words border border-black bg-[#101112] p-5 font-mono-ui text-[12px] leading-6 text-[#f0f0f2]">
      <code>{`import dynamic from 'next/dynamic';
import Image from 'next/image';

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div className="h-64 border border-black" />,
});

export function ArticleHero() {
  return (
    <Image
      src="/performance-trace.webp"
      alt="性能分析时间线"
      width={960}
      height={540}
      priority
      sizes="(min-width: 1024px) 720px, 100vw"
    />
  );
}`}</code>
    </pre>
  );
}

function MetricTable() {
  return (
    <div className="overflow-hidden border border-black">
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-black bg-black font-mono-ui text-[10px] uppercase text-white">
        <span className="border-r border-white/30 px-3 py-3">Metric</span>
        <span className="border-r border-white/30 px-3 py-3">Before</span>
        <span className="border-r border-white/30 px-3 py-3">After</span>
        <span className="px-3 py-3">Target</span>
      </div>
      {metrics.map(metric => (
        <div
          key={metric.label}
          className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-black last:border-b-0"
        >
          <span className="border-r border-black px-3 py-3 font-mono-ui text-xs text-black">
            {metric.label}
          </span>
          <span className="border-r border-black px-3 py-3 font-mono-ui text-xs text-[#4c4546]">
            {metric.before}
          </span>
          <span
            className={`border-r border-black px-3 py-3 font-mono-ui text-xs text-black ${
              metric.status === 'good' ? 'bg-[#bef264]' : 'bg-[#f0dbff]'
            }`}
          >
            {metric.after}
          </span>
          <span className="px-3 py-3 font-mono-ui text-xs text-[#4c4546]">
            {metric.target}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ArticleDetailPageView() {
  return (
    <div className="bg-[#f9f9fb] text-black">
      <header className="sticky top-0 z-40 border-b border-black bg-[#f9f9fb]">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-2xl leading-none text-black"
          >
            YASON_
          </Link>
          <nav
            aria-label="文章导航"
            className="hidden items-center gap-8 font-mono-ui text-[11px] uppercase text-[#4c4546] md:flex"
          >
            <Link href="/" className="hover:text-black">
              首页
            </Link>
            <Link
              href="/articles/performance-optimization"
              className="text-black"
            >
              文章
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-black"
            >
              GitHub
            </a>
          </nav>
          <Link
            href="#newsletter"
            className="border border-black bg-black px-4 py-2 font-mono-ui text-[11px] uppercase text-white"
          >
            Contact ↗
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 border-x border-black lg:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="hidden border-r border-black bg-[#f3f3f5] lg:block">
          <div className="sticky top-16">
            <ModuleLabel index="/TOC" label="article map" />
            <nav aria-label="文章目录" className="p-4">
              <ol className="space-y-3">
                {tocItems.map(item => (
                  <li key={item.id}>
                    <Link
                      href={`#${item.id}`}
                      className="block border border-black bg-[#f9f9fb] transition-colors hover:bg-[#bef264]"
                    >
                      <span className="flex items-center justify-between border-b border-black px-3 py-2 font-mono-ui text-[10px]">
                        <span className="text-[#8127cf]">{item.index}</span>
                        <span>{item.progress}</span>
                      </span>
                      <span className="block px-3 py-3 text-xs leading-5 text-black">
                        {item.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="mx-4 mb-4 border border-black bg-black p-4 text-white">
              <p className="font-mono-ui text-[10px] uppercase text-white/60">
                Reading progress
              </p>
              <div className="mt-3 h-2 border border-white bg-white">
                <div className="h-full w-[34%] bg-[#a855f7]" />
              </div>
              <p className="mt-3 font-mono-ui text-[10px] text-[#bef264]">
                SECTION /01 LOCKED
              </p>
            </div>
          </div>
        </aside>

        <article className="min-w-0 bg-white">
          <section className="border-b border-black px-6 py-10 md:px-10 md:py-14">
            <div className="flex flex-wrap items-center gap-2 font-mono-ui text-[11px] uppercase">
              <span className="border border-black bg-[#bef264] px-2 py-1">
                Performance
              </span>
              <span className="border border-black px-2 py-1">Next.js</span>
              <span className="border border-black px-2 py-1">CRP</span>
            </div>
            <h1 className="mt-7 max-w-[760px] break-words font-display text-[clamp(2.25rem,9vw,4.75rem)] leading-none text-black [overflow-wrap:anywhere] [word-break:break-all] md:text-7xl">
              首屏速度不是玄学：如何用关键渲染路径理解架构性能优化
            </h1>
            <p className="mt-6 max-w-[720px] border-l-4 border-[#8127cf] pl-5 text-lg leading-8 text-[#4c4546]">
              真正有效的性能优化不是到处加缓存、压图片、拆组件，而是先看清浏览器为了画出第一屏到底在等待什么。
            </p>
            <div className="mt-8 grid border border-black font-mono-ui text-[11px] text-[#4c4546] sm:grid-cols-4">
              <div className="border-b border-black p-3 sm:border-b-0 sm:border-r">
                AUTHOR
                <strong className="mt-1 block text-black">Yason</strong>
              </div>
              <div className="border-b border-black p-3 sm:border-b-0 sm:border-r">
                DATE
                <strong className="mt-1 block text-black">2024-10-24</strong>
              </div>
              <div className="border-b border-black p-3 sm:border-b-0 sm:border-r">
                READ
                <strong className="mt-1 block text-black">12 MIN</strong>
              </div>
              <div className="p-3">
                LEVEL
                <strong className="mt-1 block text-black">ADVANCED</strong>
              </div>
            </div>
            <div className="mt-10">
              <PerformanceTrace />
            </div>
          </section>

          <div className="space-y-14 px-6 py-12 md:px-10 md:py-16">
            <ArticleSection
              id="architecture"
              index="/01"
              title="为什么首屏速度是架构问题"
            >
              <p>
                首屏速度经常被误解成局部优化问题：把图片压小一点、把接口缓存一下、把某个组件懒加载一下。
                这些动作当然有价值，但它们只是结果层面的修补。真正决定首屏体验的，是页面在架构层面对
                “什么必须先出现、什么可以稍后出现、什么根本不该进入首屏”
                的排序能力。
              </p>
              <p>
                一个页面如果把导航、营销动画、埋点脚本、评论系统、图表库和首屏正文都塞进同一条加载链路，
                浏览器就只能排队等待。用户看到的慢，不是某个函数慢，而是关键资源被非关键资源挤占了通道。
              </p>
              <div className="border border-black bg-[#f3f3f5] p-5">
                <p className="font-mono-ui text-[11px] uppercase text-[#8127cf]">
                  Key conclusion
                </p>
                <p className="mt-3 text-base leading-7 text-black">
                  性能优化的第一步不是压缩，而是分层：首屏路径、交互路径、后台路径必须拥有不同的资源优先级。
                </p>
              </div>
            </ArticleSection>

            <ArticleSection
              id="critical-path"
              index="/02"
              title="关键渲染路径：浏览器到底在等什么"
            >
              <p>
                浏览器从收到 HTML 到绘制第一屏，需要经历 DOM 构建、CSSOM
                构建、渲染树合成、布局与绘制。
                只要其中某一步被阻塞，用户就会面对一段空白或半成品界面。CSS
                默认阻塞渲染，脚本默认可能阻塞解析，
                字体和首屏图片又会影响最终的视觉稳定性。
              </p>
              <p>
                所以我们看性能报告时，不应该只盯总耗时，而要追踪等待链路：HTML
                是否太晚到达？关键 CSS 是否过大？ JS 是否在 hydration
                前执行了太多无关逻辑？LCP 图片是否缺少优先级或尺寸信息？
              </p>
              <div className="grid gap-3 border border-black p-4 md:grid-cols-4">
                {['HTML', 'CSSOM', 'RENDER TREE', 'PAINT'].map(
                  (label, itemIndex) => (
                    <div key={label} className="border border-black p-3">
                      <p className="font-mono-ui text-[10px] text-[#8127cf]">
                        /0{itemIndex + 1}
                      </p>
                      <p className="mt-3 font-mono-ui text-xs text-black">
                        {label}
                      </p>
                    </div>
                  )
                )}
              </div>
            </ArticleSection>

            <ArticleSection
              id="priority"
              index="/03"
              title="资源优先级与阻塞链路"
            >
              <p>
                资源优先级的核心是让浏览器尽早知道 “哪些资源会影响第一屏”。关键
                CSS 应该更接近 HTML，
                首屏图片可以使用高优先级加载，非首屏组件则应当从主包中移出。对于脚本，能
                defer 就不要同步阻塞， 能在用户交互后加载就不要进入初始化路径。
              </p>
              <p>
                preload、prefetch、preconnect 都不是魔法。preload
                用来提前声明当前导航马上要用的关键资源； prefetch
                更适合下一次导航；preconnect
                则用来提前完成第三方域名连接。错误地滥用这些能力，
                反而会让浏览器下载更多并不急需的东西。
              </p>
            </ArticleSection>

            <ArticleSection
              id="nextjs"
              index="/04"
              title="Next.js 场景下的拆包、缓存与图片策略"
            >
              <p>
                在 Next.js 里，性能优化要同时处理服务端输出、客户端 hydration
                和静态资源策略。动态导入适合切走
                首屏不需要的重量组件；`next/image`
                负责图片尺寸、格式与响应式加载；缓存策略则需要结合数据变化频率，
                避免每次访问都重新等待慢接口。
              </p>
              <CodeBlock />
              <p>
                这里最容易犯的错误是把工具当成答案。`dynamic`
                不能替你判断组件是否该出现在首屏， `Image`
                也不能修复错误的视觉布局。工程判断仍然是：先定义首屏承诺，再选择资源策略。
              </p>
            </ArticleSection>

            <ArticleSection
              id="budget"
              index="/05"
              title="性能预算与可观测指标"
            >
              <p>
                没有预算的优化很容易变成一次性活动。团队需要为 LCP、CLS、首屏
                JS、图片体积和关键接口耗时设定红线，
                并把这些指标放进发布流程。每一次新增依赖、引入图表、改动首屏结构，都要能回答：
                它是否吃掉了预算？是否有用户价值抵消这部分成本？
              </p>
              <MetricTable />
            </ArticleSection>

            <ArticleSection id="checklist" index="/06" title="落地 Checklist">
              <p>
                最后，把优化变成可重复执行的检查，而不是依赖某次灵感。下面这份清单适合放进
                PR 描述或发布前检查。
              </p>
              <ul className="space-y-3">
                {checklistItems.map(item => (
                  <li
                    key={item}
                    className="flex gap-3 border border-black bg-[#f9f9fb] p-4"
                  >
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#8127cf]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p>
                当页面的资源排序、指标预算和观测反馈形成闭环，首屏速度就不再是玄学。它会变成架构决策的直接结果。
              </p>
            </ArticleSection>
          </div>

          <footer className="border-t border-black bg-[#f3f3f5] px-6 py-10 md:px-10">
            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href="/"
                className="border border-black bg-white p-5 transition-colors hover:bg-[#bef264]"
              >
                <span className="flex items-center gap-2 font-mono-ui text-[11px] text-[#4c4546]">
                  <ArrowLeft className="h-4 w-4" />
                  PREVIOUS
                </span>
                <strong className="mt-3 block text-lg leading-7">
                  为什么个人站应该按能力证明组织
                </strong>
              </Link>
              <Link
                href="/"
                className="border border-black bg-white p-5 text-right transition-colors hover:bg-[#bef264]"
              >
                <span className="flex items-center justify-end gap-2 font-mono-ui text-[11px] text-[#4c4546]">
                  NEXT
                  <ArrowRight className="h-4 w-4" />
                </span>
                <strong className="mt-3 block text-lg leading-7">
                  AI 工作流中的上下文资产设计
                </strong>
              </Link>
            </div>

            <section className="mt-8 border border-black bg-white">
              <ModuleLabel index="/RELATED" label="recommended posts" />
              <div className="grid gap-px bg-black md:grid-cols-3">
                {relatedPosts.map(post => (
                  <article key={post.title} className="bg-white p-5">
                    <p className="font-mono-ui text-[11px] text-[#8127cf]">
                      {post.index} · {post.category}
                    </p>
                    <h3 className="mt-4 text-xl font-semibold leading-7">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#4c4546]">
                      {post.summary}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="newsletter"
              className="mt-8 border border-black bg-black p-6 text-white"
            >
              <p className="font-mono-ui text-[11px] uppercase text-[#bef264]">
                Newsletter / Contact
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <h2 className="font-display text-4xl leading-none">
                    订阅工程记录
                  </h2>
                  <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/70">
                    不追热点，只记录可以复用的工程判断、AI
                    协作方法和个人系统建设。
                  </p>
                </div>
                <Link
                  href="mailto:hello@yason.tech"
                  className="inline-flex items-center justify-center gap-2 border border-white bg-white px-5 py-3 font-mono-ui text-[11px] uppercase text-black"
                >
                  <Mail className="h-4 w-4" />
                  Email me
                </Link>
              </div>
            </section>
          </footer>
        </article>

        <aside className="border-t border-black bg-[#f9f9fb] lg:border-l lg:border-t-0">
          <div className="sticky top-16 space-y-4 p-4">
            <SidebarModule index="/ABSTRACT" label="article abstract">
              <p className="text-sm leading-7 text-[#2f3132]">
                这篇文章用关键渲染路径解释首屏速度，重点不是罗列技巧，而是把资源优先级、渲染阻塞和工程预算连成一条可执行链路。
              </p>
            </SidebarModule>

            <SidebarModule index="/METRICS" label="core vitals">
              <div className="grid grid-cols-2 gap-px border border-black bg-black">
                {metrics.slice(0, 4).map(metric => (
                  <div key={metric.label} className="bg-[#bef264] p-3">
                    <p className="font-mono-ui text-[10px] text-[#1a1c1d]">
                      {metric.label}
                    </p>
                    <p className="mt-1 font-display text-3xl leading-none text-black">
                      {metric.after}
                    </p>
                  </div>
                ))}
              </div>
            </SidebarModule>

            <SidebarModule index="/LINKS" label="resource links">
              <ul className="space-y-2">
                {resourceLinks.map(link => (
                  <li key={link}>
                    <a
                      href="https://web.dev"
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-w-0 items-center justify-between gap-3 border border-black bg-white px-3 py-2 text-xs text-black hover:bg-[#f0dbff]"
                    >
                      <span className="min-w-0 truncate">{link}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </SidebarModule>

            <SidebarModule index="/AUTHOR" label="profile">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center border border-black bg-black font-display text-xl text-white">
                  Y
                </div>
                <div>
                  <p className="font-semibold">Yason</p>
                  <p className="mt-1 text-xs leading-5 text-[#4c4546]">
                    前端工程、AI 工作流与知识系统实践者。
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-px bg-black">
                <button
                  type="button"
                  aria-label="分享文章"
                  className="flex h-10 items-center justify-center bg-white hover:bg-[#bef264]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="收藏文章"
                  className="flex h-10 items-center justify-center bg-white hover:bg-[#bef264]"
                >
                  <Bookmark className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="复制链接"
                  className="flex h-10 items-center justify-center bg-white hover:bg-[#bef264]"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </SidebarModule>

            <SidebarModule index="/STATUS" label="system">
              <div className="flex items-center justify-between font-mono-ui text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#bef264]" />
                  LIVE
                </span>
                <span className="flex items-center gap-2 text-[#4c4546]">
                  <Clock className="h-3.5 w-3.5" />
                  12 MIN
                </span>
              </div>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 border border-black bg-black px-4 py-3 font-mono-ui text-[11px] uppercase text-white"
              >
                <Github className="h-4 w-4" />
                Follow
              </Link>
            </SidebarModule>
          </div>
        </aside>
      </div>
    </div>
  );
}
