# 产品属性模块设计文档

## 1. 背景与目标

当前 Prism 的商品详情页已经形成明确的数据边界：Magento 负责商品交易事实与核心商品事实，Strapi 负责商品内容增强与运营配置，Prism 负责页面级聚合与渲染。现有 `product-enrichment` 已承载标题、副标题、详情富文本、图片、卖点、保障、SEO、关联内容等 PDP 内容模块，但尚未形成一套可复用、可维护、可扩展的“产品属性/规格说明”能力。

本次产品属性模块的目标不是临时补一块静态说明，而是建立一套适合电器类商品的规格管理体系，使运营可以在 Strapi 中以较低成本维护产品参数说明，并由 Prism 以说明书表格的方式稳定输出到 PDP。

本次设计目标：

1. 快速落地，优先满足一期上线与运营录入需求。
2. 以 Strapi 为管理中心，便于运营配置与后续维护。
3. 结构清晰，避免把模板、字段定义、字段值混在一起，导致后续扩展困难。
4. 保证未来可以支持更多电器品类、更多字段类型、更多展示方式，而不需要推翻重做。

本次设计不追求一步到位做成完整 PIM（Product Information Management）系统，而是建立“轻量分层、边界清晰、可演进”的第一版能力。

---

## 2. 已确认的关键决策

基于当前讨论，以下决策已收敛：

1. 产品属性模块由 Strapi 管理，不放在 Magento，也不在前端硬编码。
2. 前端展示形态一期采用“说明书表格型”，以参数名/参数值的二维表为主。
3. 模型策略采用“模板 + 自定义补充”，而不是纯固定模板，也不是完全自由配置。
4. 模板挂载维度不直接依赖前台类目，而采用 Strapi 自定义产品类型/模板体系。
5. 商品属性模块继续沿用当前 PDP 的数据聚合边界：Strapi 产出内容层数据，Prism 聚合后渲染。
6. 联结主键仍以 `sku` 为核心，不改变现有 `product-enrichment` 与 Magento 的聚合关系。

这些决策决定了该模块在工程上应当属于 `product-enrichment` 体系的扩展能力，而不是一个脱离现有 PDP 聚合架构的旁路模块。

---

## 3. 设计原则

### 3.1 分层清晰

属性模板、字段定义、商品字段值、自定义补充必须分层，不允许把结构定义和商品值混在同一坨 JSON 中长期演化。

### 3.2 一期尽量轻

虽然需要为未来扩展预留空间，但一期不做模板继承、多模板叠加、复杂计算字段、复杂单位换算、复杂国际化策略。当前目标是做出一套足够稳的基础模型。

### 3.3 运营优先

Strapi 中的录入与维护体验必须可理解。运营最常见的工作应该是：

1. 选择商品使用哪套模板。
2. 给模板字段填值。
3. 在必要时补少量模板外字段。

而不是每个商品都重新从头定义一遍参数结构。

### 3.4 前端只消费规范化结果

Prism 不应感知 Strapi 后台内部有多少层模型，也不应在前端处理复杂的模板/字段定义合并逻辑。前端应该只接收一份可直接渲染的规格表结构。

### 3.5 兼容现有 PDP 聚合链

现有 PDP 已通过 `fetchUnifiedProductBySku` 聚合 Magento 与 Strapi enrichments。本模块必须继续沿用该聚合链，避免再开一条与现有 enrichment 平行的独立内容流。

---

## 4. 推荐方案概述

推荐采用“轻量分层模型”：

1. Strapi 中建立独立的属性模板体系。
2. 商品侧显式绑定一个主模板。
3. 商品针对模板字段填写具体值。
4. 商品可在指定分组下追加少量自定义字段。
5. Prism 侧只消费规范化后的规格分组表格结构。

这不是最轻的“一个 JSON 字段全塞进去”的方案，但它是当前阶段最平衡的方案：

1. 比纯 JSON 更容易长期维护。
2. 比完整企业级主数据系统更轻，落地更快。
3. 能兼顾运营可配置、前端简单接入和未来扩展。

---

## 5. Strapi Changes

### 5.1 总体建模策略

推荐将产品属性模块作为 `product-enrichment` 的扩展能力来设计，但不建议把所有属性信息直接塞进现有 `product-enrichment` 的单一 JSON 字段。更合理的做法是：

