import assert from "node:assert/strict";
import {
  CatalogFilters,
  catalogFiltersToSearchParams,
  filterCatalogCategories,
  parseCatalogFilters,
  toggleCatalogSubcategoryFilter,
  updateCatalogFilters,
} from "./catalogFilters.js";

const baseFilters: CatalogFilters = {
  search: "",
  categoryIds: [1, 2],
  subcategoryIds: [31],
  sort: "newest",
  page: 3,
};

assert.deepEqual(
  toggleCatalogSubcategoryFilter(baseFilters, 2, 21),
  {
    categoryIds: [1],
    subcategoryIds: [31, 21],
  },
  "selecting a child removes only its parent category",
);

assert.deepEqual(
  toggleCatalogSubcategoryFilter(
    { ...baseFilters, categoryIds: [1], subcategoryIds: [31, 21] },
    2,
    21,
  ),
  { categoryIds: [1], subcategoryIds: [31] },
  "unselecting a child does not restore its parent category",
);

const parsed = parseCatalogFilters(
  new URLSearchParams(
    "?q=tea&categoryId=3,8&subcategoryId=11&minPrice=100&maxPrice=900&minRating=4&hasDeal=true&dealId=7&sort=price_low_high&page=2",
  ),
);

assert.deepEqual(
  parsed,
  {
    search: "tea",
    categoryIds: [3, 8],
    subcategoryIds: [11],
    minPrice: 100,
    maxPrice: 900,
    minRating: 4,
    hasDeal: true,
    dealId: 7,
    sort: "price_low_high",
    page: 2,
  },
  "catalog URL parsing keeps exact deal filters",
);

assert.equal(
  catalogFiltersToSearchParams(parsed).toString(),
  "q=tea&categoryId=3%2C8&subcategoryId=11&minPrice=100&maxPrice=900&minRating=4&dealId=7&sort=price_low_high&page=2",
  "exact deal filters take precedence over the broad deals-only flag",
);

assert.equal(
  updateCatalogFilters(parsed, { dealId: 11 }).page,
  1,
  "changing filters resets pagination",
);

assert.deepEqual(
  filterCatalogCategories(
    [
      {
        id: 1,
        name: "Electronics",
        subcategories: [
          { id: 11, name: "Phones" },
          { id: 12, name: "Laptops" },
        ],
      },
      {
        id: 2,
        name: "Home",
        subcategories: [{ id: 21, name: "Kitchen" }],
      },
    ],
    "phone",
  ),
  [
    {
      id: 1,
      name: "Electronics",
      subcategories: [{ id: 11, name: "Phones" }],
    },
  ],
  "category search keeps parents for matching subcategories",
);
