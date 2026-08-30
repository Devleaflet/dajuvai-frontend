/**
 * Cloudinary URL transformation helper (spec OPT-5).
 * Appends on-the-fly delivery transformations (size, crop, format, quality)
 * to any Cloudinary URL so the CDN serves a right-sized image instead of
 * the full-resolution original.
 */
interface ImageSize {
	width: number;
	height?: number;
	crop?: "fill" | "fit" | "limit" | "scale" | "pad";
	gravity?: "auto" | "face" | "center";
	quality?: string;
	format?: "auto";
}

const PRESETS: Record<string, ImageSize> = {
	thumbnail: { width: 200, height: 200, crop: "fill", quality: "auto" },
	card: { width: 400, height: 400, crop: "fill", quality: "auto" },
	detail: { width: 800, crop: "limit", quality: "auto" },
	banner: { width: 1920, crop: "limit", quality: "auto:best" },
	bannerMobile: { width: 1200, crop: "limit", quality: "auto:best" },
	bannerCard: { width: 1000, crop: "limit", quality: "auto:best" },
	avatar: {
		width: 160,
		height: 160,
		crop: "fill",
		gravity: "face",
		quality: "auto",
	},
	avatarSm: {
		width: 80,
		height: 80,
		crop: "fill",
		gravity: "face",
		quality: "auto",
	},
	original: { width: 0 },
};

export function cloudinaryUrl(
	url: string | null | undefined,
	preset: keyof typeof PRESETS = "card"
): string {
	if (!url || !url.includes("cloudinary.com")) return url ?? "";
	const size = PRESETS[preset];
	if (!size || size.width === 0) return url;
	const parts = url.split("/upload/");
	if (parts.length !== 2) return url;
	// Idempotent: if a transformation segment is already present, don't stack
	// a second one on top (e.g. when upstream helpers already transformed).
	const firstSegment = parts[1].split("/")[0] ?? "";
	if (/^([whcqfgbe]|ar|dpr|t)_[^/]/i.test(firstSegment)) return url;
	const transforms: string[] = [];
	if (size.width) transforms.push(`w_${size.width}`);
	if (size.height) transforms.push(`h_${size.height}`);
	if (size.crop) transforms.push(`c_${size.crop}`);
	if (size.gravity) transforms.push(`g_${size.gravity}`);
	transforms.push(`f_${size.format || "auto"}`);
	transforms.push(`q_${size.quality || "auto"}`);
	return `${parts[0]}/upload/${transforms.join(",")}/${parts[1]}`;
}