1. 独立定义模板主体。
2. 独立定义模板分组。
3. 独立定义字段定义。
4. 在商品内容层维护字段值与自定义补充。

这样做的核心价值在于：模板层定义“结构”，商品层定义“值”，展示层输出“结果”。三层边界清晰。

### 5.2 推荐的核心概念

#### A. `product-attribute-template`

表示一套规格模板，例如：

- `air-fryer`
- `rice-cooker`
- `blender`
- `kettle`

建议字段：

- `name`
- `slug`
- `description`
- `is_active`

职责：

1. 作为模板复用的根节点。
2. 表示一类产品的规格结构。
3. 承载模板级元信息，不直接保存商品值。

#### B. `product-attribute-group`

表示模板下的一个规格分组，例如：

- `General`
- `Capacity & Size`
- `Power`
- `Materials`
- `In The Box`

建议字段：

- `template`
- `title`
- `key`
- `sort_order`
- `is_active`

职责：

1. 给规格表提供说明书式分组结构。
2. 为前台表格渲染提供分段基础。
3. 作为模板字段和自定义字段的挂载容器。

#### C. `product-attribute-definition`

表示模板中的一个字段定义，例如：

- `Rated Power`
- `Capacity`
- `Voltage`
- `Net Weight`
- `Product Dimensions`

建议字段：

- `template`
- `group`
- `label`
- `key`
- `value_type`
- `unit`
- `sort_order`
- `is_required`
- `is_active`
- `help_text`（可选）

其中 `value_type` 一期建议只支持：

- `text`
- `number`
- `boolean`

职责：

1. 定义模板有哪些字段。
2. 统一字段命名，避免运营在商品层反复发明近义字段。
3. 为未来的校验、搜索、国际化和展示扩展保留基础。

#### D. `product-attribute-value`

表示某个商品对某个字段定义的实际取值。

建议字段：

- `product_enrichment`
- `attribute_definition`
- `value_text`
- `value_number`
- `value_boolean`
- `override_label`
- `sort_order`
- `group`（仅用于自定义字段）
- `custom_label`（仅用于自定义字段）

职责：

1. 保存某个商品对模板字段的值。
2. 在极少数情况下允许覆盖展示名。
3. 承接商品级自定义补充字段。

### 5.3 商品与模板的关系

推荐一个商品最多绑定一个主模板，并由商品内容层显式绑定，而不是由前端或接口层按类目自动推导。

推荐关系：

1. `product-enrichment` 新增一个到 `product-attribute-template` 的关联。
2. `product-enrichment` 下维护当前商品的 `product-attribute-value` 集合。
3. 读取时由后端或 Prism 聚合出完整规格结果。

不建议一期采用“按前台类目自动匹配模板”的方案，原因如下：

1. 前台类目属于发现与展示结构，不是稳定的模板边界。
2. 同类目前台类目下仍可能存在规格体系差异很大的商品。
3. 显式绑定模板更符合运营的管理心智，也更利于排查问题。

### 5.4 自定义补充字段策略

推荐允许少量自定义字段，但必须受到约束，不可成为主路径。

建议规则：

1. 自定义字段仍然挂在既有 group 下。
2. 自定义字段仍然输出成统一的参数行结构。
3. 自定义字段必须有 `custom_label`。
4. 自定义字段一期仅支持简单值类型，不支持嵌套结构。
5. 自定义字段数量应在运营规范中受控，避免模板失效。

推荐把自定义字段纳入 `product-attribute-value` 的统一体系，而不是额外再造一套完全独立的数据结构。这样可以保证模板字段和自定义字段最终都能归一输出为同一种行结构。

### 5.5 Phase 1 明确采用 Strapi component 快速落地

本设计在实施上明确采用两阶段方案，其中 **Phase 1 的正式实现路径** 为：在现有 `product-enrichment` 上增加 `specifications` repeatable component，先打通运营配置、Prism 聚合和 PDP 渲染。

这样收口的原因是：

1. 当前 Strapi 已经大量使用 repeatable component 模式，和现有代码风格一致。
2. 该方案对现有 `product-enrichment` 改动最小，最适合快速验证运营是否真的高频使用该模块。
3. 可以先把前后端契约定下来，再在 Phase 2 把后台录入从“自由录入”升级为“模板驱动录入”。

