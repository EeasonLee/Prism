'use client';

import { useState } from 'react';
import type { Facets, FilterType, SelectedFilters } from '../types';

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: FilterSectionProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left hover:opacity-80 transition-opacity"
      >
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className="text-gray-400">
          {isExpanded ? (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </span>
      </button>
      {isExpanded && (
        <>
          <div className="mb-3 border-t border-gray-200"></div>
          <div className="space-y-2">{children}</div>
        </>
      )}
    </div>
  );
}

interface CheckboxOptionProps {
  id: number;
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}

function CheckboxOption({
  label,
  count,
  checked,
  onChange,
}: CheckboxOptionProps) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
      />
      <span className="text-sm text-gray-700 flex-1">
        {label}
        {count !== undefined && (
          <span className="ml-2 text-xs text-gray-500">({count})</span>
        )}
      </span>
    </label>
  );
}

interface FiltersPanelProps {
  filterTypes: FilterType[];
  facets: Facets | null;
  selectedFilters: SelectedFilters;
  onFilterChange: (
    filterType: string,
    filterId: number,
    checked: boolean
  ) => void;
  loading: boolean;
}

// Filter type key mapping
const filterTypeKeyMap: Record<string, keyof SelectedFilters> = {
  'recipe-type': 'recipeTypes',
  'main-ingredients': 'ingredients',
  cuisine: 'cuisines',
  'dish-type': 'dishTypes',
  'special-diets': 'specialDiets',
  'holidays-events': 'holidaysEvents',
  'product-type': 'productTypes',
};

export function FiltersPanel({
  filterTypes,
  facets,
  selectedFilters,
  onFilterChange,
  loading,
}: FiltersPanelProps) {
  // Initialize expanded state: first one expanded by default
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    if (filterTypes.length > 0) {
      initial[filterTypes[0].value] = true;
    }
    return initial;
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Get filter options (prefer facets, return empty array if none)
  const getFilterOptions = (type: string) => {
    if (!facets) {
      return [];
    }

    const facetKey = type as keyof Facets;
    return facets[facetKey] || [];
  };

  // Check if option is selected
  const isFilterSelected = (type: string, id: number): boolean => {
    const key = filterTypeKeyMap[type];
    if (!key) return false;
    return selectedFilters[key].includes(id);
  };

  if (loading && filterTypes.length === 0) {
    return (
      <div className="sticky top-8">
        <h2 className="mb-8 text-3xl font-bold text-gray-800">Filters</h2>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="sticky top-8">
      <h2 className="mb-8 text-3xl font-bold text-gray-800">Filters</h2>

      {filterTypes.map(filterType => {
        const options = getFilterOptions(filterType.value);
        const isExpanded = expandedSections[filterType.value] ?? false;

        return (
          <FilterSection
            key={filterType.value}
            title={filterType.label || filterType.labelZh}
            isExpanded={isExpanded}
            onToggle={() => toggleSection(filterType.value)}
          >
            {options.length === 0 ? (
              <div className="text-sm text-gray-500">No options</div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2">
                {options.map(option => (
                  <CheckboxOption
                    key={option.id}
                    id={option.id}
                    label={option.name}
                    count={option.count}
                    checked={isFilterSelected(filterType.value, option.id)}
                    onChange={() =>
                      onFilterChange(
                        filterType.value,
                        option.id,
                        !isFilterSelected(filterType.value, option.id)
                      )
                    }
                  />
                ))}
              </div>
            )}
          </FilterSection>
        );
      })}
    </div>
  );
}
