# 食谱筛选页面接口对接 Prompt

## 📋 功能需求概述

实现一个食谱浏览页面，包含：

- **左侧筛选面板**：显示 7 种筛选类型，支持多选
- **右侧食谱列表**：根据筛选条件动态更新
- **智能筛选**：选择筛选条件后，左侧的 filters 会动态更新，只显示与当前结果集相关的选项

## 🔌 可用接口列表

### 1. 获取所有筛选类型

**接口**: `GET /api/recipe-filters/types`  
**说明**: 获取所有可用的筛选类型枚举值

**响应示例**:

```json
{
  "data": [
    {
      "value": "recipe-type",
      "label": "Recipe Type",
      "labelZh": "食谱类型"
    },
    {
      "value": "main-ingredients",
      "label": "Main Ingredients",
      "labelZh": "主要食材"
    },
    {
      "value": "holidays-events",
      "label": "Holidays and Events",
      "labelZh": "节假日和活动"
    },
    {
      "value": "cuisine",
      "label": "Cuisine",
      "labelZh": "菜系"
    },
    {
      "value": "dish-type",
      "label": "Dish Type",
      "labelZh": "菜品类型"
    },
    {
      "value": "special-diets",
      "label": "Special Diets",
      "labelZh": "特殊饮食"
    },
    {
      "value": "product-type",
      "label": "Product Type",
      "labelZh": "产品类型"
    }
  ]
}
```

---

### 2. 获取初始筛选选项（首次加载）

**接口**: `GET /api/recipe-filters`  
**说明**: 获取所有激活的筛选选项，可按类型筛选

**查询参数**:

- `type` (可选): 筛选类型，如 `recipe-type`, `main-ingredients` 等
- `rootOnly` (可选, 默认 true): 是否只显示根节点（无父节点的项）
- `includeChildren` (可选, 默认 true): 是否包含子节点
- `sort` (可选): 排序方式，默认 `['sortOrder:asc', 'name:asc']`

**请求示例**:

```bash
# 获取所有类型的根节点
GET /api/recipe-filters?rootOnly=true

# 获取特定类型的所有选项
GET /api/recipe-filters?type=recipe-type&rootOnly=true

# 获取特定类型的完整树结构
GET /api/recipe-filters?type=main-ingredients&includeChildren=true
```

**响应示例**:

```json
{
  "data": [
    {
      "id": 1,
      "type": "recipe-type",
      "name": "主菜",
      "slug": "recipe-type-主菜",
      "description": "主菜类食谱",
      "level": 0,
      "sortOrder": 1,
      "isActive": true,
      "icon": null,
      "color": "#3b82f6",
      "image": null,
      "children": [
        {
          "id": 2,
          "name": "中式主菜",
          "level": 1,
          ...
        }
      ]
    }
  ]
}
```

---

### 3. 搜索食谱（核心接口 - 支持 Faceted Search）

**接口**: `GET /api/recipes/search`  
**说明**: 根据筛选条件搜索食谱，支持返回可用的筛选选项（facets）

**查询参数**:

| 参数             | 类型            | 必填 | 说明                              | 示例             |
| ---------------- | --------------- | ---- | --------------------------------- | ---------------- |
| `page`           | number          | 否   | 页码，默认 1                      | `1`              |
| `pageSize`       | number          | 否   | 每页数量，默认 12                 | `12`             |
| `includeFacets`  | boolean         | 否   | 是否返回可用筛选选项，默认 false  | `true`           |
| `recipeTypes`    | string/number[] | 否   | 食谱类型 ID，支持多个（逗号分隔） | `1,2` 或 `[1,2]` |
| `ingredients`    | string/number[] | 否   | 主要食材 ID，支持多个             | `3,4`            |
| `cuisines`       | string/number[] | 否   | 菜系 ID，支持多个                 | `5`              |
| `dishTypes`      | string/number[] | 否   | 菜品类型 ID，支持多个             | `6,7`            |
| `specialDiets`   | string/number[] | 否   | 特殊饮食 ID，支持多个             | `8`              |
| `holidaysEvents` | string/number[] | 否   | 节假日和活动 ID，支持多个         | `9,10`           |
| `productTypes`   | string/number[] | 否   | 产品类型 ID，支持多个             | `11`             |

**筛选逻辑说明**:

- **跨维度 AND**: 不同筛选类型之间是 AND 关系（必须同时满足）
- **同维度 OR**: 同一筛选类型内的多个选项是 OR 关系（满足任一即可）
- **示例**: `recipeTypes=1,2&ingredients=3` 表示：食谱类型是 1 或 2，**并且**主要食材包含 3

**请求示例**:

```bash
# 基础搜索（不返回 facets）
GET /api/recipes/search?page=1&pageSize=12

# 带筛选条件的搜索
GET /api/recipes/search?page=1&pageSize=12&recipeTypes=1,2&ingredients=3

# 带筛选条件 + 返回可用选项（Faceted Search）
GET /api/recipes/search?page=1&pageSize=12&includeFacets=true&ingredients=3&cuisines=4
```

