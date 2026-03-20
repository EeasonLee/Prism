/**
 * 商品详情页 Mock 数据
 * 商品：JoyDeem Smart Air Fryer Pro 5.5L（SKU: JD-AF550）
 *
 * 访问路径：/products/JD-AF550
 * 用于演示商品详情页的完整区块布局，不依赖真实 API。
 */

import type { UnifiedProduct } from '../../../lib/api/unified-product';

// ─── 扩展区块类型定义 ─────────────────────────────────────────────────────────

export interface KeyPoint {
  icon: string; // lucide icon name
  title: string;
  description: string;
}

export interface Guarantee {
  icon: string;
  title: string;
  description: string;
}

export interface DetailSection {
  image: string;
  imageAlt: string;
  title: string;
  body: string;
  reversed: boolean;
}

export interface Review {
  id: number;
  author: string;
  avatarInitials: string;
  rating: number; // 1-5
  date: string;
  title: string;
  content: string;
  verified: boolean;
  helpful: number;
}

export interface RecommendedProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  special_price?: number;
  image: string;
  badge?: string;
}

export interface Recipe {
  id: number;
  title: string;
  image: string;
  time: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export interface BlogPost {
  id: number;
  title: string;
  image: string;
  date: string;
  excerpt: string;
  href: string;
  readTime: string;
}

export interface CrossSellAddon {
  id: number;
  sku: string;
  name: string;
  description: string;
  image: string;
  original_price: number;
  addon_price: number; // 与主商品同购时的折扣价
}

export interface BundleDeal {
  id: number;
  title: string;
  description: string;
  partner_products: Array<{
    sku: string;
    name: string;
    image: string;
    price: number;
  }>;
  bundle_price: number; // 主商品 + 所有伴购的合计
  original_total: number;
  savings: number;
}

export interface ProductPageExtras {
  promotion_countdown_to: string; // ISO 8601
  key_points: KeyPoint[];
  guarantees: Guarantee[];
  detail_sections: DetailSection[];
  reviews: Review[];
  review_summary: {
    average: number;
    total: number;
    distribution: Record<5 | 4 | 3 | 2 | 1, number>;
  };
  recommended_products: RecommendedProduct[];
  recipes: Recipe[];
  blog_posts: BlogPost[];
  cross_sell_addons: CrossSellAddon[];
  bundle_deals: BundleDeal[];
}

/** PDP 中非 UnifiedProduct 的 CMS / 营销区块；与下方组件 props 对齐，未来由 Strapi 等填充 */
export type ProductPageCms = ProductPageExtras;

// ─── Mock SKU 常量 ────────────────────────────────────────────────────────────

export const MOCK_PRODUCT_SKU = 'JD-AF550';

// ─── UnifiedProduct Mock ──────────────────────────────────────────────────────

export const mockProduct: UnifiedProduct = {
  // Magento 核心字段
  id: 99550,
  sku: 'JD-AF550',
  name: 'JoyDeem Smart Air Fryer Pro',
  type_id: 'configurable',
  status: 1,
  visibility: 4,
  price: 199.99,
  special_price: 149.99,
  is_in_stock: true,
  stock_qty: 238,
  stock_status: 1,
  rating_percentage: 92,
  review_count: 1847,
  category_ids: [10, 21],
  categories: [
    { id: 10, name: 'Kitchen Appliances' },
    { id: 21, name: 'Air Fryers' },
  ],
  thumbnail_url:
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
  image_url:
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=1200&q=80',
  // 可配置选项：容量 + 颜色
  configurable_options: [
    {
      id: 1,
      attribute_id: '93',
      label: 'Capacity',
      attribute_code: 'capacity',
      position: 0,
      values: [
        { value_index: 11, label: '3.5L — Compact' },
        { value_index: 12, label: '5.5L — Family' },
        { value_index: 13, label: '7.0L — XL' },
      ],
    },
    {
      id: 2,
      attribute_id: '94',
      label: 'Color',
      attribute_code: 'color',
      position: 1,
      values: [
        { value_index: 21, label: 'Midnight Black' },
        { value_index: 22, label: 'Pearl White' },
        { value_index: 23, label: 'Flame Red' },
      ],
    },
  ],

  // 子 SKU 价格（不同容量对应不同价格）
  children: [
    {
      id: 99551,
      sku: 'JD-AF550-35-BK',
      name: 'JoyDeem Smart Air Fryer Pro 3.5L Midnight Black',
      price: 129.99,
      special_price: 99.99,
      is_in_stock: true,
      attributes: { '93': '11', '94': '21' },
    },
    {
      id: 99552,
      sku: 'JD-AF550-35-WH',
      name: 'JoyDeem Smart Air Fryer Pro 3.5L Pearl White',
      price: 129.99,
      special_price: 99.99,
      is_in_stock: true,
      attributes: { '93': '11', '94': '22' },
    },
    {
      id: 99553,
      sku: 'JD-AF550-35-RD',
      name: 'JoyDeem Smart Air Fryer Pro 3.5L Flame Red',
      price: 129.99,
      special_price: 99.99,
      is_in_stock: false,
      attributes: { '93': '11', '94': '23' },
    },
    {
      id: 99554,
      sku: 'JD-AF550-55-BK',
      name: 'JoyDeem Smart Air Fryer Pro 5.5L Midnight Black',
      price: 199.99,
      special_price: 149.99,
      is_in_stock: true,
      attributes: { '93': '12', '94': '21' },
    },
    {
      id: 99555,
      sku: 'JD-AF550-55-WH',
      name: 'JoyDeem Smart Air Fryer Pro 5.5L Pearl White',
      price: 199.99,
      special_price: 149.99,
      is_in_stock: true,
      attributes: { '93': '12', '94': '22' },
    },
    {
      id: 99556,
      sku: 'JD-AF550-55-RD',
      name: 'JoyDeem Smart Air Fryer Pro 5.5L Flame Red',
      price: 199.99,
      special_price: 149.99,
      is_in_stock: true,
      attributes: { '93': '12', '94': '23' },
    },
    {
      id: 99557,
      sku: 'JD-AF550-70-BK',
      name: 'JoyDeem Smart Air Fryer Pro 7.0L Midnight Black',
      price: 249.99,
      special_price: 199.99,
      is_in_stock: true,
      attributes: { '93': '13', '94': '21' },
    },
    {
      id: 99558,
      sku: 'JD-AF550-70-WH',
      name: 'JoyDeem Smart Air Fryer Pro 7.0L Pearl White',
      price: 249.99,
      special_price: 199.99,
      is_in_stock: true,
      attributes: { '93': '13', '94': '22' },
    },
    {
      id: 99559,
      sku: 'JD-AF550-70-RD',
      name: 'JoyDeem Smart Air Fryer Pro 7.0L Flame Red',
      price: 249.99,
      special_price: 199.99,
      is_in_stock: true,
      attributes: { '93': '13', '94': '23' },
    },
  ],

  media_gallery: [
    {
      url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=1200&q=80',
      label: 'JoyDeem Smart Air Fryer Pro - Main',
      media_type: 'image',
    },
    {
      url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=1200&q=80',
      label: 'JoyDeem Smart Air Fryer Pro - Side View',
      media_type: 'image',
    },
    {
      url: 'https://images.unsplash.com/photo-1625759141134-bcd09a4daf93?w=1200&q=80',
      label: 'JoyDeem Smart Air Fryer Pro - Food Result',
      media_type: 'image',
    },
    {
      url: 'https://images.unsplash.com/photo-1644361566696-3d442b5b482a?w=1200&q=80',
      label: 'JoyDeem Smart Air Fryer Pro - Control Panel',
      media_type: 'image',
    },
    {
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      label: 'JoyDeem Smart Air Fryer Pro - Lifestyle',
      media_type: 'image',
    },
  ],

  // UnifiedProduct 融合字段
  _enriched: true,
  display_name: 'JoyDeem Smart Air Fryer Pro 5.5L',
  subtitle: 'Crispy. Healthy. Effortless.',
  short_description_html:
    '<p>Cook up to <strong>75% less oil</strong> with 12 preset cooking programs, a smart touch display, and 5.5L family-size capacity. Healthy meals in minutes.</p>',
  description_html:
    '<p>The JoyDeem Smart Air Fryer Pro redefines healthy cooking at home. Equipped with Rapid Air Technology™, it circulates super-heated air at high speed to deliver crispy, golden results with up to 75% less fat than traditional frying.</p><ul><li>5.5L capacity – perfect for families of 4–6</li><li>12 pre-programmed cooking modes: fry, roast, bake, grill, dehydrate & more</li><li>360° airflow for even cooking without flipping</li><li>Non-stick, dishwasher-safe basket & tray</li><li>Temperature range: 80°C – 200°C (176°F – 392°F)</li></ul>',
  /** Mock 仍用 cms.detail_sections + RichDetailSections，此处留空 */
  product_detail_html: null,
  unified_images: [
    {
      url: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=1200&q=80',
      alt: 'JoyDeem Smart Air Fryer Pro - Main View',
      width: 1200,
      height: 1200,
    },
    {
      url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=1200&q=80',
      alt: 'JoyDeem Smart Air Fryer Pro - Side View',
      width: 1200,
      height: 1200,
    },
    {
      url: 'https://images.unsplash.com/photo-1625759141134-bcd09a4daf93?w=1200&q=80',
      alt: 'Air Fryer Cooking Results - Golden Crispy Food',
      width: 1200,
      height: 1200,
    },
    {
      url: 'https://images.unsplash.com/photo-1644361566696-3d442b5b482a?w=1200&q=80',
      alt: 'JoyDeem Smart Air Fryer Pro - Smart Control Panel',
      width: 1200,
      height: 1200,
    },
    {
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
      alt: 'JoyDeem Smart Air Fryer Pro - Kitchen Lifestyle',
      width: 1200,
      height: 1200,
    },
  ],
  unified_thumbnail:
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
  promotion_label: 'Limited Time Deal',
  promotion_expires_at: '2026-04-01T00:00:00Z',
  is_featured: true,
  seo_title: 'JoyDeem Smart Air Fryer Pro 5.5L – Healthy Cooking Made Easy',
  seo_description:
    'Cook crispy, golden meals with 75% less oil. 12 preset programs, 5.5L family capacity, easy-clean basket. Free shipping & 2-year warranty.',
};

// ─── 扩展页面区块数据 ─────────────────────────────────────────────────────────

export const mockProductExtras: ProductPageExtras = {
  // 促销倒计时截止
  promotion_countdown_to: '2026-04-01T00:00:00Z',

  // 商品买点
  key_points: [
    {
      icon: 'Flame',
      title: 'Rapid Air Technology™',
      description:
        'Superheated air circulates 360° for perfectly crispy results in half the time.',
    },
    {
      icon: 'LeafyGreen',
      title: '75% Less Oil',
      description:
        'Enjoy your favourite fried foods guilt-free with dramatically reduced fat content.',
    },
    {
      icon: 'Zap',
      title: '12 Smart Presets',
      description:
        'One-touch programs for frying, roasting, baking, grilling, and dehydrating.',
    },
    {
      icon: 'Droplets',
      title: 'Easy Clean',
      description:
        'Dishwasher-safe non-stick basket and tray — wipe the exterior, done.',
    },
  ],

  // 产品保障
  guarantees: [
    {
      icon: 'Truck',
      title: 'Free Shipping',
      description: 'Free delivery on all US orders over $49',
    },
    {
      icon: 'ShieldCheck',
      title: '2-Year Warranty',
      description: 'Full coverage on parts and labor',
    },
    {
      icon: 'RefreshCw',
      title: '30-Day Returns',
      description: 'Hassle-free returns, no questions asked',
    },
    {
      icon: 'Headphones',
      title: '24/7 Support',
      description: 'Expert kitchen help whenever you need it',
    },
  ],

  // 图文详情
  detail_sections: [
    {
      image:
        'https://images.unsplash.com/photo-1625759141134-bcd09a4daf93?w=900&q=80',
      imageAlt: 'Crispy golden fries cooked with the JoyDeem Air Fryer',
      title: 'The Crispiest Results. Every Time.',
      body: "Our Rapid Air Technology™ circulates super-heated air at up to 200°C around every surface of your food. The result? A perfect golden crust on the outside, tender and juicy on the inside — whether you're making fries, chicken wings, salmon, or even donuts. No more soggy middles or burnt edges.",
      reversed: false,
    },
    {
      image:
        'https://images.unsplash.com/photo-1644361566696-3d442b5b482a?w=900&q=80',
      imageAlt: 'JoyDeem Air Fryer smart touch control panel with LED display',
      title: 'Intelligent Touch Control, Simplified.',
      body: 'The 3.5" LED display puts 12 cooking presets at your fingertips. Set time and temperature with a single tap — the fryer does the rest. Real-time cooking progress, a built-in preheat reminder, and auto-shutoff mean you can walk away without worry.',
      reversed: true,
    },
    {
      image:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=900&q=80',
      imageAlt: 'JoyDeem Air Fryer in a modern kitchen setting with a family',
      title: 'Designed for Real Family Life.',
      body: 'The generous 5.5L basket comfortably fits a whole chicken or enough fries for four. The removable, dishwasher-safe parts mean cleanup takes seconds. At just 35 dB during operation, the JoyDeem Pro is quiet enough to use while the kids are studying or sleeping.',
      reversed: false,
    },
  ],

  // 评价数据
  review_summary: {
    average: 4.6,
    total: 1847,
    distribution: {
      5: 1201,
      4: 420,
      3: 148,
      2: 52,
      1: 26,
    },
  },

  reviews: [
    {
      id: 1,
      author: 'Sarah M.',
      avatarInitials: 'SM',
      rating: 5,
      date: 'Mar 8, 2026',
      title: 'Game changer for weeknight dinners',
      content:
        'I make dinner for my family of four every night and this has completely changed the game. Chicken thighs in 20 minutes, perfectly crispy skin. The basket is huge — fits everything. Cleanup is genuinely 2 minutes. Worth every penny.',
      verified: true,
      helpful: 312,
    },
    {
      id: 2,
      author: 'James T.',
      avatarInitials: 'JT',
      rating: 5,
      date: 'Feb 22, 2026',
      title: 'Best kitchen purchase in years',
      content:
        'Got this after seeing it recommended everywhere and the hype is real. The presets are accurate, the display is easy to read, and the temperature is consistent. Made homemade chips, frozen pizza, and roasted veg this week — all came out great.',
      verified: true,
      helpful: 189,
    },
    {
      id: 3,
      author: 'Linda K.',
      avatarInitials: 'LK',
      rating: 4,
      date: 'Feb 10, 2026',
      title: 'Great results, slight learning curve',
      content:
        "The food quality is excellent — really crispy without all the oil. Took me a couple of tries to dial in the timing for different foods. Once you get the hang of it, it's amazing. The recipe booklet included is helpful. Knocking one star only because the manual could be clearer.",
      verified: true,
      helpful: 97,
    },
    {
      id: 4,
      author: 'Marcus W.',
      avatarInitials: 'MW',
      rating: 5,
      date: 'Jan 30, 2026',
      title: 'Dehydrate function is incredible',
      content:
        'I mostly bought this for the dehydrate function to make beef jerky and fruit chips. It works perfectly — even drying at low temp for hours. The basket is easy to clean and the machine runs quietly. Really impressed with the build quality for the price.',
      verified: false,
      helpful: 74,
    },
    {
      id: 5,
      author: 'Priya N.',
      avatarInitials: 'PN',
      rating: 5,
      date: 'Jan 15, 2026',
      title: 'Perfect for healthy cooking',
      content:
        "As someone who is health-conscious, this fryer has been a revelation. I've stopped deep-frying completely. The results with just a light spray of oil are genuinely better than I expected. It also doubles as a mini-oven for reheating leftovers — keeps the texture instead of making everything soggy like a microwave.",
      verified: true,
      helpful: 203,
    },
    {
      id: 6,
      author: 'David R.',
      avatarInitials: 'DR',
      rating: 3,
      date: 'Dec 28, 2025',
      title: 'Good but runs a little hot',
      content:
        "The food comes out great and the size is perfect. My only complaint is that it runs about 10°C hotter than the display shows — I figured this out after a couple of overcooked batches. Once you account for that, it's consistent. Customer support was helpful when I reached out.",
      verified: true,
      helpful: 41,
    },
  ],

  // 推荐商品
  recommended_products: [
    {
      id: 1,
      sku: 'JD-IC320',
      name: 'JoyDeem Instant Pot Duo 6QT',
      price: 89.99,
      special_price: 69.99,
      image:
        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80',
      badge: 'Best Seller',
    },
    {
      id: 2,
      sku: 'JD-BL780',
      name: 'JoyDeem Pro Blender 1500W',
      price: 149.99,
      image:
        'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&q=80',
    },
    {
      id: 3,
      sku: 'JD-SM200',
      name: 'JoyDeem Stand Mixer 6.5QT',
      price: 299.99,
      special_price: 249.99,
      image:
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      badge: 'New',
    },
    {
      id: 4,
      sku: 'JD-GR110',
      name: 'JoyDeem Contact Grill & Panini',
      price: 59.99,
      image:
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    },
    {
      id: 5,
      sku: 'JD-TM450',
      name: 'JoyDeem Smart Toaster Oven XL',
      price: 119.99,
      special_price: 99.99,
      image:
        'https://images.unsplash.com/photo-1591985666643-9d8a3d5434a0?w=400&q=80',
    },
    {
      id: 6,
      sku: 'JD-CF100',
      name: 'JoyDeem Cold Brew Coffee Maker',
      price: 44.99,
      image:
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    },
  ],

  // 食谱
  recipes: [
    {
      id: 1,
      title: 'Perfectly Crispy Air Fryer Fries',
      image:
        'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80',
      time: '25 min',
      servings: 4,
      difficulty: 'Easy',
      tags: ['Vegetarian', 'Gluten-Free', 'Kid-Friendly'],
    },
    {
      id: 2,
      title: 'Golden Chicken Wings with Buffalo Sauce',
      image:
        'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80',
      time: '35 min',
      servings: 4,
      difficulty: 'Easy',
      tags: ['Game Day', 'Protein', 'Low-Carb'],
    },
    {
      id: 3,
      title: 'Air Fryer Salmon with Lemon & Dill',
      image:
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80',
      time: '15 min',
      servings: 2,
      difficulty: 'Easy',
      tags: ['Healthy', 'Omega-3', 'Quick'],
    },
    {
      id: 4,
      title: 'Homemade Beef Jerky (Dehydrated)',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
      time: '4 hr',
      servings: 6,
      difficulty: 'Medium',
      tags: ['High-Protein', 'Snack', 'Meal Prep'],
    },
    {
      id: 5,
      title: 'Fluffy Air Fryer Donuts',
      image:
        'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
      time: '20 min',
      servings: 8,
      difficulty: 'Medium',
      tags: ['Dessert', 'Kid-Friendly', 'Weekend'],
    },
    {
      id: 6,
      title: 'Crispy Tofu & Veggie Bowl',
      image:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80',
      time: '30 min',
      servings: 2,
      difficulty: 'Easy',
      tags: ['Vegan', 'Healthy', 'Plant-Based'],
    },
  ],

  // 超值加购（同购配件折扣）
  cross_sell_addons: [
    {
      id: 1,
      sku: 'JD-AFL-S4',
      name: 'Silicone Liner Set (4-Pack)',
      description: 'Reusable, food-grade silicone liners. Fits 3.5–7L baskets.',
      image:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=80',
      original_price: 24.99,
      addon_price: 14.99,
    },
    {
      id: 2,
      sku: 'JD-AFK-PRO',
      name: 'Air Fryer Accessory Kit',
      description:
        'Rack, skewers, cake barrel & tongs. Compatible with all JoyDeem models.',
      image:
        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&q=80',
      original_price: 39.99,
      addon_price: 24.99,
    },
    {
      id: 3,
      sku: 'JD-RB150',
      name: 'JoyDeem Recipe Book (150+ Recipes)',
      description:
        'Bestselling cookbook with 150+ air fryer recipes from our chefs.',
      image:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80',
      original_price: 19.99,
      addon_price: 9.99,
    },
    {
      id: 4,
      sku: 'JD-PARCH-200',
      name: 'Parchment Liners (200 sheets)',
      description: 'Pre-cut disposable parchment paper. No mess, no sticking.',
      image:
        'https://images.unsplash.com/photo-1625759141134-bcd09a4daf93?w=300&q=80',
      original_price: 18.99,
      addon_price: 11.99,
    },
  ],

  // 加购优惠（套装捆绑购买）
  bundle_deals: [
    {
      id: 1,
      title: 'Kitchen Starter Bundle',
      description:
        'Pair the Air Fryer with our 6QT Instant Pot for the ultimate fast-meal kitchen. Save $49.99 when you buy together.',
      partner_products: [
        {
          sku: 'JD-IC320',
          name: 'JoyDeem Instant Pot Duo 6QT',
          image:
            'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80',
          price: 89.99,
        },
      ],
      original_total: 239.98,
      bundle_price: 189.99,
      savings: 49.99,
    },
    {
      id: 2,
      title: 'Healthy Cooking Set',
      description:
        'Air fry + blend your way to healthier meals. The Pro Blender 1500W + Air Fryer combo at an unbeatable price.',
      partner_products: [
        {
          sku: 'JD-BL780',
          name: 'JoyDeem Pro Blender 1500W',
          image:
            'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&q=80',
          price: 149.99,
        },
      ],
      original_total: 299.98,
      bundle_price: 239.99,
      savings: 59.99,
    },
  ],

  // Blog 文章
  blog_posts: [
    {
      id: 1,
      title: '7 Reasons Your Air Fryer Is Your Best Kitchen Investment',
      image:
        'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80',
      date: 'Mar 5, 2026',
      excerpt:
        'From cutting cooking times to slashing calories, discover why millions of home cooks have made air frying their go-to method.',
      href: '/blog/air-fryer-best-investment',
      readTime: '5 min read',
    },
    {
      id: 2,
      title: 'Air Fryer vs. Oven: The Ultimate Showdown',
      image:
        'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
      date: 'Feb 18, 2026',
      excerpt:
        'We put both appliances head-to-head across 10 cooking tasks. The results might surprise you — and save you time.',
      href: '/blog/air-fryer-vs-oven',
      readTime: '8 min read',
    },
    {
      id: 3,
      title: 'How to Clean Your Air Fryer in Under 5 Minutes',
      image:
        'https://images.unsplash.com/photo-1625759141134-bcd09a4daf93?w=600&q=80',
      date: 'Jan 28, 2026',
      excerpt:
        'Proper cleaning extends the life of your air fryer and keeps food tasting its best. Follow this quick routine after every use.',
      href: '/blog/clean-air-fryer-guide',
      readTime: '3 min read',
    },
  ],
};
