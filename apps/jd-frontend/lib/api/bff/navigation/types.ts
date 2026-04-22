export interface HeaderMenuCategoryRef {
  id: number | null;
  name: string | null;
  slug: string;
  magentoCategoryId: number | null;
}

export interface HeaderMenuNode {
  title: string;
  url: string | null;
  openInNewTab: boolean;
  magentoCategoryId?: number | null;
  category?: HeaderMenuCategoryRef | null;
  children: HeaderMenuNode[];
}

export interface HeaderMenuResult {
  items: HeaderMenuNode[];
}
