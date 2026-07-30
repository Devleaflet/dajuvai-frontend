import assert from "node:assert/strict";
import {
  isActiveShopSourceBanner,
  parseShopSourceBanner,
} from "./shopSourceBanner";

const source = parseShopSourceBanner(
  new URLSearchParams("sourceBannerId=17&sourceBannerType=hero"),
);

assert.deepEqual(source, { id: 17, type: "hero" });
assert.equal(
  parseShopSourceBanner(new URLSearchParams("sourceBannerId=0&sourceBannerType=hero")),
  undefined,
);
assert.equal(
  parseShopSourceBanner(new URLSearchParams("sourceBannerId=17&sourceBannerType=product")),
  undefined,
);
assert.equal(
  isActiveShopSourceBanner(
    {
      id: 17,
      type: "HERO",
      status: "ACTIVE",
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-12-31T23:59:59.000Z",
    },
    source!,
    new Date("2026-07-30T00:00:00.000Z"),
  ),
  true,
);
assert.equal(
  isActiveShopSourceBanner(
    { id: 17, type: "SIDEBAR", status: "ACTIVE" },
    source!,
  ),
  false,
);
