import assert from "node:assert/strict";
import {
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  saveRecentSearch,
} from "./recentSearches";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
  localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    },
  },
});

clearRecentSearches();
saveRecentSearch("Nike Air");
saveRecentSearch("nike air");
saveRecentSearch("A");
assert.deepEqual(getRecentSearches(), ["nike air"]);

removeRecentSearch("nike air");
assert.deepEqual(getRecentSearches(), []);