#### Phase 1 组件草案：`product.specification-row`

建议新增组件文件：`D:\WORK\helpcenter\backend\src\components\product\specification-row.json`

```json
{
  "collectionName": "components_product_specification_rows",
  "info": {
    "displayName": "Product Specification Row",
    "description": "商品规格表行，用于 PDP Specifications 区块"
  },
  "options": {
    "timestamps": false
  },
  "attributes": {
    "group_key": {
      "type": "string",
      "required": true,
      "maxLength": 100,
      "description": "规格分组 key，例如 general、power、dimensions"
    },
    "group_title": {
      "type": "string",
      "required": true,
      "maxLength": 100,
      "description": "规格分组标题，例如 General、Power"
    },
    "key": {
      "type": "string",
      "required": true,
      "maxLength": 100,
      "description": "规格字段 key，例如 rated_power、capacity"
    },
    "label": {
      "type": "string",
      "required": true,
      "maxLength": 150,
      "description": "规格字段显示名"
    },
    "value": {
      "type": "text",
      "required": true,
      "maxLength": 500,
      "description": "规格字段显示值，Phase 1 统一按字符串存储"
    },
    "sort_order": {
      "type": "integer",
      "default": 0,
      "min": 0,
      "description": "表格行排序，越小越靠前"
    },
    "is_highlighted": {
      "type": "boolean",
      "default": false,
      "description": "是否重点规格，Phase 1 前端可忽略，供 Phase 2 复用"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "是否启用该规格行"
    }
  }
}
```

#### Phase 1 对 `product-enrichment` 的扩展

建议在 `D:\WORK\helpcenter\backend\src\api\product-enrichment\content-types\product-enrichment\schema.json` 中增加：

```json
"specifications": {
  "type": "component",
  "repeatable": true,
  "component": "product.specification-row",
  "description": "商品规格表数据，用于 PDP Specifications 区块"
}
```

#### Phase 1 的技术边界

1. Strapi 内部不引入模板模型。
2. 运营直接在 `product-enrichment` 内录入规格行。
3. Prism 拿到的契约已经按最终目标结构输出。
4. 不在 Phase 1 做字段类型渲染差异，统一按字符串展示。

#### Phase 2 的升级方向

Phase 2 再把当前 component 模型升级为模板驱动模型，升级后由模板定义字段结构、商品只维护字段值和少量自定义补充。Phase 1 的 `group_key`、`group_title`、`key` 会成为 Phase 2 迁移时最重要的稳定字段。

因此本设计不是在 Phase 1 放弃模板化，而是在 Phase 1 先把前台契约与后台录入跑通，再在 Phase 2 把后台模型升级到模板体系。

### 5.6 Phase 2 模板化模型草案

Phase 2 的目标是把 Phase 1 的自由录入收敛到模板体系中，以下为建议的 Strapi content-type 草案。

#### A. `product-attribute-template`

建议路径：`src/api/product-attribute-template/content-types/product-attribute-template/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "product_attribute_templates",
  "info": {
    "singularName": "product-attribute-template",
    "pluralName": "product-attribute-templates",
    "displayName": "Product Attribute Templates",
    "description": "商品规格模板，定义一类商品的规格结构"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "name": { "type": "string", "required": true, "maxLength": 150 },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "description": { "type": "text", "maxLength": 1000 },
    "is_active": { "type": "boolean", "default": true }
  }
}
```

#### B. `product-attribute-group`

建议路径：`src/api/product-attribute-group/content-types/product-attribute-group/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "product_attribute_groups",
  "info": {
    "singularName": "product-attribute-group",
    "pluralName": "product-attribute-groups",
    "displayName": "Product Attribute Groups",
    "description": "商品规格模板分组"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "template": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::product-attribute-template.product-attribute-template",
      "required": true
    },
    "title": { "type": "string", "required": true, "maxLength": 100 },
    "key": { "type": "string", "required": true, "maxLength": 100 },
    "sort_order": { "type": "integer", "default": 0, "min": 0 },
    "is_active": { "type": "boolean", "default": true }
  }
}
```

#### C. `product-attribute-definition`

