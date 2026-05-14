'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { gtmSelectItem, mapDisplayToGtmItem } from '@/shared/utils/gtm';

export interface SearchProductLinkProduct {
  sku: string;
  name: string;
  price: number;
  final_price?: number;
  currency?: string | null;
  categories?: string[];
  brand?: string | null;
  url_key?: string | null;
  image?: string | null;
}

interface SearchProductLinkProps {
  href: string;
  className?: string;
  listName: string;
  listId: string;
  index: number;
  product: SearchProductLinkProduct;
  children: ReactNode;
}

export function SearchProductLink({
  href,
  className,
  listName,
  listId,
  index,
  product,
  children,
}: SearchProductLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        gtmSelectItem(
          mapDisplayToGtmItem(
            {
              sku: product.sku,
              name: product.name,
              price: product.price,
              final_price: product.final_price ?? product.price,
              currency: product.currency,
              categories: product.categories,
              brand: product.brand,
              url_key: product.url_key,
              image: product.image,
            },
            { index, itemListName: listName, itemListId: listId }
          ),
          listName,
          listId
        );
      }}
    >
      {children}
    </Link>
  );
}
