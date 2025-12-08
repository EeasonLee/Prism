interface RecipeHeaderProps {
  totalRecipes: number;
  showingRecipes: number;
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}

export function RecipeHeader({
  totalRecipes,
  showingRecipes,
  pageSize,
  onPageSizeChange,
}: RecipeHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="mb-3 text-4xl font-bold text-gray-900">
        {totalRecipes.toLocaleString()} Recipes
      </h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Showing {showingRecipes} of {totalRecipes.toLocaleString()} recipes
        </p>
        <div className="flex items-center gap-3">
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            <option value={12}>Showing 12 Recipes</option>
            <option value={24}>Showing 24 Recipes</option>
            <option value={48}>Showing 48 Recipes</option>
          </select>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500">
            <option>Sort By Newest</option>
            <option>Sort By Oldest</option>
            <option>Sort By Name</option>
            <option>Sort By Popularity</option>
          </select>
        </div>
      </div>
    </div>
  );
}
