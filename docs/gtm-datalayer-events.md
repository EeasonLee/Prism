# GTM Ecommerce DataLayer Events 清单

> 基于 GTM 容器 `GTM-5NSD5G9L` (www.joydeem.com) 导出配置
> 所有事件通过 `window.dataLayer.push()` 触发，GTM 监听对应自定义事件名称

---

## 通用 User Properties（每次 push 建议带上）

```typescript
interface UserProperties {
  customerId?: string; // 登录用户 ID
  customerGroup?: string; // 客户分组 (e.g. "general", "vip")
}
```

---

## 1. view_item_list — 商品列表浏览

**触发时机**：分类页、搜索结果页、首页推荐列表等商品列表展示时

**GTM Trigger**: `WP - GA4 - view_item_list` (ID: 5)

```typescript
window.dataLayer.push({
  event: 'view_item_list',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    items: [
      {
        item_id: 'SKU001',
        item_name: 'Product Name',
        item_brand: 'Joydeem',
        item_category: 'Kitchen Appliances',
        item_category2: 'Rice Cookers',
        price: '99.99',
        currency: 'USD',
        quantity: 1,
        item_list_name: 'Rice Cookers Category', // 列表名称
        item_list_id: 'category_42', // 列表 ID
        index: 0, // 列表中的位置
      },
    ],
  },
});
```

---

## 2. view_item — 商品详情页浏览

**触发时机**：进入商品详情页时

**GTM Trigger**: `WP - GA4 - view_item` (ID: 25)

```typescript
window.dataLayer.push({
  event: 'view_item',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    items: [
      {
        item_id: 'SKU001',
        item_name: 'Product Name',
        item_brand: 'Joydeem',
        item_category: 'Kitchen Appliances',
        item_category2: 'Rice Cookers',
        price: '99.99',
        currency: 'USD',
        quantity: 1,
      },
    ],
  },
});
```

---

## 3. select_item — 商品列表点击

**触发时机**：用户从列表中点击某个商品时

**GTM Trigger**: `WP - GA4 - select_item` (ID: 23)

```typescript
window.dataLayer.push({
  event: 'select_item',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    action: {
      items: [
        {
          item_id: 'SKU001',
          item_name: 'Product Name',
          item_brand: 'Joydeem',
          item_category: 'Kitchen Appliances',
          price: '99.99',
          currency: 'USD',
          quantity: 1,
          item_list_name: 'Rice Cookers Category',
          item_list_id: 'category_42',
          index: 0,
        },
      ],
    },
  },
});
```

---

## 4. add_to_cart — 加入购物车

**触发时机**：用户点击 "Add to Cart" 按钮时

**GTM Trigger**: `WP - GA4 - add_to_cart` (ID: 12)

```typescript
window.dataLayer.push({
  event: 'add_to_cart',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    action: {
      items: [
        {
          item_id: 'SKU001',
          item_name: 'Product Name',
          item_brand: 'Joydeem',
          item_category: 'Kitchen Appliances',
          price: '99.99',
          currency: 'USD',
          quantity: 2, // 用户选择的数量
        },
      ],
    },
  },
});
```

---

## 5. remove_from_cart — 从购物车移除

**触发时机**：用户从购物车中移除商品时

**GTM Trigger**: `WP - GA4 - remove_from_cart` (ID: 22)

```typescript
window.dataLayer.push({
  event: 'remove_from_cart',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    action: {
      items: [
        {
          item_id: 'SKU001',
          item_name: 'Product Name',
          item_brand: 'Joydeem',
          item_category: 'Kitchen Appliances',
          price: '99.99',
          currency: 'USD',
          quantity: 1, // 移除的数量
        },
      ],
    },
  },
});
```

---

## 6. view_promotion — 促销活动展示

**触发时机**：Banner、优惠券、活动区块等促销内容展示在用户视野中时

**GTM Trigger**: `WP - GA4 - view_promotion` (ID: 7)

```typescript
window.dataLayer.push({
  event: 'view_promotion',
  ecommerce: {
    items: [
      {
        item_id: 'PROMO_001',
        item_name: 'Summer Sale Banner',
        creative_name: 'summer_sale_hero_banner',
        creative_slot: 'homepage_top',
        promotion_id: 'SUMMER2026',
        promotion_name: 'Summer Sale 2026',
      },
    ],
  },
});
```

---

## 7. select_promotion — 促销活动点击

**触发时机**：用户点击 Banner、优惠券、活动链接时

**GTM Trigger**: `WP - GA4 - select_promotion` (ID: 38)

```typescript
window.dataLayer.push({
  event: 'select_promotion',
  ecommerce: {
    items: [
      {
        item_id: 'PROMO_001',
        item_name: 'Summer Sale Banner',
        creative_name: 'summer_sale_hero_banner',
        creative_slot: 'homepage_top',
        promotion_id: 'SUMMER2026',
        promotion_name: 'Summer Sale 2026',
      },
    ],
  },
});
```

---

## 8. begin_checkout — 开始结算

**触发时机**：用户进入结算页面（点击 "Checkout" 按钮）时

