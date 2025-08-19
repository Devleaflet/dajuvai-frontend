import { API_BASE_URL } from "../config";

// Normalize/complete image URLs against API_BASE_URL, similar to components
const processImageUrl = (imgUrl: string): string => {
  if (!imgUrl) return "";
  const trimmed = imgUrl.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  const base = API_BASE_URL.replace(/\/?api\/?$/, "");
  const needsSlash = !trimmed.startsWith("/");
  const url = `${base}${needsSlash ? "/" : ""}${trimmed}`;
  return url.replace(/([^:]\/)\/+/, "$1/");
};

// Returns the primary image URL for a product using variant-first logic.
// Order: first variant (image -> images[0] -> variantImages[0]) -> product.productImages[0] -> product.image -> defaultImage
export const getProductPrimaryImage = (
  product: any,
  defaultImage: string
): string => {
  try {
    const variants: any[] = Array.isArray(product?.variants)
      ? product.variants
      : [];

    // Strictly use the FIRST variant's first available image,
    // but normalize order: prefer 'position', else 'id' ascending
    if (variants.length > 0) {
      const ordered = [...variants].sort((a: any, b: any) => {
        const ap = Number(a?.position);
        const bp = Number(b?.position);
        if (Number.isFinite(ap) && Number.isFinite(bp)) return ap - bp;
        const aid = Number(a?.id);
        const bid = Number(b?.id);
        if (Number.isFinite(aid) && Number.isFinite(bid)) return aid - bid;
        return 0;
      });
      const v = ordered[0];
      const candidate: string | undefined =
        (typeof v?.image === "string" && v.image.trim() ? v.image : undefined) ||
        (Array.isArray(v?.images) && v.images[0] ? v.images[0] : undefined) ||
        (Array.isArray(v?.variantImages) && v.variantImages[0]
          ? v.variantImages[0]
          : undefined);
      if (candidate) {
        const url = processImageUrl(candidate);
        if (url) return url;
      }
    }

    const pimg0 = product?.productImages?.[0];
    if (typeof pimg0 === "string" && pimg0.trim()) {
      const url = processImageUrl(pimg0);
      if (url) return url;
    }

    if (typeof product?.image === "string" && product.image.trim()) {
      const url = processImageUrl(product.image);
      if (url) return url;
    }
  } catch (e) {
    // fallthrough to default
  }
  return defaultImage;
};
