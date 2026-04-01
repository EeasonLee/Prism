export interface CategoryTreeItem {
  id: number;
  name: string;
  urlKey: string;
  children: CategoryTreeItem[];
}

export interface CategoryDetail {
  id: number;
  name: string;
  description: string;
  image: string;
  productCount: number;
}

export interface BreadcrumbItem {
  id: number;
  name: string;
  url: string;
}

interface GraphQLCategory {
  id: number;
  name: string;
  url_key: string;
  children?: GraphQLCategory[];
}

interface GraphQLCategoryDetail {
  id: number;
  name: string;
  description?: string;
  image?: string;
  product_count: number;
}

interface GraphQLBreadcrumb {
  category_id: number;
  category_name: string;
}

export function mapCategoryTree(raw: GraphQLCategory): CategoryTreeItem {
  return {
    id: raw.id,
    name: raw.name,
    urlKey: raw.url_key || '',
    children: (raw.children || []).map(mapCategoryTree),
  };
}

export function mapCategoryDetail(raw: GraphQLCategoryDetail): CategoryDetail {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description || '',
    image: raw.image || '',
    productCount: raw.product_count,
  };
}

export function mapBreadcrumbs(raw: GraphQLBreadcrumb[]): BreadcrumbItem[] {
  return raw.map(item => ({
    id: item.category_id,
    name: item.category_name,
    url: `/category/${item.category_id}`,
  }));
}
