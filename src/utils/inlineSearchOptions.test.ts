import assert from "node:assert/strict";
import { buildInlineSearchOptions } from "./inlineSearchOptions";

const options = buildInlineSearchOptions(
  {
    products: [{ id: 1, name: "Phone case" }],
    categories: [{ id: 2, name: "Phones" }],
    brands: [{ id: 3, name: "PhoneCo" }],
  },
  "phone",
);

assert.deepEqual(
  options.map((option) => option.id),
  ["product-1", "category-2", "brand-3", "view-all-results"],
);
assert.equal(options.at(-1)?.label, 'View all results for "phone"');

console.log("inline search options tests passed");