**GTM Trigger**: `WP - GA4 - begin_checkout` (ID: 28)

```typescript
window.dataLayer.push({
  event: 'begin_checkout',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    items: [
      {
        item_id: 'SKU001',
        item_name: 'Product Name',
        item_brand: 'Joydeem',
        item_category: 'Kitchen Appliances',
        price: '99.99',
        currency: 'USD',
        quantity: 2,
      },
    ],
  },
});
```

---

## 9. add_shipping_info — 添加配送信息

**触发时机**：用户填写并确认配送地址/方式时

**GTM Trigger**: `WP - GA4 - add_shipping_info` (ID: 11)

```typescript
window.dataLayer.push({
  event: 'add_shipping_info',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    items: [
      {
        item_id: 'SKU001',
        item_name: 'Product Name',
        item_brand: 'Joydeem',
        item_category: 'Kitchen Appliances',
        price: '99.99',
        currency: 'USD',
        quantity: 2,
      },
    ],
  },
});
```

---

## 10. add_payment_info — 添加支付信息

**触发时机**：用户选择/填写支付方式时

**GTM Trigger**: `WP - GA4 - add_payment_info` (ID: 20)

```typescript
window.dataLayer.push({
  event: 'add_payment_info',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    items: [
      {
        item_id: 'SKU001',
        item_name: 'Product Name',
        item_brand: 'Joydeem',
        item_category: 'Kitchen Appliances',
        price: '99.99',
        currency: 'USD',
        quantity: 2,
      },
    ],
  },
});
```

---

## 11. purchase — 完成购买

**触发时机**：订单支付成功、收到支付回调时

**GTM Trigger**: `WP - GA4 - purchase` (ID: 16)

```typescript
window.dataLayer.push({
  event: 'purchase',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    purchase: {
      transaction_id: 'ORD-20260513-001', // 订单号（必填）
      value: '215.97', // 订单总金额（含税费运费）
      currency: 'USD',
      tax: '10.00',
      shipping: '15.00',
      coupon: 'SUMMER10', // 使用的优惠券码
      affiliation: 'Joydeem Online Store',
      total_order_count: 5, // 用户历史总订单数
      total_lifetime_value: '1250.00', // 用户历史消费总额
      items: [
        {
          item_id: 'SKU001',
          item_name: 'Product Name',
          item_brand: 'Joydeem',
          item_category: 'Kitchen Appliances',
          price: '99.99',
          currency: 'USD',
          quantity: 2,
        },
        {
          item_id: 'SKU002',
          item_name: 'Another Product',
          item_brand: 'Joydeem',
          item_category: 'Kitchen Appliances',
          price: '15.99',
          currency: 'USD',
          quantity: 1,
        },
      ],
    },
  },
});
```

---

## 12. add_to_wishlist — 加入愿望清单

**触发时机**：用户点击 "Add to Wishlist" 时

**GTM Trigger**: `WP - GA4 - add_to_wishlist` (ID: 19)

```typescript
window.dataLayer.push({
  event: 'add_to_wishlist',
  customerId: '12345',
  customerGroup: 'general',
  ecommerce: {
    items: [
      {
        item_id: 'SKU001',
        item_name: 'Product Name',
        item_brand: 'Joydeem',
        item_category: 'Kitchen Appliances',
        price: '99.99',
        currency: 'USD',
        quantity: 1,
      },
    ],
  },
});
```

---

## Item 字段规范（GA4 标准）

| 字段             | 类型          | 说明                       |
| ---------------- | ------------- | -------------------------- |
| `item_id`        | string        | SKU / 商品唯一标识（必填） |
| `item_name`      | string        | 商品名称（必填）           |
| `item_brand`     | string        | 品牌                       |
| `item_category`  | string        | 一级分类                   |
| `item_category2` | string        | 二级分类                   |
| `item_category3` | string        | 三级分类                   |
| `item_variant`   | string        | 变体（如颜色、尺寸）       |
| `price`          | string/number | 单价                       |
| `currency`       | string        | 货币代码 (ISO 4217)        |
| `quantity`       | number        | 数量                       |
| `item_list_name` | string        | 列表名称                   |
| `item_list_id`   | string        | 列表 ID                    |
| `index`          | number        | 在列表中的位置             |
| `creative_name`  | string        | 创意名称（促销用）         |
| `creative_slot`  | string        | 广告位（促销用）           |
| `promotion_id`   | string        | 促销活动 ID                |
| `promotion_name` | string        | 促销活动名称               |

---

## 实施建议

1. **统一封装**：建议创建一个 `gtm.ts` 工具文件，封装所有 `dataLayer.push` 调用
2. **货币统一**：所有 price/value 字段的货币通过 `currency` 字段声明，保持与订单一致
3. **Price 格式**：建议用字符串 `"99.99"` 避免浮点精度问题
4. **User Properties**：`customerId` 和 `customerGroup` 在登录状态下每次 push 都带上
5. **Purchase 事件**：确保在支付成功回调中触发，不要在点击 "Place Order" 时触发
