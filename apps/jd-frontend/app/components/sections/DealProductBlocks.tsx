import type { DealProductBlocksProps } from '@/lib/api/cms-page.types';
import { LazyDealProductBlock } from './LazyDealProductBlock';

export function DealProductBlocks({ blocks }: DealProductBlocksProps) {
  if (blocks.length === 0) return null;

  return (
    <section className="px-6 lg:px-[8vw]">
      {blocks.map(block => (
        <LazyDealProductBlock key={block.id} block={block} />
      ))}
    </section>
  );
}
