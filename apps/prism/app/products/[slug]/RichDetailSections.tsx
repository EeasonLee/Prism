import Image from 'next/image';
import type { DetailSection } from './mock-data';

interface RichDetailSectionsProps {
  sections: DetailSection[];
}

export function RichDetailSections({ sections }: RichDetailSectionsProps) {
  if (sections.length === 0) return null;

  return (
    <section
      aria-labelledby="product-detail-heading"
      className="py-12 lg:py-20"
    >
      <h2
        id="product-detail-heading"
        className="heading-3 mb-12 text-center text-ink"
      >
        Product Details
      </h2>

      <div className="space-y-16 lg:space-y-24">
        {sections.map((section, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16 ${
              section.reversed ? 'lg:flex-row-reverse' : ''
            }`}
          >
            {/* 图片 */}
            <div className="w-full lg:w-1/2">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface">
                <Image
                  src={section.image}
                  alt={section.imageAlt}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* 文字 */}
            <div className="w-full lg:w-1/2">
              {/* 序号装饰 */}
              <span className="mb-4 inline-block text-4xl font-black text-brand/15 leading-none select-none">
                0{idx + 1}
              </span>
              <h3 className="heading-3 mb-4 text-ink">{section.title}</h3>
              <p className="body-text leading-relaxed text-ink-muted">
                {section.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
