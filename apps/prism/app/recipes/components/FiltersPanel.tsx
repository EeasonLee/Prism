'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { debounce } from '@/lib/utils/debounce';
import { useEffect, useRef, useState } from 'react';
import type { Facets, FilterType, SelectedFilters } from '../types';

interface FiltersPanelProps {
  filterTypes: FilterType[];
  facets: Facets | null;
  selectedFilters: SelectedFilters;
  pageSize: number;
  onFilterChange: (
    filters: SelectedFilters,
    page: number,
    pageSize: number
  ) => Promise<void>;
}

const filterTypeKeyMap: Record<string, keyof SelectedFilters> = {
  'recipe-type': 'recipeTypes',
  'main-ingredients': 'ingredients',
  cuisine: 'cuisines',
  'dish-type': 'dishTypes',
  'special-diets': 'specialDiets',
  'holidays-events': 'holidaysEvents',
  'product-type': 'productTypes',
};

function getFacetOptions(facets: Facets | null, type: string) {
  if (!facets) return [];
  const facetKey = type as keyof Facets;
  return facets[facetKey] || [];
}

export function FiltersPanel({
  filterTypes,
  facets,
  selectedFilters,
  pageSize,
  onFilterChange,
}: FiltersPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [localFilters, setLocalFilters] =
    useState<SelectedFilters>(selectedFilters);

  // 默认展开全部有选项的筛选类型；允许同时展开多个
  const defaultOpenValues = filterTypes
    .filter(ft => {
      const options = getFacetOptions(facets, ft.value);
      return options.length > 0;
    })
    .map(ft => ft.value);

  // 创建防抖的筛选函数
  const debouncedApplyFiltersRef = useRef(
    debounce(async (filters: SelectedFilters) => {
      setIsLoading(true);
      try {
        await onFilterChange(filters, 1, pageSize);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  );

  // 同步服务器状态到本地状态（当路由变化导致 selectedFilters 更新时）
  useEffect(() => {
    // 只在真正变化时才更新，避免不必要的渲染
    const currentFiltersStr = JSON.stringify(localFilters);
    const newFiltersStr = JSON.stringify(selectedFilters);
    if (currentFiltersStr !== newFiltersStr) {
      setLocalFilters(selectedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters]);

  const removeFilter = (type: keyof SelectedFilters, id: number) => {
    setLocalFilters(prev => {
      const currentValues = prev[type];
      if (!Array.isArray(currentValues)) return prev;
      const updated = currentValues.filter(value => value !== id);
      const nextFilters = { ...prev, [type]: updated };
      debouncedApplyFiltersRef.current(nextFilters);
      return nextFilters;
    });
  };

  const clearAll = () => {
    const emptyFilters: SelectedFilters = {
      recipeTypes: [],
      ingredients: [],
      cuisines: [],
      dishTypes: [],
      specialDiets: [],
      holidaysEvents: [],
      productTypes: [],
      categoryId: undefined,
    };
    setLocalFilters(emptyFilters);
    debouncedApplyFiltersRef.current(emptyFilters);
  };

  const chips: Array<{
    key: keyof SelectedFilters;
    id: number;
    label: string;
  }> = [];

  filterTypes.forEach(ft => {
    const mapKey = filterTypeKeyMap[ft.value];
    if (!mapKey) return;
    const selectedIds = localFilters[mapKey];
    if (!Array.isArray(selectedIds)) return;
    const options = getFacetOptions(facets, ft.value);
    selectedIds.forEach(id => {
      const option = options.find(opt => opt.id === id);
      if (option) {
        chips.push({ key: mapKey, id, label: option.name });
      }
    });
  });

  const handleCheckboxChange = (
    filterType: string,
    optionId: number,
    checked: boolean
  ) => {
    const key = filterTypeKeyMap[filterType];
    if (!key) return;

    // 更新本地状态
    setLocalFilters(prev => {
      const currentValues = prev[key] as number[];
      const newValues = checked
        ? [...currentValues, optionId]
        : currentValues.filter(id => id !== optionId);

      const updatedFilters = {
        ...prev,
        [key]: newValues,
      };

      // 立即应用筛选（带防抖）
      debouncedApplyFiltersRef.current(updatedFilters);

      return updatedFilters;
    });
  };

  const isOptionChecked = (filterType: string, id: number) => {
    const key = filterTypeKeyMap[filterType];
    if (!key) return false;
    const values = localFilters[key] as number[];
    return values.includes(id);
  };

  return (
    <div className="sticky top-8">
      <h2 className="mb-4 text-3xl font-bold text-gray-800">Filters</h2>

      {/* 当前勾选的筛选项 */}
      {chips.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {chips.map(chip => (
            <button
              key={`${chip.key}-${chip.id}`}
              type="button"
              onClick={() => removeFilter(chip.key, chip.id)}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              <span>{chip.label}</span>
              <span className="text-gray-400">×</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            清除全部
          </button>
        </div>
      )}

      <Accordion
        type="multiple"
        defaultValue={defaultOpenValues}
        className="space-y-2"
      >
        {filterTypes.map(filterType => {
          const options = getFacetOptions(facets, filterType.value);
          const fieldName = filterTypeKeyMap[filterType.value];

          // 如果没有字段名或没有选项，不渲染该项
          if (!fieldName || options.length === 0) {
            return null;
          }

          return (
            <AccordionItem
              key={filterType.value}
              value={filterType.value}
              className="rounded-md border border-gray-200 bg-white px-4"
            >
              <AccordionTrigger className="text-sm font-semibold text-gray-900 hover:no-underline">
                {filterType.label || filterType.labelZh}
              </AccordionTrigger>
              <AccordionContent>
                <div className="mt-4 space-y-2">
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
                    {options.map(option => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-2 py-1"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <Checkbox
                            checked={isOptionChecked(
                              filterType.value,
                              option.id
                            )}
                            onCheckedChange={(
                              checked: boolean | 'indeterminate'
                            ) =>
                              handleCheckboxChange(
                                filterType.value,
                                option.id,
                                checked === true
                              )
                            }
                            disabled={isLoading}
                          />
                        </div>
                        <span className="flex-1 text-sm text-gray-700 leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {option.name}
                          {option.count !== undefined && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({option.count})
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