建议路径：`src/api/product-attribute-definition/content-types/product-attribute-definition/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "product_attribute_definitions",
  "info": {
    "singularName": "product-attribute-definition",
    "pluralName": "product-attribute-definitions",
    "displayName": "Product Attribute Definitions",
    "description": "商品规格字段定义"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "template": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::product-attribute-template.product-attribute-template",
      "required": true
    },
    "group": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::product-attribute-group.product-attribute-group",
      "required": true
    },
    "label": { "type": "string", "required": true, "maxLength": 150 },
    "key": { "type": "string", "required": true, "maxLength": 100 },
    "value_type": {
      "type": "enumeration",
      "enum": ["text", "number", "boolean"],
      "default": "text",
      "required": true
    },
    "unit": { "type": "string", "maxLength": 50 },
    "sort_order": { "type": "integer", "default": 0, "min": 0 },
    "is_required": { "type": "boolean", "default": false },
    "is_active": { "type": "boolean", "default": true },
    "help_text": { "type": "text", "maxLength": 500 }
  }
}
```

#### D. `product-attribute-value`

建议路径：`src/api/product-attribute-value/content-types/product-attribute-value/schema.json`

```json
{
  "kind": "collectionType",
  "collectionName": "product_attribute_values",
  "info": {
    "singularName": "product-attribute-value",
    "pluralName": "product-attribute-values",
    "displayName": "Product Attribute Values",
    "description": "商品规格字段值"
  },
  "options": {
    "draftAndPublish": false
  },
  "pluginOptions": {},
  "attributes": {
    "product_enrichment": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::product-enrichment.product-enrichment",
      "required": true
    },
    "attribute_definition": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::product-attribute-definition.product-attribute-definition"
    },
    "group_key": { "type": "string", "maxLength": 100 },
    "custom_label": { "type": "string", "maxLength": 150 },
    "override_label": { "type": "string", "maxLength": 150 },
    "value_text": { "type": "text", "maxLength": 500 },
    "value_number": { "type": "decimal" },
    "value_boolean": { "type": "boolean" },
    "sort_order": { "type": "integer", "default": 0, "min": 0 },
    "is_custom": { "type": "boolean", "default": false }
  }
}
```

### 5.7 Phase 1 到 Phase 2 的迁移原则

为了避免 Phase 1 变成技术债，迁移策略必须提前明确：

1. Phase 1 的 `group_key`、`group_title`、`key` 会作为迁移锚点。
2. 迁移时先建立模板、分组、字段定义，再把已有 component 规格行映射为字段值。
3. 若多个商品重复出现相同 `group_key + key + label`，优先沉淀为模板字段。
4. 无法归入模板的少量字段，落入 `is_custom = true` 的自定义字段路径。
5. Phase 2 完成后，Prism 的消费契约保持不变，不要求前端跟着迁移。
---

## 6. Prism Changes

### 6.1 聚合位置

Prism 侧的属性模块不应独立于现有 PDP 聚合逻辑。推荐继续收敛在 `fetchUnifiedProductBySku` 所在的统一聚合链中。

当前事实：

- `apps/prism/lib/api/unified-product.ts` 负责 Magento 与 Strapi enrichment 的聚合。
- `apps/prism/lib/api/strapi/product-enrichment.ts` 负责拉取和标准化 Strapi 商品内容。
- `apps/prism/app/products/[sku]/page.tsx` 负责把聚合结果渲染到 PDP。

因此产品属性模块的前端接入原则应该是：

1. 由 Strapi enrichment API 读取属性相关数据。
2. 在 `product-enrichment.ts` 内做标准化。
3. 在 `unified-product.ts` 中把属性模块并入 `UnifiedProduct` 或其附属展示结构。
4. 页面层只消费统一后的结构。

### 6.2 前端消费结构

Prism 页面层不要感知模板、字段定义、商品值的内部关系，应该只接收如下形态的结构：

```ts
interface ProductSpecificationRow {
  key: string;
  label: string;
  value: string;
  source?: 'template' | 'custom';
  highlighted?: boolean;
}

interface ProductSpecificationGroup {
  id: string;
  title: string;
  rows: ProductSpecificationRow[];
}
```

一期前端不应依赖复杂字段类型，只需要完成稳定表格渲染。

#### `StrapiProductEnrichment` 扩展建议

建议在 `apps/prism/lib/api/strapi/product-enrichment.ts` 的对外类型中增加：

```ts
export interface StrapiProductEnrichment {
  // ...existing fields
  specifications?: ProductSpecificationGroup[];
}
```

