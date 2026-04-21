export interface HeaderMenuNode {
  title: string;
  url: string | null;
  openInNewTab: boolean;
  children: HeaderMenuNode[];
}

export interface HeaderMenuResult {
  items: HeaderMenuNode[];
}
