# 食谱搜索接口文档

## 接口地址

```
GET /api/search/recipes
```

## 请求参数

| 参数名        | 类型         | 必填 | 默认值              | 说明                                                                     |
| ------------- | ------------ | ---- | ------------------- | ------------------------------------------------------------------------ |
| `q`           | string       | 是   | -                   | 搜索关键词，至少 1 个字符，为空时返回空结果                              |
| `page`        | number       | 否   | 1                   | 页码，从 1 开始                                                          |
| `pageSize`    | number       | 否   | 12                  | 每页数量，范围：1-50，超出会自动限制为 50                                |
| `tags`        | string       | 否   | -                   | 标签筛选，多个标签用逗号分隔，如：`"家常菜,素食"`                        |
| `difficulty`  | string       | 否   | -                   | 难度筛选，可选值：`"easy"`（简单）、`"medium"`（中等）、`"hard"`（困难） |
| `cookTimeGte` | number       | 否   | -                   | 最小烹饪时间（分钟），大于等于该值                                       |
| `cookTimeLte` | number       | 否   | -                   | 最大烹饪时间（分钟），小于等于该值                                       |
| `ratingGte`   | number       | 否   | -                   | 最小评分（0-5），大于等于该值                                            |
| `sort`        | string/array | 否   | `"updated_at:desc"` | 排序规则，支持多个排序用逗号分隔，格式：`"field:order"`                  |

### 排序选项说明

`sort` 参数支持以下字段和排序方向：

**可排序字段：**

- `updated_at` - 更新时间
- `rating` - 评分
- `cook_time` - 烹饪时间

**排序方向：**

- `asc` - 升序
- `desc` - 降序

**默认排序：** `updated_at:desc,rating:desc`（按更新时间降序，评分降序）

**排序示例：**

- 单个排序：`sort=rating:desc`
- 多个排序：`sort=rating:desc,updated_at:desc`（先按评分降序，再按更新时间降序）

## 请求示例

```bash
# 基础搜索
GET /api/search/recipes?q=番茄&page=1&pageSize=12

# 带筛选条件
GET /api/search/recipes?q=番茄&tags=家常菜,素食&difficulty=easy&cookTimeLte=30&ratingGte=4&sort=rating:desc

# 多条件组合
GET /api/search/recipes?q=番茄&tags=家常菜&difficulty=easy&cookTimeGte=10&cookTimeLte=30&ratingGte=4&sort=rating:desc,updated_at:desc&page=1&pageSize=20
```

## 响应结构

### 成功响应

```json
{
  "data": [
    {
      "id": 1,
      "slug": "tomato-egg-stir-fry",
      "title": "番茄<mark>炒</mark>蛋",
      "summary": "经典家常菜，简单易做",
      "ingredients": "番茄、鸡蛋、葱花",
      "body": "将番茄切块...",
      "tags": ["家常菜", "素食"],
      "cook_time": 15,
      "difficulty": "easy",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "rating": 4.5,
      "thumbnail": "http://localhost:1337/uploads/recipe_1.jpg",
      "url": "/recipes/tomato-egg-stir-fry",
      "highlight": {
        "title": "番茄<mark>炒</mark>蛋",
        "summary": "经典家常菜，简单易做",
        "ingredients": "番茄、鸡蛋、葱花",
        "body": "将番茄切块..."
      },
      "score": {}
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "pageCount": 5,
      "total": 58
    },
    "took": 12,
    "query": "炒",
    "source": "meilisearch",
    "degraded": false
  }
}
```

### 空结果响应（q 为空时）

```json
{
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 12,
      "pageCount": 0,
      "total": 0
    },
    "source": "meilisearch"
  }
}
```

### 降级响应（Meilisearch 不可用时）

```json
{
  "data": [...],
  "meta": {
    "pagination": {...},
    "source": "database",
    "degraded": true
  }
}
```

## 响应字段说明