#### `UnifiedProduct` 扩展建议

建议在 `apps/prism/lib/api/unified-product.ts` 中增加：

```ts
export interface UnifiedProduct extends MagentoProduct {
  // ...existing fields
  specifications?: ProductSpecificationGroup[];
}
```

并在 `mergeProduct()` 中显式并入：

```ts
return {
  ...magento,
  // ...existing merged fields
  specifications: enrichment?.specifications,
};
```

这样可以明确规格数据是 PDP 可直接消费的顶层展示字段，而不是隐藏在富文本字段或某个模糊的 content namespace 之下。

### 6.3 PDP 页面承接方式

当前 PDP 已有以下区块：

- `Features`
- `Details`
- `Reviews`
- `Recipes`
- `Blog`

产品属性模块非常适合作为新的 `Specifications` 区块插入 PDP。建议：

1. 在 `buildPdpSectionNav` 中新增 `Specifications` 锚点逻辑。
2. 在 `page.tsx` 中新增规格区块渲染。
3. 规格区块采用说明书表格风格，不做过度营销化设计。
4. 规格表组件应独立封装，避免把渲染细节直接堆进页面文件。

建议的具体接入点：

1. anchor id 固定为 `section-specifications`。
2. 仅当 `(product.specifications?.length ?? 0) > 0` 时，才将其加入 `buildPdpSectionNav()`。
3. section 顺序建议放在 `Details` 之后、`Recipes` 之前，以保持“卖点/详情/规格/关联内容”的信息组织顺序。
4. 页面区块同样按 `(product.specifications?.length ?? 0) > 0` 做条件渲染。

建议代码骨架如下：

```ts
if ((product.specifications?.length ?? 0) > 0) {
  sections.push({
    id: 'section-specifications',
    label: 'Specifications',
  });
}
```

页面层对应形态：

```tsx
{(product.specifications?.length ?? 0) > 0 && (
  <div id="section-specifications">
    <div className="border-t border-border" />
    <ProductSpecifications groups={product.specifications ?? []} />
  </div>
)}
```

建议渲染行为：

1. 若没有规格数据，则不渲染 `Specifications` 区块，也不加入 section nav。
2. 按 group 渲染多个表格或一个带分组标题的连续表格。
3. 每行只展示 `label` 和 `value`，避免一期加入复杂交互。
4. 文案统一英文输出，符合当前仓库的 UI 文案规则。
5. 空 group 在标准化阶段就过滤掉，不进入页面层。
### 6.4 与现有详情区块的关系

规格模块与现有 `product_detail_html` 不应混在一个区块里。

建议边界：

1. `product_detail_html` 继续承载富文本介绍内容，偏图文详情。
2. `specifications` 承载参数表，偏说明书式结构化内容。
3. 二者可前后相邻，但应分成不同 section。

这样可以保持内容职责清晰，也方便运营分别维护“介绍内容”和“规格参数”。

---

## 7. API / Schema Contract Changes

### 7.1 Strapi 对 Prism 的目标输出契约

无论 Strapi 内部最终采用完整分层模型，还是阶段性采用 component 过渡实现，Prism 侧最终拿到的数据契约都应保持稳定。

推荐 Prisma/Next 消费契约：

```ts
interface ProductSpecificationRow {
  key: string;
  label: string;
  value: string;
  source?: 'template' | 'custom';
  highlighted?: boolean;
}

interface ProductSpecificationGroup {
  id: string;
  title: string;
  rows: ProductSpecificationRow[];
}
```

扩展字段可后续再加，但一期必须坚持：

1. key 稳定。
2. label 可展示。
3. value 已标准化为字符串。
4. groups 已完成排序。
5. rows 已完成排序。
6. 空 group 在适配层过滤，不返回给页面层。

#### Phase 1 的 Strapi 读取方式

Phase 1 不新增独立规格接口，继续由现有 `product-enrichment` 读取链承接。Prism 会通过现有 enrichment 查询拿到 `specifications` component，并在适配层转换为 `ProductSpecificationGroup[]`。

建议查询方向：

```http
GET /api/product-enrichments?filters[sku][$eq]=<sku>&populate[specifications]=true
```

在 Strapi 原始响应中，`specifications` 仍是 repeatable component 行数组；在 Prism 的 `apps/prism/lib/api/strapi/product-enrichment.ts` 中完成以下转换：

