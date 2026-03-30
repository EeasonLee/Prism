import { describe, it, expect } from 'vitest';
import {
  normalizeSpecifications,
  type StrapiSpecificationRowRaw,
} from '../lib/api/strapi/product-enrichment';

describe('Product Specifications API - normalizeSpecifications', () => {
  it('groups raw rows by group_key and group_title', () => {
    const raw: StrapiSpecificationRowRaw[] = [
      {
        group_key: 'general',
        group_title: 'General',
        key: 'brand',
        label: 'Brand',
        value: 'Joydeem',
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'model',
        label: 'Model',
        value: 'JD-001',
        enabled: true,
      },
      {
        group_key: 'dimensions',
        group_title: 'Dimensions',
        key: 'weight',
        label: 'Weight',
        value: '2.5kg',
        enabled: true,
      },
    ];

    const result = normalizeSpecifications(raw);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result?.[0].id).toBe('general');
    expect(result?.[0].title).toBe('General');
    expect(result?.[0].rows).toHaveLength(2);
    expect(result?.[1].id).toBe('dimensions');
    expect(result?.[1].title).toBe('Dimensions');
    expect(result?.[1].rows).toHaveLength(1);
  });

  it('filters disabled rows and empty values', () => {
    const raw: StrapiSpecificationRowRaw[] = [
      {
        group_key: 'general',
        group_title: 'General',
        key: 'brand',
        label: 'Brand',
        value: 'Joydeem',
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'disabled_field',
        label: 'Disabled',
        value: 'Should not appear',
        enabled: false,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'empty_value',
        label: 'Empty',
        value: '',
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'whitespace_value',
        label: 'Whitespace',
        value: '   ',
        enabled: true,
      },
    ];

    const result = normalizeSpecifications(raw);

    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result?.[0].rows).toHaveLength(1);
    expect(result?.[0].rows[0].key).toBe('brand');
  });

  it('sorts rows by sort_order ascending', () => {
    const raw: StrapiSpecificationRowRaw[] = [
      {
        group_key: 'general',
        group_title: 'General',
        key: 'third',
        label: 'Third',
        value: 'C',
        sort_order: 30,
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'first',
        label: 'First',
        value: 'A',
        sort_order: 10,
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'second',
        label: 'Second',
        value: 'B',
        sort_order: 20,
        enabled: true,
      },
    ];

    const result = normalizeSpecifications(raw);

    expect(result).toBeDefined();
    expect(result?.[0].rows).toHaveLength(3);
    expect(result?.[0].rows[0].key).toBe('first');
    expect(result?.[0].rows[1].key).toBe('second');
    expect(result?.[0].rows[2].key).toBe('third');
  });

  it('does not return empty groups', () => {
    const raw: StrapiSpecificationRowRaw[] = [
      {
        group_key: 'general',
        group_title: 'General',
        key: 'brand',
        label: 'Brand',
        value: 'Joydeem',
        enabled: true,
      },
      {
        group_key: 'empty_group',
        group_title: 'Empty Group',
        key: 'disabled',
        label: 'Disabled',
        value: 'Value',
        enabled: false,
      },
    ];

    const result = normalizeSpecifications(raw);

    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe('general');
  });

  it('preserves source and highlighted metadata on rows', () => {
    const raw: StrapiSpecificationRowRaw[] = [
      {
        group_key: 'general',
        group_title: 'General',
        key: 'brand',
        label: 'Brand',
        value: 'Joydeem',
        source: 'template',
        is_highlighted: true,
        sort_order: 20,
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'custom_note',
        label: 'Custom Note',
        value: 'Hand-crafted',
        source: 'custom',
        sort_order: 10,
        enabled: true,
      },
      {
        group_key: 'general',
        group_title: 'General',
        key: 'no_source',
        label: 'No Source',
        value: 'Value',
        enabled: true,
      },
    ];

    const result = normalizeSpecifications(raw);
    const rows = result?.[0].rows;

    expect(rows).toBeDefined();
    expect(rows).toEqual([
      {
        key: 'no_source',
        label: 'No Source',
        value: 'Value',
        source: undefined,
        highlighted: undefined,
      },
      {
        key: 'custom_note',
        label: 'Custom Note',
        value: 'Hand-crafted',
        source: 'custom',
        highlighted: undefined,
      },
      {
        key: 'brand',
        label: 'Brand',
        value: 'Joydeem',
        source: 'template',
        highlighted: true,
      },
    ]);
  });
});
