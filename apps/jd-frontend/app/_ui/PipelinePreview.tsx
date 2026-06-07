'use client';

import { useMemo, useState } from 'react';

type PipelineNodeId = 'requirements' | 'event-center' | 'decision-layer';

type PipelineNode = {
  id: PipelineNodeId;
  title: string;
  eyebrow: string;
  detail: string;
  x: number;
  y: number;
  tone: 'violet' | 'cyan' | 'silver';
};

type PipelineTrace = {
  id: string;
  source: PipelineNodeId;
  target: PipelineNodeId;
  path: string;
  tone: 'violet' | 'cyan' | 'silver';
  delay: string;
};

type DecorativeRibbon = {
  id: string;
  path: string;
  tone: PipelineTrace['tone'];
  delay: string;
  activeWith: PipelineNodeId[];
};

const nodes: PipelineNode[] = [
  {
    id: 'requirements',
    title: '需求输入',
    eyebrow: '用户反馈 / PRS / Issues',
    detail: '接入层负责汇总产品信号，并把需求线索分发到后续协作流程中。',
    x: 17,
    y: 27,
    tone: 'silver',
  },
  {
    id: 'event-center',
    title: 'Hermes 事件中心',
    eyebrow: '消息 / 聚合 / 综合',
    detail: '中心枢纽负责标准化事件、扩散上下文，并持续维护全局协作视图。',
    x: 50,
    y: 31,
    tone: 'cyan',
  },
  {
    id: 'decision-layer',
    title: '决策层',
    eyebrow: 'RFC / ADR / 评审 / 优先级',
    detail: '决策节点把原始信号转化成明确的架构判断与交付选择。',
    x: 61,
    y: 58,
    tone: 'violet',
  },
];

const traces: PipelineTrace[] = [
  {
    id: 'req-main',
    source: 'requirements',
    target: 'event-center',
    path: 'M 135 195 C 245 150, 360 160, 500 230',
    tone: 'silver',
    delay: '0s',
  },
  {
    id: 'req-upper',
    source: 'requirements',
    target: 'event-center',
    path: 'M 135 174 C 250 110, 388 135, 508 221',
    tone: 'cyan',
    delay: '-0.8s',
  },
  {
    id: 'req-lower',
    source: 'requirements',
    target: 'event-center',
    path: 'M 135 216 C 270 210, 360 270, 510 239',
    tone: 'violet',
    delay: '-1.4s',
  },
  {
    id: 'req-thread-a',
    source: 'requirements',
    target: 'decision-layer',
    path: 'M 135 238 C 245 360, 470 390, 610 413',
    tone: 'violet',
    delay: '-2s',
  },
  {
    id: 'hub-decision-main',
    source: 'event-center',
    target: 'decision-layer',
    path: 'M 530 250 C 570 330, 592 390, 610 413',
    tone: 'violet',
    delay: '-0.4s',
  },
  {
    id: 'hub-decision-wide',
    source: 'event-center',
    target: 'decision-layer',
    path: 'M 520 255 C 410 400, 500 505, 620 432',
    tone: 'cyan',
    delay: '-1.1s',
  },
  {
    id: 'hub-output-a',
    source: 'event-center',
    target: 'decision-layer',
    path: 'M 535 236 C 720 210, 820 260, 900 318',
    tone: 'cyan',
    delay: '-1.8s',
  },
  {
    id: 'decision-feedback',
    source: 'decision-layer',
    target: 'requirements',
    path: 'M 612 435 C 420 585, 180 525, 95 335',
    tone: 'violet',
    delay: '-2.6s',
  },
];

const capabilityRibbons: DecorativeRibbon[] = Array.from(
  { length: 14 },
  (_, index) => ({
    id: `capability-ribbon-${index}`,
    path: `M 612 ${382 + index * 5} C ${690 + index * 3} ${280 + index * 6}, ${
      736 - index
    } ${304 + index * 11}, 775 ${328 + index * 8}`,
    tone: index % 3 === 0 ? 'violet' : 'cyan',
    delay: `${index * -0.18}s`,
    activeWith: ['decision-layer', 'event-center'],
  })
);

const memoryRibbons: DecorativeRibbon[] = Array.from(
  { length: 11 },
  (_, index) => ({
    id: `memory-ribbon-${index}`,
    path: `M 505 ${248 + index * 2} C ${575 + index * 6} ${360 + index * 8}, ${
      545 - index * 2
    } ${500 - index * 7}, 610 ${540 + index * 3}`,
    tone: index % 2 === 0 ? 'violet' : 'silver',
    delay: `${index * -0.22}s`,
    activeWith: ['event-center', 'decision-layer'],
  })
);

