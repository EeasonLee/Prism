/**
 * Tests for product share target builder using TDD approach.
 */

import { describe, it, expect } from 'vitest';
import { buildProductShareTarget } from '../../app/products/[sku]/build-product-share-target';
import type { MagentoProduct } from '../../lib/api/magento/types';
import type { ProductDetailSelection } from '../../app/products/[sku]/ProductDetailClient';

describe('buildProductShareTarget', () => {
  const baseProduct: MagentoProduct = {
    id: 1,
    sku: 'TEST-SKU-001',
    name: 'Test Product',
    price: 99.99,
    type_id: 'simple',
  };

  const baseSelection: ProductDetailSelection = {
    selectedVariant: null,
    allSelected: false,
  };

  it('should return a ShareTarget with type "product"', () => {
    const result = buildProductShareTarget(
      baseProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      baseSelection
    );

    expect(result.type).toBe('product');
  });

  it('should use product name as title', () => {
    const result = buildProductShareTarget(
      baseProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      baseSelection
    );

    expect(result.title).toBe('Test Product');
  });

  it('should use canonical PDP URL by default', () => {
    const result = buildProductShareTarget(
      baseProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      baseSelection
    );

    expect(result.url).toBe('https://example.com/products/TEST-SKU-001');
  });

  it('should include sku in meta', () => {
    const result = buildProductShareTarget(
      baseProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      baseSelection
    );

    expect(result.meta?.sku).toBe('TEST-SKU-001');
  });

  it('should not append variant query parameter when selection is incomplete', () => {
    const selection: ProductDetailSelection = {
      selectedVariant: null,
      allSelected: false,
    };

    const result = buildProductShareTarget(
      baseProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      selection
    );

    expect(result.url).not.toContain('variant=');
  });

  it('should append variant query parameter when configurable selection is complete', () => {
    const configurableProduct: MagentoProduct = {
      ...baseProduct,
      type_id: 'configurable',
      sku: 'CONFIG-SKU',
    };

    const selection: ProductDetailSelection = {
      selectedVariant: {
        sku: 'CONFIG-SKU-RED-M',
        price: 109.99,
      },
      allSelected: true,
    };

    const result = buildProductShareTarget(
      configurableProduct,
      '/products/CONFIG-SKU',
      'https://example.com',
      selection
    );

    expect(result.url).toContain('variant=CONFIG-SKU-RED-M');
  });

  it('should not append variant query parameter for configurable product when selection is incomplete', () => {
    const configurableProduct: MagentoProduct = {
      ...baseProduct,
      type_id: 'configurable',
      sku: 'CONFIG-SKU',
    };

    const selection: ProductDetailSelection = {
      selectedVariant: null,
      allSelected: false,
    };

    const result = buildProductShareTarget(
      configurableProduct,
      '/products/CONFIG-SKU',
      'https://example.com',
      selection
    );

    expect(result.url).not.toContain('variant=');
  });

  it('should handle URL with existing query parameters', () => {
    const configurableProduct: MagentoProduct = {
      ...baseProduct,
      type_id: 'configurable',
      sku: 'CONFIG-SKU',
    };

    const selection: ProductDetailSelection = {
      selectedVariant: {
        sku: 'CONFIG-SKU-BLUE-L',
        price: 119.99,
      },
      allSelected: true,
    };

    const result = buildProductShareTarget(
      configurableProduct,
      '/products/CONFIG-SKU?ref=search',
      'https://example.com',
      selection
    );

    expect(result.url).toContain('ref=search');
    expect(result.url).toContain('variant=CONFIG-SKU-BLUE-L');
  });

  it('should use product image URL if available', () => {
    const productWithImage: MagentoProduct = {
      ...baseProduct,
      image_url: 'https://cdn.example.com/product.jpg',
    };

    const result = buildProductShareTarget(
      productWithImage,
      '/products/TEST-SKU-001',
      'https://example.com',
      baseSelection
    );

    expect(result.imageUrl).toBe('https://cdn.example.com/product.jpg');
  });

  it('should not include imageUrl if product has no image', () => {
    const result = buildProductShareTarget(
      baseProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      baseSelection
    );

    expect(result.imageUrl).toBeUndefined();
  });

  it('should handle simple products without variant logic', () => {
    const simpleProduct: MagentoProduct = {
      ...baseProduct,
      type_id: 'simple',
    };

    const selection: ProductDetailSelection = {
      selectedVariant: null,
      allSelected: false,
    };

    const result = buildProductShareTarget(
      simpleProduct,
      '/products/TEST-SKU-001',
      'https://example.com',
      selection
    );

    expect(result.url).toBe('https://example.com/products/TEST-SKU-001');
    expect(result.url).not.toContain('variant=');
  });
});
