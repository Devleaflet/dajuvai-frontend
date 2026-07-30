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
  dealIds: [],
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
    "?q=tea&categoryId=3,8&subcategoryId=11&minPrice=100&maxPrice=900&minRating=4&hasDeal=true&dealId=7,11&bannerId=19&sort=price_low_high&page=2",
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
    dealIds: [7, 11],
    bannerId: 19,
    sort: "price_low_high",
    page: 2,
  },
  "catalog URL parsing keeps all selected deal filters",
);

assert.equal(
  catalogFiltersToSearchParams(parsed).toString(),
  "q=tea&categoryId=3%2C8&subcategoryId=11&minPrice=100&maxPrice=900&minRating=4&dealId=7%2C11&bannerId=19&sort=price_low_high&page=2",
  "selected deal filters take precedence over the broad deals-only flag",
);

assert.equal(
  updateCatalogFilters(parsed, { dealIds: [7, 13] }).page,
  1,
  "changing filters resets pagination",
);

assert.equal(
  parseCatalogFilters(new URLSearchParams("?q=phone&sort=relevance")).sort,
  "relevance",
  "predictive search URLs retain relevance ordering",
);

assert.equal(
  parseCatalogFilters(new URLSearchParams("?sort=relevance")).sort,
  "newest",
  "relevance without a query falls back to newest",
);

assert.equal(
  updateCatalogFilters({ ...baseFilters, sort: "relevance", search: "phone" }, { search: "" }).sort,
  "newest",
  "clearing a relevant search resets sorting to newest",
);

assert.equal(
  catalogFiltersToSearchParams({ ...baseFilters, sort: "relevance" }).has("sort"),
  false,
  "empty searches never serialize a misleading relevance sort",
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