const lowerRibbons: DecorativeRibbon[] = Array.from(
  { length: 9 },
  (_, index) => ({
    id: `lower-ribbon-${index}`,
    path: `M 610 ${455 + index * 3} C ${660 + index * 7} ${520 + index * 4}, ${
      755 + index * 8
    } ${540 - index * 2}, 850 ${585 - index * 5}`,
    tone: index % 2 === 0 ? 'cyan' : 'violet',
    delay: `${index * -0.2}s`,
    activeWith: ['decision-layer'],
  })
);

const decorativeRibbons = [
  ...capabilityRibbons,
  ...memoryRibbons,
  ...lowerRibbons,
];

const toneClassByNode: Record<PipelineNode['tone'], string> = {
  violet: 'border-fuchsia-300/80 bg-fuchsia-100/85 text-fuchsia-950',
  cyan: 'border-cyan-300/80 bg-cyan-100/85 text-cyan-950',
  silver: 'border-slate-300/80 bg-white/90 text-slate-900',
};

const toneClassByTrace: Record<PipelineTrace['tone'], string> = {
  violet: 'pipeline-trace--violet',
  cyan: 'pipeline-trace--cyan',
  silver: 'pipeline-trace--silver',
};

export function PipelinePreview() {
  const [selectedNodeId, setSelectedNodeId] =
    useState<PipelineNodeId>('event-center');

  const selectedNode = useMemo(
    () =>
      nodes.find(node => node.id === selectedNodeId) ?? nodes[1] ?? nodes[0],
    [selectedNodeId]
  );
  const isBundleActive =
    selectedNodeId === 'event-center' || selectedNodeId === 'decision-layer';

  return (
    <div className="relative min-h-[760px] overflow-hidden rounded-none bg-white text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_62%_58%,rgba(217,70,239,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#eef4fb_100%)]" />
      <div className="pipeline-grid absolute inset-0 opacity-90" />

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-6xl flex-col px-5 py-8 md:px-8 md:py-10">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase text-cyan-700">
            交互式工作流原型
          </p>
          <h1 className="mt-3 text-4xl font-bold uppercase leading-tight text-slate-950 md:text-6xl">
            软件开发流水线
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            点击节点，高亮关联链路并查看当前流转说明。
          </p>
        </div>

        <div className="relative mt-8 flex-1 overflow-hidden rounded-lg border border-slate-200/80 bg-white/70 shadow-[0_24px_90px_rgba(15,23,42,0.10)]">
          <svg
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 650"
            preserveAspectRatio="none"
          >
            <defs>
              <filter
                id="pipelineGlow"
                x="-30%"
                y="-30%"
                width="160%"
                height="160%"
              >
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="bundleBlur"
                x="-30%"
                y="-45%"
                width="170%"
                height="190%"
              >
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <linearGradient
                id="bundleGradient"
                x1="610"
                y1="430"
                x2="790"
                y2="360"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0"
                  stopColor="rgb(217, 92, 255)"
                  stopOpacity="0.2"
                />
                <stop
                  offset="0.46"
                  stopColor="rgb(141, 123, 255)"
                  stopOpacity="0.75"
                />
                <stop
                  offset="0.72"
                  stopColor="rgb(105, 228, 255)"
                  stopOpacity="0.9"
                />
                <stop
                  offset="1"
                  stopColor="rgb(217, 92, 255)"
                  stopOpacity="0.12"
                />
              </linearGradient>
              <linearGradient
                id="bundleHotline"
                x1="610"
                y1="430"
                x2="790"
                y2="360"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="rgb(240, 122, 255)" />
                <stop offset="0.58" stopColor="rgb(103, 232, 249)" />
                <stop offset="1" stopColor="rgb(240, 249, 255)" />
              </linearGradient>
            </defs>

            <g opacity="0.35">
              <path
                d="M 65 520 L 220 520 L 220 585 L 840 585"
                className="pipeline-circuit"
              />
              <path
                d="M 760 80 L 900 80 L 955 135 L 955 310"
                className="pipeline-circuit"
              />
              <path
                d="M 230 105 L 290 105 L 290 330 L 410 330"
                className="pipeline-circuit"
              />
              <path
                d="M 730 450 L 865 450 L 930 510"
                className="pipeline-circuit"
              />
            </g>

            <g
              className={`pipeline-bundle ${
                isBundleActive ? 'pipeline-bundle--active' : ''
              }`}
            >
              <path
                d="M 604 394 C 650 392, 672 360, 720 342 C 744 333, 764 326, 786 314 L 796 373 C 762 381, 734 397, 704 421 C 664 452, 634 462, 598 443 Z"
                fill="url(#bundleGradient)"
                filter="url(#bundleBlur)"
              />
              <path
                d="M 604 407 C 654 408, 681 378, 727 363 C 752 355, 771 350, 790 342"
                className="pipeline-bundle-hotline pipeline-bundle-hotline--wide"
              />
              <path
                d="M 606 421 C 657 426, 684 394, 730 382 C 754 375, 773 372, 792 367"
                className="pipeline-bundle-hotline"
              />
            </g>

            <g>
              {decorativeRibbons.map(ribbon => {
                const isActive = ribbon.activeWith.includes(selectedNodeId);

                return (
                  <g key={ribbon.id}>
                    <path
                      d={ribbon.path}
                      className={`pipeline-ribbon ${
                        toneClassByTrace[ribbon.tone]
                      } ${isActive ? 'pipeline-ribbon--active' : ''}`}
                    />
                    <path
                      d={ribbon.path}
                      className={`pipeline-ribbon-flow ${
                        toneClassByTrace[ribbon.tone]
                      } ${isActive ? 'pipeline-ribbon-flow--active' : ''}`}
                      style={{ animationDelay: ribbon.delay }}
                    />
                  </g>
                );
              })}
            </g>

            {traces.map(trace => {
              const isActive =
                trace.source === selectedNodeId ||
                trace.target === selectedNodeId;

              return (
                <g key={trace.id}>
                  <path
                    d={trace.path}
                    className={`pipeline-trace ${
                      toneClassByTrace[trace.tone]
                    } ${isActive ? 'pipeline-trace--active' : ''}`}
                    filter={isActive ? 'url(#pipelineGlow)' : undefined}
                  />
                  <path
                    d={trace.path}
                    className={`pipeline-flow ${toneClassByTrace[trace.tone]} ${
                      isActive ? 'pipeline-flow--active' : ''
                    }`}
                    style={{ animationDelay: trace.delay }}
                  />
                </g>
              );
            })}
          </svg>

          <div className="absolute left-[8%] top-[48%] hidden w-40 rounded-md border border-slate-200 bg-white/85 p-4 text-sm text-slate-600 shadow-[0_16px_40px_rgba(148,163,184,0.14)] backdrop-blur-md md:block">
            <p className="font-semibold uppercase text-slate-900">知识底座</p>
            <ul className="mt-3 space-y-2">
              <li>设计文档</li>
              <li>源码仓库</li>
              <li>团队手册</li>
            </ul>
          </div>

          <div className="absolute bottom-[7%] right-[7%] hidden w-44 rounded-md border border-slate-200 bg-white/88 p-4 text-sm text-slate-600 shadow-[0_18px_46px_rgba(56,189,248,0.10)] backdrop-blur-md md:block">
            <p className="font-semibold uppercase text-slate-900">能力层</p>
            <ul className="mt-3 space-y-2">
              <li>Claude Code</li>
              <li>Codex</li>
              <li>MCP 工具</li>
            </ul>
          </div>

          {nodes.map(node => {
            const isSelected = node.id === selectedNodeId;

            return (
              <button
                key={node.id}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select ${node.title}`}
                onClick={() => setSelectedNodeId(node.id)}
                className={`pipeline-node absolute w-48 -translate-x-1/2 -translate-y-1/2 rounded-md border px-4 py-3 text-left shadow-2xl transition duration-300 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 ${
                  toneClassByNode[node.tone]
                } ${isSelected ? 'pipeline-node--active' : ''}`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                <span className="pipeline-node-core" />
                <span className="block text-[11px] font-semibold uppercase text-slate-500">
                  {node.eyebrow}
                </span>
                <span className="mt-1 block text-base font-bold uppercase leading-tight">
                  {node.title}
                </span>
              </button>
            );
          })}

          <div className="absolute left-1/2 top-[66%] h-28 w-[1px] -translate-x-1/2 bg-gradient-to-b from-fuchsia-300/80 to-transparent shadow-[0_0_18px_rgba(217,70,239,0.75)]" />
          <div className="absolute left-1/2 top-[83%] grid w-[70%] -translate-x-1/2 grid-cols-3 gap-3 rounded-md border border-slate-200/90 bg-white/82 p-3 text-center text-xs font-semibold uppercase text-slate-600 shadow-[0_18px_44px_rgba(148,163,184,0.16)] backdrop-blur-md md:w-[48%]">
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-3">
              检查
            </span>
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-3">
              构建
            </span>
            <span className="rounded border border-fuchsia-300/60 bg-fuchsia-100 px-2 py-3 text-fuchsia-800">
              交付
            </span>
          </div>
        </div>

        <aside className="mt-5 rounded-md border border-slate-200 bg-white/88 p-4 text-slate-700 shadow-[0_18px_48px_rgba(56,189,248,0.10)] backdrop-blur-md md:max-w-3xl">
          <p className="text-xs font-semibold uppercase text-cyan-700">
            当前节点
          </p>
          <h2 className="mt-2 text-xl font-bold uppercase text-slate-950">
            {selectedNode.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {selectedNode.detail}
          </p>
        </aside>
      </div>
    </div>
  );
}
