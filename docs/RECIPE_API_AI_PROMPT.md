# 食谱筛选页面接口对接 - AI Prompt

## 🎯 任务目标

实现一个食谱浏览页面，包含左侧筛选面板和右侧食谱列表。当用户选择筛选条件后，左侧的筛选选项会动态更新，只显示与当前结果集相关的选项。

## 📋 接口说明

### 核心接口：搜索食谱（支持 Faceted Search）

**接口**: `GET /api/recipes/search`

**关键参数**:

- `includeFacets=true` (必填): 必须设置为 true 才能获取动态更新的筛选选项
- `page`, `pageSize`: 分页参数
- `recipeTypes`, `ingredients`, `cuisines`, `dishTypes`, `specialDiets`, `holidaysEvents`, `productTypes`: 筛选条件（支持多个 ID，逗号分隔）

**筛选逻辑**:

- 跨维度 AND: 不同筛选类型之间是 AND 关系
- 同维度 OR: 同一筛选类型内的多个选项是 OR 关系

**响应结构**:

```json
{
  "data": [...recipes...],
  "meta": {
    "pagination": {...},
    "facets": {
      "recipe-type": [{ "id": 1, "name": "...", "count": 15, ... }],
      "main-ingredients": [...],
      "cuisine": [...],
      "dish-type": [...],
      "special-diets": [...],
      "holidays-events": [...],
      "product-type": [...]
    }
  }
}
```

**重要**: `facets` 中的选项只包含与当前结果集相关的 filters，选择"鸡肉"后不会出现"榨汁机"等无关选项。

### 辅助接口

1. **获取筛选类型列表**: `GET /api/recipe-filters/types`

   - 返回 7 种筛选类型的元数据

2. **获取初始筛选选项**: `GET /api/recipe-filters?rootOnly=true`
   - 可选，首次加载时获取所有筛选选项

## 🔧 实现要求

### 1. 状态管理

```typescript
interface State {
  selected: {
    recipeTypes: number[];
    ingredients: number[];
    cuisines: number[];
    dishTypes: number[];
    specialDiets: number[];
    holidaysEvents: number[];
    productTypes: number[];
  };
  available: {
    'recipe-type': FilterOption[];
    'main-ingredients': FilterOption[];
    cuisine: FilterOption[];
    'dish-type': FilterOption[];
    'special-diets': FilterOption[];
    'holidays-events': FilterOption[];
    'product-type': FilterOption[];
  };
  recipes: Recipe[];
  pagination: PaginationInfo;
}
```

### 2. 初始化流程

1. 调用 `GET /api/recipe-filters/types` 获取筛选类型
2. 调用 `GET /api/recipes/search?page=1&pageSize=12&includeFacets=true` 获取初始数据
3. 使用 `response.meta.facets` 更新左侧筛选选项

### 3. 筛选条件变化处理

```typescript
// 当用户选择/取消选择筛选条件时
async function handleFilterChange(type: string, id: number, checked: boolean) {
  // 1. 更新选中的筛选条件
  updateSelectedFilters(type, id, checked);

  // 2. 构建查询参数（必须包含 includeFacets=true）
  const params = {
    page: 1,
    pageSize: 12,
    includeFacets: true,
    ...buildFilterParams(selectedFilters),
  };

  // 3. 调用搜索接口
  const result = await fetch(`/api/recipes/search?${buildQueryString(params)}`);
  const { data, meta } = await result.json();

  // 4. 更新 UI
  setRecipes(data);
  setAvailableFilters(meta.facets); // 关键：使用 facets 更新可用选项
  setPagination(meta.pagination);
}
```

### 4. 关键实现点

✅ **必须使用 `includeFacets=true`**: 只有这样才能获取动态更新的筛选选项

✅ **多选支持**: 每个筛选类型支持多选（checkbox），同一类型内是 OR，不同类型间是 AND

✅ **动态更新**: 选择筛选条件后，使用 `meta.facets` 更新左侧筛选选项，只显示相关选项

✅ **防抖优化**: 用户快速切换时使用防抖避免频繁请求

## 📝 完整示例

```typescript
// 初始化
const init = async () => {
  const result = await fetch(
    '/api/recipes/search?page=1&pageSize=12&includeFacets=true'
  );
  const { data, meta } = await result.json();
  setRecipes(data);
  setAvailableFilters(meta.facets);
};

// 筛选变化
const onFilterChange = async (type: string, id: number, checked: boolean) => {
  const newSelected = { ...selectedFilters };
  if (checked) {
    newSelected[type].push(id);
  } else {
    newSelected[type] = newSelected[type].filter(x => x !== id);
  }

  const params = new URLSearchParams({
    page: '1',
    pageSize: '12',
    includeFacets: 'true',
  });

  Object.entries(newSelected).forEach(([key, ids]) => {
    if (ids.length > 0) params.append(key, ids.join(','));
  });

  const result = await fetch(`/api/recipes/search?${params}`);
  const { data, meta } = await result.json();

  setRecipes(data);
  setAvailableFilters(meta.facets); // 动态更新筛选选项
};
```

## ⚠️ 注意事项

1. **必须包含 `includeFacets=true`** 参数
2. ID 数组可以用逗号分隔字符串（`"1,2,3"`）传递
3. 空筛选条件可以不传该参数
4. facets 中的选项已按 count 降序、name 升序排序
5. 食谱默认按 isFeatured、viewCount、createdAt 降序排序
