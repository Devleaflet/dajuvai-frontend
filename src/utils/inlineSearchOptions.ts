export type InlineSearchOption = {
  id: string;
  type: "product" | "category" | "brand" | "all";
  entityId?: number;
  name: string;
  label: string;
};

type SearchScopes = Array<{ id: number; name: string }>;

type SearchProducts = Array<{ id: number; name: string }>;

export const buildInlineSearchOptions = (
  results: {
    products: SearchProducts;
    categories: SearchScopes;
    brands: SearchScopes;
  },
  query: string,
): InlineSearchOption[] => [
  ...results.products.map((product) => ({
    id: `product-${product.id}`,
    type: "product" as const,
    entityId: product.id,
    name: product.name,
    label: product.name,
  })),
  ...results.categories.map((category) => ({
    id: `category-${category.id}`,
    type: "category" as const,
    entityId: category.id,
    name: category.name,
    label: category.name,
  })),
  ...results.brands.map((brand) => ({
    id: `brand-${brand.id}`,
    type: "brand" as const,
    entityId: brand.id,
    name: brand.name,
    label: brand.name,
  })),
  {
    id: "view-all-results",
    type: "all",
    name: query,
    label: `View all results for "${query}"`,
  },
];
