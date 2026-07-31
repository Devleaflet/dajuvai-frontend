import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getVendorAgeGateState,
  shouldPromptAgeGateOnMount,
} from "./ageRestrictionVisit";

let storedDecision: "accepted" | "declined" = "declined";
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    sessionStorage: {
      getItem: () => storedDecision,
    },
  },
});

assert.equal(
  shouldPromptAgeGateOnMount(true),
  true,
  "restricted product prompts on every mount after a declined decision",
);

storedDecision = "accepted";
assert.equal(
  shouldPromptAgeGateOnMount(true),
  true,
  "restricted product prompts on every mount after an accepted decision",
);

assert.equal(
  shouldPromptAgeGateOnMount(false),
  false,
  "unrestricted product does not prompt",
);

assert.deepEqual(
  getVendorAgeGateState([
    { ageRestriction: { isRestricted: false, minimumAge: null } },
    { ageRestriction: { isRestricted: true, minimumAge: null } },
  ]),
  { restricted: true, minimumAge: 18 },
  "restricted vendor defaults missing minimum age to 18",
);

assert.deepEqual(
  getVendorAgeGateState([
    { ageRestriction: { isRestricted: true, minimumAge: 18 } },
    { ageRestriction: { isRestricted: true, minimumAge: 21 } },
  ]),
  { restricted: true, minimumAge: 21 },
  "vendor uses highest required age",
);

assert.deepEqual(
  getVendorAgeGateState([{ ageRestriction: { isRestricted: false, minimumAge: null } }]),
  { restricted: false, minimumAge: 18 },
  "unrestricted vendor does not prompt",
);

const vendorStoreSource = fs.readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../Pages/VendorStore.tsx"),
  "utf8",
);
assert.match(vendorStoreSource, /setShowAgeModal\(restricted\)/);
assert.match(vendorStoreSource, /setHideRestricted\(false\)/);
assert.doesNotMatch(vendorStoreSource, /const decision = getAgeDecision\(age\)/);