### data 数组字段

| 字段名        | 类型                | 说明                                                                 |
| ------------- | ------------------- | -------------------------------------------------------------------- |
| `id`          | number              | 食谱 ID                                                              |
| `slug`        | string              | 食谱 slug，用于 URL                                                  |
| `title`       | string              | 标题，可能包含 `<mark>` 标签用于高亮显示                             |
| `summary`     | string              | 摘要，可能包含 `<mark>` 标签用于高亮显示                             |
| `ingredients` | string              | 食材列表，可能包含 `<mark>` 标签用于高亮显示                         |
| `body`        | string              | 正文内容，可能包含 `<mark>` 标签用于高亮显示                         |
| `tags`        | string[]            | 标签数组                                                             |
| `cook_time`   | number              | 烹饪时间（分钟）                                                     |
| `difficulty`  | string              | 难度，可选值：`"easy"`（简单）、`"medium"`（中等）、`"hard"`（困难） |
| `updated_at`  | string              | 更新时间（ISO 8601 格式）                                            |
| `rating`      | number              | 评分（0-5）                                                          |
| `thumbnail`   | string \| null      | 缩略图 URL，可能为 null                                              |
| `url`         | string              | 详情页 URL，格式：`/recipes/${slug}`，可直接用于跳转                 |
| `highlight`   | object \| undefined | 高亮字段对象（Meilisearch 返回时存在），包含高亮后的字段值           |
| `score`       | any                 | 匹配分数（Meilisearch 内部使用，前端可忽略）                         |

### highlight 对象字段

| 字段名        | 类型   | 说明                               |
| ------------- | ------ | ---------------------------------- |
| `title`       | string | 高亮后的标题（包含 `<mark>` 标签） |
| `summary`     | string | 高亮后的摘要（包含 `<mark>` 标签） |
| `ingredients` | string | 高亮后的食材（包含 `<mark>` 标签） |
| `body`        | string | 高亮后的正文（包含 `<mark>` 标签） |

### meta 对象字段

| 字段名       | 类型    | 说明                                                                   |
| ------------ | ------- | ---------------------------------------------------------------------- |
| `pagination` | object  | 分页信息                                                               |
| `took`       | number  | 搜索耗时（毫秒），仅 Meilisearch 返回时存在                            |
| `query`      | string  | 实际使用的搜索关键词（去除首尾空格后）                                 |
| `source`     | string  | 搜索源，`"meilisearch"` 或 `"database"`                                |
| `degraded`   | boolean | 是否降级到数据库搜索，`true` 表示 Meilisearch 不可用，使用了数据库降级 |

### pagination 对象字段

| 字段名      | 类型   | 说明     |
| ----------- | ------ | -------- |
| `page`      | number | 当前页码 |
| `pageSize`  | number | 每页数量 |
| `pageCount` | number | 总页数   |
| `total`     | number | 总结果数 |

## 特殊说明

### 高亮处理

- `title`、`summary`、`ingredients`、`body` 字段可能包含 `<mark>` 标签用于高亮显示关键词
- 如果存在 `highlight` 对象，优先使用 `highlight` 中的高亮版本
- 前端需要使用 `dangerouslySetInnerHTML` 或类似方式渲染包含 HTML 标签的内容
- 示例：`<span dangerouslySetInnerHTML={{ __html: recipe.highlight?.title || recipe.title }} />`

### 降级机制

- 当 Meilisearch 不可用时，接口会自动降级到数据库搜索
- 降级时 `meta.source` 为 `"database"`，`meta.degraded` 为 `true`
- 降级搜索不支持高亮功能，`highlight` 字段为 `undefined`
- 降级搜索的性能可能较差，但保证服务可用性

### 空搜索处理

- 当 `q` 参数为空或只包含空格时，返回空数组
- 不会发起实际搜索请求，直接返回空结果

### 搜索特性