1. 过滤 `enabled === false` 的行。
2. 按 `group_key` + `group_title` 聚合成 groups。
3. 按 `sort_order` 对 rows 排序。
4. 过滤空 value 和空 group。
5. 输出给 `StrapiProductEnrichment.specifications`。

也就是说，本模块的标准化责任明确落在 Prism 的 Strapi adapter 层，而不是 Strapi controller/service 自定义接口层。
### 7.2 `StrapiProductEnrichment` 扩展建议

Prism 侧 `StrapiProductEnrichment` 可增加如下字段：

```ts
specifications?: ProductSpecificationGroup[];
```

再由 `UnifiedProduct` 决定是否直接暴露：

```ts
specifications?: ProductSpecificationGroup[];
```

这样做的好处是：

1. PDP 可直接消费。
2. 未来列表页、对比页、搜索结果页如需复用，也有统一字段。
3. 不会把属性数据塞进与其语义不匹配的 `description_html` 等字段中。

### 7.3 标准化责任归属

建议把“字段值转字符串、单位拼接、布尔文案转换、空值过滤、排序”放在 Strapi API 适配层或 Prism 的 Strapi client 适配层完成，而不是放在组件层。

也就是说，组件层不应该知道：

- 这个字段本来是 `number` 还是 `boolean`
- 这个字段有没有 unit
- 这个字段是不是模板字段

组件层只负责渲染已经标准化完毕的数据。

### 7.4 可选的搜索索引扩展

结合当前 Strapi 的 Meilisearch 集成，一期不建议默认把全部规格字段打进商品索引。

原因：

1. 规格字段数量可能持续增长。
2. 并不是所有规格都具备搜索价值。
3. 一期的主目标是 PDP 展示与运营管理，不是规格检索。

建议策略：

1. 一期先不把 `specifications` 作为 Meilisearch 的核心 searchable/filterable 字段。
2. 二期如果出现明确需求，再只挑高价值字段加入索引，例如容量、功率、电压、材质等。
3. 如需搜索能力，优先建立“可索引字段白名单”，不要把整套规格无差别扔进索引。

---

## 8. 实施策略建议

### 8.1 推荐采用分阶段落地

为了兼顾“快速实现”和“工程可持续”，建议实施分两期。

#### Phase 1：快速可用版

目标：在最短路径上打通 Strapi 录入、Prism 展示、PDP 可用。

建议做法：

1. 在 Strapi 的 `product-enrichment` 增加一个可重复规格结构。
2. 先让运营可以按分组录入 `label/value`。
3. Prism 新增规格区块并渲染说明书表格。
4. 契约层直接输出统一的 `specifications` groups 结构。

这一步解决“先能用、先能维护”的问题。

#### Phase 2：模板化升级版

目标：把 Phase 1 的可用规格录入收敛到模板体系中。

建议做法：

1. 新增模板、分组、字段定义模型。
2. 为商品绑定主模板。
3. 把商品值从自由录入迁移为模板驱动录入。
4. 保留少量自定义补充字段兜底。

这一步解决“长期一致性、字段复用、扩展能力”的问题。

### 8.2 为什么不建议一期直接做满

因为当前项目仍处于多模块并行推进阶段，且 PDP 内容模块本身已经包含多个 Strapi 能力。如果一期就把属性系统做成高度复杂的主数据平台，会出现几个问题：

1. Strapi 建模和后台录入复杂度过高。
2. 前后端联调成本升高。
3. 用户真正需要验证的“运营是否好维护、PDP 是否好用”被推迟。

因此推荐的策略不是“设计简陋”，而是“设计目标正确，实施节奏渐进”。

---

## 9. 风险与约束

### 9.1 风险：过度依赖自定义字段

如果运营长期大量使用自定义字段，模板体系会被架空。

控制建议：

1. 将自定义字段作为例外路径而不是主路径。
2. 在运营规范中约束使用场景。
3. 定期把高频自定义字段沉淀回模板定义。
4. 在 Phase 2 的 Strapi 校验中加入技术约束：默认每个商品最多允许 3 个 `is_custom = true` 的字段值。
5. 当商品出现超过 1 个自定义字段时，应在后台 review 流程中提醒是否需要回收进模板定义。