**响应示例**:

```json
{
  "data": [
    {
      "id": 1,
      "title": "宫保鸡丁",
      "slug": "gong-bao-ji-ding",
      "description": "经典川菜",
      "featuredImage": {
        "url": "/uploads/image.jpg",
        ...
      },
      "categories": [...],
      "filters": [
        {
          "id": 3,
          "type": "main-ingredients",
          "name": "鸡肉",
          ...
        },
        {
          "id": 4,
          "type": "cuisine",
          "name": "川菜",
          ...
        }
      ],
      "prepTime": 15,
      "cookTime": 20,
      "servings": 4,
      "difficulty": "medium",
      "viewCount": 100,
      "rating": 4.5,
      ...
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "pageCount": 3,
      "total": 35
    },
    "facets": {
      "recipe-type": [
        {
          "id": 1,
          "name": "主菜",
          "slug": "recipe-type-主菜",
          "description": null,
          "count": 15,
          "image": null,
          "icon": null,
          "color": "#3b82f6"
        },
        {
          "id": 2,
          "name": "配菜",
          "slug": "recipe-type-配菜",
          "count": 8,
          ...
        }
      ],
      "main-ingredients": [
        {
          "id": 3,
          "name": "鸡肉",
          "slug": "main-ingredients-鸡肉",
          "count": 12,
          ...
        },
        {
          "id": 5,
          "name": "牛肉",
          "slug": "main-ingredients-牛肉",
          "count": 6,
          ...
        }
      ],
      "cuisine": [
        {
          "id": 4,
          "name": "川菜",
          "slug": "cuisine-川菜",
          "count": 10,
          ...
        }
      ],
      "dish-type": [],
      "special-diets": [],
      "holidays-events": [],
      "product-type": []
    }
  }
}
```

**Facets 说明**:

- `facets` 只在 `includeFacets=true` 时返回
- 每个筛选类型下的选项**只包含与当前结果集相关的 filters**
- 每个选项包含 `count` 字段，表示在当前结果集中的出现次数
- 选项按 `count` 降序、`name` 升序排序

---

### 4. 根据类型获取筛选选项

**接口**: `GET /api/recipe-filters/type/:type`  
**说明**: 获取特定类型的所有筛选选项（树形结构）

**路径参数**:

- `type`: 筛选类型，如 `recipe-type`, `main-ingredients` 等

**请求示例**:

```bash
GET /api/recipe-filters/type/recipe-type
```

---

### 5. 根据 slug 获取筛选选项

**接口**: `GET /api/recipe-filters/slug/:slug`  
**说明**: 根据 slug 获取单个筛选选项详情

---

### 6. 根据 slug 获取食谱详情

**接口**: `GET /api/recipes/slug/:slug`  
**说明**: 根据 slug 获取单个食谱的详细信息

---

## 🎯 前端对接实现指南

### 步骤 1: 初始化页面

1. **获取筛选类型列表**

   ```typescript
   GET / api / recipe - filters / types;
   ```

   用于渲染左侧筛选面板的标题和分类

2. **获取初始筛选选项**（可选，如果不需要树形结构）

   ```typescript
   GET /api/recipe-filters?rootOnly=true
   ```

   或者直接使用步骤 3 的 facets

3. **获取初始食谱列表和可用筛选选项**
   ```typescript
   GET /api/recipes/search?page=1&pageSize=12&includeFacets=true
   ```
   首次加载时，不传任何筛选参数，返回所有食谱和所有可用的筛选选项

### 步骤 2: 处理用户筛选操作

当用户选择/取消选择筛选条件时：

1. **收集当前选中的筛选条件**

   ```typescript
   const selectedFilters = {
     recipeTypes: [1, 2], // 用户选中的食谱类型 IDs
     ingredients: [3], // 用户选中的主要食材 IDs
     cuisines: [4, 5], // 用户选中的菜系 IDs
     dishTypes: [], // 用户选中的菜品类型 IDs
     specialDiets: [], // 用户选中的特殊饮食 IDs
     holidaysEvents: [], // 用户选中的节假日和活动 IDs
     productTypes: [], // 用户选中的产品类型 IDs
   };
   ```

2. **调用搜索接口（必须包含 includeFacets=true）**

   ```typescript
   const params = new URLSearchParams({
     page: '1',
     pageSize: '12',
     includeFacets: 'true',
     ...(selectedFilters.recipeTypes.length > 0 && {
       recipeTypes: selectedFilters.recipeTypes.join(',')
     }),
     ...(selectedFilters.ingredients.length > 0 && {
       ingredients: selectedFilters.ingredients.join(',')
     }),
     // ... 其他筛选条件
   });

   GET /api/recipes/search?${params.toString()}
   ```

3. **更新 UI**
   - 更新右侧食谱列表：使用 `response.data`
   - 更新左侧筛选选项：使用 `response.meta.facets`
   - 更新分页信息：使用 `response.meta.pagination`

### 步骤 3: 关键实现要点

#### ✅ 多选处理

