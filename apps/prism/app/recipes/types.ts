// 筛选类型元数据
export interface FilterType {
  value: string;
  label: string;
  labelZh: string;
}

// 筛选选项
export interface FilterOption {
  id: number;
  type: string;
  name: string;
  slug: string;
  description: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  icon: string | null;
  color: string | null;
  image: string | null;
  count?: number; // facets 返回的计数
  children?: FilterOption[];
}

// 食谱数据
export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  content?: string; // 富文本内容（HTML格式）
  featuredImage: {
    url: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
  } | null;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  filters?: FilterOption[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  viewCount?: number;
  rating?: number;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // 详情页额外字段
  ingredients?: Array<{
    id?: number;
    name: string;
    amount?: string;
    unit?: string;
    notes?: string;
  }>;
  instructions?: Array<{
    id?: number;
    step: number;
    instruction: string;
    image?: {
      url: string;
      alternativeText?: string;
    } | null;
  }>;
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  author?: {
    id: number;
    username: string;
    email?: string;
  };
  relatedRecipes?: Recipe[];
}

// 分页信息
export interface PaginationInfo {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// Facets 数据结构
export interface Facets {
  'recipe-type': FilterOption[];
  'main-ingredients': FilterOption[];
  cuisine: FilterOption[];
  'dish-type': FilterOption[];
  'special-diets': FilterOption[];
  'holidays-events': FilterOption[];
  'product-type': FilterOption[];
}

// API 响应结构
export interface RecipeSearchResponse {
  data: Recipe[];
  meta: {
    pagination: PaginationInfo;
    facets?: Facets;
  };
}

export interface FilterTypesResponse {
  data: FilterType[];
}

export interface FilterListResponse {
  data: FilterOption[];
}

// 选中的筛选条件
export interface SelectedFilters {
  recipeTypes: number[];
  ingredients: number[];
  cuisines: number[];
  dishTypes: number[];
  specialDiets: number[];
  holidaysEvents: number[];
  productTypes: number[];
}

// 搜索参数
export interface RecipeSearchParams {
  page?: number;
  pageSize?: number;
  includeFacets?: boolean;
  recipeTypes?: number[];
  ingredients?: number[];
  cuisines?: number[];
  dishTypes?: number[];
  specialDiets?: number[];
  holidaysEvents?: number[];
  productTypes?: number[];
}
