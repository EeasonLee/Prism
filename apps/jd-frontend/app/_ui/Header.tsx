import { getHeaderMenu } from '@/features/navigation/header-menu.bff';
import { HeaderClient } from './HeaderClient';
import type { HeaderMenuNode } from '@/features/navigation/types';

const FALLBACK_MENU_ITEMS: HeaderMenuNode[] = [
  {
    title: 'Categories',
    url: '/categories',
    openInNewTab: false,
    children: [],
  },
  {
    title: 'Recipes',
    url: '/recipes',
    openInNewTab: false,
    children: [],
  },
  {
    title: 'Blog',
    url: '/blog',
    openInNewTab: false,
    children: [],
  },
];

function hasRenderableMenu(nodes: HeaderMenuNode[]): boolean {
  return nodes.some(node => {
    if (typeof node.url === 'string' && node.url.trim()) {
      return true;
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      return hasRenderableMenu(node.children);
    }
    return false;
  });
}

export async function Header() {
  const menu = await getHeaderMenu().catch(() => ({ items: [] }));
  const items = hasRenderableMenu(menu.items)
    ? menu.items
    : FALLBACK_MENU_ITEMS;

  return <HeaderClient menuItems={items} />;
}