- **同义词支持**：自动识别同义词，如"番茄"和"西红柿"、"土豆"和"马铃薯"
- **拼写容错**：支持拼写错误容错，5 个字符以上支持 1 个错误，9 个字符以上支持 2 个错误
- **停用词过滤**：自动过滤常见停用词（的、了、和、是等）
- **多字段搜索**：同时在标题、摘要、食材、正文中搜索

## 错误处理

### HTTP 状态码

| 状态码 | 说明           | 处理建议                 |
| ------ | -------------- | ------------------------ |
| 200    | 成功           | 正常处理响应数据         |
| 400    | 请求参数错误   | 检查请求参数格式和必填项 |
| 500    | 服务器内部错误 | 显示错误提示，可重试     |

### 错误响应格式

```json
{
  "error": {
    "status": 400,
    "name": "BadRequest",
    "message": "参数错误",
    "details": {
      "q": "搜索关键词不能为空"
    }
  }
}
```

## 注意事项

1. **参数验证**

   - `q` 参数必填，为空时返回空结果（不会报错）
   - `page` 最小值为 1，小于 1 会自动修正为 1
   - `pageSize` 范围 1-50，超出范围会自动限制

2. **高亮渲染**

   - 必须使用 `dangerouslySetInnerHTML` 渲染包含 `<mark>` 标签的字段
   - 建议对用户输入进行 XSS 防护，但搜索结果中的高亮标签是安全的

3. **性能优化**

   - 建议对搜索请求进行防抖处理（300-500ms）
   - 空搜索词时不发起请求
   - 可以使用响应中的 `took` 字段监控搜索性能

4. **降级处理**

   - 前端可通过 `meta.degraded` 判断是否降级
   - 降级时建议显示提示信息，但不影响正常使用
   - 降级搜索不支持高亮，需要前端自行处理高亮显示

5. **分页处理**

   - 使用 `meta.pagination` 中的信息进行分页展示
   - `total` 为估算值（Meilisearch 返回时），可能不完全准确
   - 建议限制最大页码，避免无效请求

6. **筛选条件**

   - 多个筛选条件之间是 AND 关系
   - `tags` 参数支持多个标签，用逗号分隔，标签之间是 OR 关系
   - 时间范围：`cookTimeGte` 和 `cookTimeLte` 可以单独使用或组合使用

7. **排序规则**
   - 支持多字段排序，按顺序应用
   - 排序字段必须是可排序字段之一
   - 无效的排序规则会被忽略，使用默认排序

## 使用建议

### 基础搜索框实现

```typescript
// 1. 防抖处理搜索输入
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

// 2. 调用搜索接口
const { data, isLoading, error } = useQuery({
  queryKey: ['search-recipes', debouncedQuery],
  queryFn: () =>
    api.get('/search/recipes', {
      params: { q: debouncedQuery, page: 1, pageSize: 12 },
    }),
  enabled: !!debouncedQuery.trim(), // 空搜索不请求
});

// 3. 渲染高亮结果
{
  data?.data.map(recipe => (
    <div key={recipe.id}>
      <h3
        dangerouslySetInnerHTML={{
          __html: recipe.highlight?.title || recipe.title,
        }}
      />
    </div>
  ));
}
```

### 带筛选的搜索

```typescript
const searchParams = {
  q: '番茄',
  page: 1,
  pageSize: 12,
  tags: '家常菜,素食', // 或 ['家常菜', '素食']
  difficulty: 'easy',
  cookTimeLte: 30,
  ratingGte: 4,
  sort: 'rating:desc,updated_at:desc',
};
```

### 错误处理示例

```typescript
if (error) {
  if (error.status === 400) {
    // 参数错误
    showError('搜索参数错误，请检查输入');
  } else if (error.status >= 500) {
    // 服务器错误
    showError('搜索服务暂时不可用，请稍后重试');
  } else {
    // 其他错误
    showError('搜索失败，请重试');
  }
}
```
