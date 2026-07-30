import assert from "node:assert/strict";
import {
  productSearchPath,
  shopCategorySearchPath,
  shopSearchPath,
} from "./searchNavigation";

assert.equal(productSearchPath(42), "/product-page/42");
assert.equal(shopSearchPath("Nike Black"), "/shop?search=nike+black&sort=relevance&page=1");
assert.equal(shopSearchPath("--"), "/shop");
assert.equal(shopCategorySearchPath(5), "/shop?categoryId=5&page=1");