- 每个筛选类型支持多选（checkbox）
- 同一类型内多个选项是 OR 关系
- 不同筛选类型之间是 AND 关系

#### ✅ 动态筛选选项更新

- **必须使用 `includeFacets=true`** 才能获取动态更新的筛选选项
- 选择筛选条件后，左侧的 filters 会自动更新
- 只显示与当前结果集相关的选项（例如：选择"鸡肉"后，不会出现"榨汁机"）

#### ✅ 状态管理建议

```typescript
interface FilterState {
  // 当前选中的筛选条件
  selected: {
    recipeTypes: number[];
    ingredients: number[];
    cuisines: number[];
    dishTypes: number[];
    specialDiets: number[];
    holidaysEvents: number[];
    productTypes: number[];
  };

  // 当前可用的筛选选项（从 facets 获取）
  available: {
    'recipe-type': FilterOption[];
    'main-ingredients': FilterOption[];
    cuisine: FilterOption[];
    'dish-type': FilterOption[];
    'special-diets': FilterOption[];
    'holidays-events': FilterOption[];
    'product-type': FilterOption[];
  };

  // 食谱列表
  recipes: Recipe[];

  // 分页信息
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
}
```

#### ✅ 性能优化建议

1. **防抖处理**: 用户快速切换筛选条件时，使用防抖（debounce）避免频繁请求
2. **缓存策略**: 可以缓存初始的筛选选项列表
3. **加载状态**: 显示加载状态，提升用户体验

---

## 📝 完整示例代码（伪代码）

```typescript
// 1. 初始化
async function initPage() {
  // 获取筛选类型
  const types = await fetch('/api/recipe-filters/types');

  // 获取初始数据和可用筛选选项
  const result = await fetch(
    '/api/recipes/search?page=1&pageSize=12&includeFacets=true'
  );
  const { data: recipes, meta } = await result.json();

  // 更新状态
  setRecipes(recipes);
  setAvailableFilters(meta.facets);
  setPagination(meta.pagination);
}

// 2. 处理筛选条件变化
async function handleFilterChange(
  filterType: string,
  filterId: number,
  checked: boolean
) {
  // 更新选中的筛选条件
  const newSelected = { ...selectedFilters };
  if (checked) {
    newSelected[filterType].push(filterId);
  } else {
    newSelected[filterType] = newSelected[filterType].filter(
      id => id !== filterId
    );
  }
  setSelectedFilters(newSelected);

  // 构建查询参数
  const params = new URLSearchParams({
    page: '1',
    pageSize: '12',
    includeFacets: 'true',
  });

  // 添加选中的筛选条件
  Object.entries(newSelected).forEach(([key, ids]) => {
    if (ids.length > 0) {
      params.append(key, ids.join(','));
    }
  });

  // 调用搜索接口
  const result = await fetch(`/api/recipes/search?${params.toString()}`);
  const { data: recipes, meta } = await result.json();

  // 更新 UI
  setRecipes(recipes);
  setAvailableFilters(meta.facets); // 关键：使用 facets 更新可用选项
  setPagination(meta.pagination);
}

// 3. 处理分页
async function handlePageChange(page: number) {
  // 类似 handleFilterChange，但只更新 page 参数
  // ...
}
```

---

## ⚠️ 注意事项

1. **必须使用 `includeFacets=true`**: 只有这样才能获取动态更新的筛选选项
2. **参数格式**: ID 数组可以用逗号分隔的字符串（`"1,2,3"`）或数组形式传递
3. **空值处理**: 如果某个筛选类型没有选中项，可以不传该参数或传空数组
4. **错误处理**: 接口可能返回错误，需要处理异常情况
5. **排序**: 食谱默认按 `isFeatured` 降序、`viewCount` 降序、`createdAt` 降序排序

---

## 🔍 测试用例

### 测试场景 1: 初始加载

```bash
GET /api/recipes/search?page=1&pageSize=12&includeFacets=true
```

预期：返回所有食谱和所有可用的筛选选项

### 测试场景 2: 选择"鸡肉"筛选

```bash
GET /api/recipes/search?page=1&pageSize=12&includeFacets=true&ingredients=3
```

预期：

- 返回包含"鸡肉"的食谱
- facets 中的其他筛选类型只显示与这些食谱相关的选项
- 例如：如果选择"鸡肉"后，某些菜系或产品类型不再出现，说明这些选项与"鸡肉"食谱无关

### 测试场景 3: 多维度筛选

```bash
GET /api/recipes/search?page=1&pageSize=12&includeFacets=true&recipeTypes=1,2&ingredients=3&cuisines=4
```

预期：返回同时满足以下条件的食谱：

- 食谱类型是 1 或 2
- 主要食材包含 3
- 菜系是 4

---

## 📚 相关文档

- 设计文档: `RECIPE_FILTER_DESIGN.md`
- Schema 定义: `backend/src/api/recipe-filter/content-types/recipe-filter/schema.json`
- 控制器实现: `backend/src/api/recipe/controllers/recipe.js`
