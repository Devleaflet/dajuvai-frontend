export type InventoryState = "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";

type StockProduct = {
  id?: number;
  stock?: number | string | null;
  hasVariants?: boolean;
  variants?: Array<{ stock?: number | string | null }>;
};

const stockNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

export function getProductInventoryState(product: StockProduct): InventoryState {
  const stock = product.hasVariants
    ? (product.variants ?? []).reduce((total, variant) => total + stockNumber(variant.stock), 0)
    : stockNumber(product.stock);
  if (stock <= 0) return "OUT_OF_STOCK";
  if (stock < 5) return "LOW_STOCK";
  return "AVAILABLE";
}

export function getVendorStockAlerts(products: StockProduct[]) {
  return products.reduce(
    (summary, product) => {
      const state = getProductInventoryState(product);
      if (state === "OUT_OF_STOCK") summary.outOfStockCount += 1;
      if (state === "LOW_STOCK") summary.lowStockCount += 1;
      return summary;
    },
    { outOfStockCount: 0, lowStockCount: 0 },
  );
}

export function normalizeInventoryAlertCounts(stats: unknown) {
  const source = stats as {
    lowStockCount?: unknown;
    outOfStockCount?: unknown;
  };
  return {
    lowStockCount: Math.max(0, Number(source?.lowStockCount) || 0),
    outOfStockCount: Math.max(0, Number(source?.outOfStockCount) || 0),
  };
}