这里不建议一期就做复杂审批系统，但需要在设计上明确：自定义字段不是无限开放能力，而是受控兜底机制。

### 9.2 风险：字段命名漂移

如果一期直接使用自由录入规格行，后续可能出现同义字段泛滥。

控制建议：

1. Phase 2 必须补齐模板定义层。
2. 引入稳定的 `key`，而不只依赖展示 `label`。
3. 迁移时以 `key` 为主，而不是靠文案比对。

### 9.3 风险：前台类目与模板边界混淆

如果后续让前台类目直接决定模板，模板体系会和商品发现体系强耦合。

控制建议：

1. 模板继续由商品内容层显式绑定。
2. 发现类目只负责前台展示归属，不承担规格模板边界。

### 9.4 风险：前端承担过多格式化逻辑

如果把数据标准化逻辑丢给组件层，会导致组件复杂、测试困难、后续复用差。

控制建议：

1. 在 API 适配层完成数据标准化。
2. 前端组件只负责渲染已经准备好的结构。

### 9.5 风险：索引与查询范围失控

如果把全部规格字段都纳入 Meilisearch，后续索引维护和查询策略会变复杂。

控制建议：

1. 一期先聚焦 PDP 展示。
2. 搜索/筛选能力作为后续独立议题处理。
3. 为索引建立白名单机制，而不是全量开放。

---

## 10. 推荐的最终收口

综合当前项目边界、用户诉求与现有代码结构，推荐的最终方向如下：

1. **产品属性模块归属 Strapi 管理**，继续作为 `product-enrichment` 体系中的一项内容增强能力。
2. **Prism 继续通过统一聚合链消费规格数据**，不建立新的平行内容流。
3. **前台一期展示采用说明书表格型**，作为 PDP 新的 `Specifications` 区块。
4. **建模目标采用轻量分层模型**：模板、分组、字段定义、商品值、自定义补充分层清晰。
5. **实施节奏采用两阶段策略**：先快速落地可用版，再向模板化升级版演进。

这个方案的本质不是追求“最少代码”，而是追求“最小但正确的系统形态”。它能让当前业务尽快拿到结果，同时避免未来在更多电器品类扩展时被迫推翻。

---

## 11. Verification Steps

本设计确认后的后续验证建议分为四部分。

### Prism changes

1. 确认 `apps/prism/lib/api/strapi/product-enrichment.ts` 能稳定输出 `specifications` 规范化结构。
2. 确认 `apps/prism/lib/api/unified-product.ts` 聚合后结构清晰，不污染现有字段语义。
3. 确认 `apps/prism/app/products/[sku]/page.tsx` 新增 `Specifications` 区块后，PDP section nav 行为正确。
4. 确认规格区块在无数据时自动隐藏。

### Strapi changes

1. 确认运营可在 Strapi 中完成规格录入与排序。
2. 确认商品与模板的绑定关系明确、不会被前台类目逻辑干扰。
3. 确认自定义字段路径可用，但不会成为默认主路径。
4. 确认 Strapi 返回结构稳定，避免字段名和空值语义反复变化。

### API/schema contract changes

1. 确认 `specifications` 契约字段名、空值策略、排序语义固定。
2. 确认行级结构对前端完全够用，不依赖页面层二次加工。
3. 确认未来如扩展字段类型，不破坏一期 `label/value` 的消费方式。

### Verification commands

后续进入实现阶段后，建议至少验证：

1. `pnpm nx test prism -- --run`
2. `pnpm check`
3. 若新增 PDP 规格区块测试，补充对应单测与必要的组件渲染测试。
4. 若变更 Strapi schema，验证 Prism 本地联调时真实 SKU 能拿到规格结构并成功渲染。

### Cross-repo verification checklist

1. 在 Strapi 后台为一个真实 SKU 填入 `specifications` 数据。
2. 确认 Prism 的 `product-enrichment` 适配层能把原始 component 数据转成 `ProductSpecificationGroup[]`。
3. 确认无规格数据的 SKU 不出现 `Specifications` section nav 和页面区块。
4. 确认有规格数据的 SKU 正常渲染 `section-specifications`。
5. 确认 `product_detail_html` 与 `specifications` 在页面上保持分离，不互相污染职责。
6. 若进入 Phase 2，补充验证历史 Phase 1 数据迁移后前端契约保持不变。
