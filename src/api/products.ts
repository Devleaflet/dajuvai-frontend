import axios from "axios";
import axiosInstance from "./axiosInstance";
import { API_BASE_URL } from "../config";
import type { Product as AdminListProduct } from "../Components/Types/EditProductTypes";

interface RawProduct {
	id: number;
	name: string;
	description: string;
	basePrice: string;
	discount: string;
	discountType: "PERCENTAGE" | "FLAT" | "NONE" | null;
	status: "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK";
	stock: number;
	subcategoryId: number;
	vendorId: number;
	dealId: number | null;
	bannerId: number | null;
	productImages: string[];
	brandId: number | null;
	hasVariants: boolean;
	created_at: string;
	updated_at: string;
	variants: Array<{
		id?: number;
		name?: string;
		price?: number | string;
		originalPrice?: number | string;
		stock?: number;
		sku?: string;
		image?: string;
		images?: string[];
		attributes?: Record<string, any>;
	}>;
	avgRating: number;
	count: number;
}

// Simple test function to debug API endpoint
export const testProductAPI = async (
	categoryId: number,
	subcategoryId: number
) => {
	//"🧪 TESTING PRODUCT API ENDPOINT");
	//"Category ID:", categoryId);
	//"Subcategory ID:", subcategoryId);

	const testData = new FormData();
	testData.append("name", "TEST_PRODUCT");
	testData.append("subcategoryId", subcategoryId.toString());
	testData.append("hasVariants", "false");
	testData.append("basePrice", "10");
	testData.append("stock", "1");
	testData.append("status", "AVAILABLE");

	const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`;
	//"🎯 Test API URL:", apiUrl);

	try {
		const response = await axiosInstance.post(apiUrl, testData, {
			headers: { "Content-Type": "multipart/form-data" },
		});
		//"✅ Test API Success:", response.data);
		return response.data;
	} catch (error: any) {
		console.error("❌ Test API Error:", error);
		console.error("Error Response:", error.response?.data);
		throw error;
	}
};

export interface Product {
	id: number;
	title: string; // Maps to `name` in API response
	description: string;
	price: string | number; // Maps to `basePrice` in API response
	basePrice?: string | number; // Maps to `basePrice` in API response
	originalPrice?: string | number;
	discount?: string | number; // API returns string (e.g., "15.00")
	discountType?: "PERCENTAGE" | "FLAT" | "NONE";
	rating: number; // Maps to `avgRating` in API response
	ratingCount: string | number; // Maps to `count` in API response
	isBestSeller?: boolean; // Not in API response, default to false
	freeDelivery?: boolean; // Not in API response, default to false
	image: string; // Maps to first item in `productImages`
	stock?: number;
	brand?: string;
	name?: string; // Optional, as API uses `name` but we map to `title`
	category?: any;
	subcategory?: { id: number; name: string; category?: any };
	subcategoryId?: number; // Maps to `subcategoryId` in API response
	vendor?: string;
	vendorId?: number; // Maps to `vendorId` in API response
	piece?: string | number;
	availableColor?: string;
	onSale?: boolean;
	isFeatured?: boolean;
	discountPercentage?: string;
	colors?: { name: string; img: string }[];
	memoryOptions?: string[];
	quantity?: number;
	productImages?: string[]; // Maps to `productImages` in API response
	categoryId?: number;
	brandId?: number | null; // Maps to `brandId` in API response
	dealId?: number | null; // Maps to `dealId` in API response
	bannerId?: number | null; // Maps to `bannerId` in API response
	status?: "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK"; // Maps to `status` in API response
	hasVariants?: boolean; // Maps to `hasVariants` in API response
	variants?: Array<{
		id?: number;
		name?: string;
		price?: number | string;
		originalPrice?: number | string;
		stock?: number;
		sku?: string;
		image?: string;
		images?: string[];
		attributes?: Record<string, any>;
		[key: string]: any;
	}>;
	inventory?: Array<{
		id?: number;
		productId?: number;
		quantity: number;
		status?: "IN_STOCK" | "OUT_OF_STOCK" | "LOW_STOCK";
		location?: string;
		updatedAt?: string;
	}>;
}

export const fetchProduct = async (url: string) => {
	const response = await axiosInstance.get(url);
	return response.data.data;
};

export const fetchReviewOf = async (id: number) => {
	const cacheKey = `productReviewsData_${id}`;
	const cachedData = localStorage.getItem(cacheKey);

	if (cachedData) {
		return JSON.parse(cachedData);
	}

	const response = await axiosInstance.get(`/api/reviews/${id}`);
	const { averageRating, reviews } = response.data.data;

	//"product = :", { reviews, averageRating });

	const data = { averageRating, reviews, ratingCount: reviews.length };
	localStorage.setItem(cacheKey, JSON.stringify(data));

	return data;
};

export const uploadProductImages = async (
	files: File[]
): Promise<{ success: boolean; urls: string[]; message?: string }> => {
	try {
		//"=== UPLOAD PRODUCT IMAGES START ===");
		//"Files to upload:", files.length);

		if (!files || files.length === 0) {
			throw new Error("No files provided for upload");
		}

		const formData = new FormData();
		files.forEach((file, index) => {
			//`Adding file ${index + 1}:`, file.name, file.type, file.size);
			formData.append("files", file);
		});

		//"=== MAKING UPLOAD REQUEST ===");
		const response = await axiosInstance.post(
			"/api/product/image/upload",
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);

		//"=== UPLOAD SUCCESS ===");
		//"Response:", response.data);

		// API returns { success: true, urls: [...] }
		if (response.data.success && response.data.urls) {
			return {
				success: true,
				urls: response.data.urls,
				message: "Images uploaded successfully",
			};
		} else {
			throw new Error("Invalid response format from upload endpoint");
		}
	} catch (error: any) {
		console.error("=== UPLOAD ERROR ===");
		console.error("Error details:", error);
		console.error("Response data:", error.response?.data);
		console.error("Response status:", error.response?.status);

		return {
			success: false,
			urls: [],
			message:
				error.response?.data?.message ||
				error.message ||
				"Failed to upload images",
		};
	}
};

const deriveInventoryStatus = (
	stock: number
): "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK" => {
	if (stock <= 0) return "OUT_OF_STOCK";
	if (stock < 5) return "LOW_STOCK";
	return "AVAILABLE";
};

const normalizeDiscountType = (
	value?: "PERCENTAGE" | "FLAT" | "NONE" | string | null
): "PERCENTAGE" | "FLAT" | "NONE" => {
	return value === "PERCENTAGE" || value === "FLAT" || value === "NONE"
		? value
		: "NONE";
};

const normalizeVariantAttributes = (attributes: any): Record<string, string> => {
	if (!attributes) return {};
	if (!Array.isArray(attributes) && typeof attributes === "object") {
		return Object.entries(attributes).reduce((acc, [key, value]) => {
			if (key.trim() && value !== undefined && value !== null) {
				acc[key.trim().toLowerCase()] = String(value).trim();
			}
			return acc;
		}, {} as Record<string, string>);
	}
	if (!Array.isArray(attributes)) return {};

	return attributes.reduce((acc, attribute) => {
		const key = String(
			attribute?.type || attribute?.attributeType || attribute?.name || ""
		)
			.trim()
			.toLowerCase();
		const rawValue = Array.isArray(attribute?.values)
			? attribute.values[0]?.value
			: Array.isArray(attribute?.attributeValues)
				? attribute.attributeValues[0]
				: attribute?.value;

		if (key && rawValue !== undefined && rawValue !== null) {
			acc[key] = String(rawValue).trim();
		}
		return acc;
	}, {} as Record<string, string>);
};

const normalizeImageUrls = (images: any): string[] => {
	if (!Array.isArray(images)) return [];
	return images
		.map((image) =>
			typeof image === "string" ? image : image?.url || image?.imageUrl || ""
		)
		.filter(
			(url): url is string =>
				typeof url === "string" && url.trim().length > 0
		)
		.map((url) => url.trim());
};

const normalizeVariantPayload = (variant: any, index: number) => {
	const basePrice = Number(variant?.basePrice ?? variant?.price);
	const stock = Number(variant?.stock);

	if (!variant?.sku?.trim()) {
		throw new Error(`Variant ${index + 1} SKU is required`);
	}
	if (!Number.isFinite(basePrice) || basePrice <= 0) {
		throw new Error(`Variant ${index + 1} price must be greater than zero`);
	}
	if (!Number.isInteger(stock) || stock < 0) {
		throw new Error(
			`Variant ${index + 1} stock must be a non-negative whole number`
		);
	}

	return {
		...(variant.id ? { id: Number(variant.id) } : {}),
		sku: String(variant.sku).trim(),
		basePrice,
		stock,
		status: deriveInventoryStatus(stock),
		discountAmount: variant.discountAmount !== undefined 
			? Number(variant.discountAmount) 
			: (normalizeDiscountType(variant.discountType) === "FLAT" ? Number(variant.discount || 0) : undefined),
		discountPercent: variant.discountPercent !== undefined 
			? Number(variant.discountPercent) 
			: (normalizeDiscountType(variant.discountType) === "PERCENTAGE" ? Number(variant.discount || 0) : undefined),
		discountType: normalizeDiscountType(variant.discountType),
		attributes: normalizeVariantAttributes(variant.attributes),
		variantImages: normalizeImageUrls(variant.variantImages || variant.images),
	};
};

export const createProduct = async (
	categoryId: number,
	subcategoryId: number,
	productData: {
		name: string;
		brand?: string;
		description?: string;
		keywords?: string;
		basePrice?: number;
		discount?: number;
		discountAmount?: number;
		discountPercent?: number;
		discountType?: "PERCENTAGE" | "FLAT" | "NONE";
		status?: "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK";
		stock?: number;
		hasVariants: boolean;
		variants?: any[];
		dealId?: number;
		bannerId?: number;
		productImages?: string[]; // URLs from Cloudinary
	}
) => {
	//"🔥 CREATE PRODUCT - NEW JSON API CONTRACT");
	//"Category ID:", categoryId, "Type:", typeof categoryId);
	//"Subcategory ID:", subcategoryId, "Type:", typeof subcategoryId);
	//"Product Data:", JSON.stringify(productData, null, 2));

	try {
		// Validate required fields
		if (!productData.name) {
			throw new Error("Product name is required");
		}

		// Check if categoryId and subcategoryId are valid numbers
		if (!categoryId || categoryId <= 0) {
			console.error("❌ Invalid categoryId:", categoryId);
			throw new Error("Valid category ID is required");
		}

		if (!subcategoryId || subcategoryId <= 0) {
			console.error("❌ Invalid subcategoryId:", subcategoryId);
			throw new Error("Valid subcategory ID is required");
		}

		if (!productData.hasVariants) {
			// Non-variant product validation
			if (!productData.basePrice || productData.basePrice <= 0) {
				throw new Error("Base price is required for non-variant products");
			}
			if (productData.stock === undefined || productData.stock < 0) {
				throw new Error("Stock is required for non-variant products");
			}
		} else {
			// Variant product validation
			if (!productData.variants || productData.variants.length === 0) {
				throw new Error("Variants are required for variant products");
			}
		}

		// Prepare JSON payload according to new API contract
		const payload: any = {
			name: productData.name,
			subcategoryId: subcategoryId,
			hasVariants: productData.hasVariants,
		};

		// Add optional fields
		if (productData.brand !== undefined && productData.brand !== null) payload.brand = productData.brand;
		if (productData.description) payload.description = productData.description;
		if (productData.keywords !== undefined && productData.keywords !== null) payload.keywords = productData.keywords;
		if (productData.discountAmount !== undefined) payload.discountAmount = productData.discountAmount;
		if (productData.discountPercent !== undefined) payload.discountPercent = productData.discountPercent;

		if (productData.discount !== undefined && payload.discountAmount === undefined && payload.discountPercent === undefined) {
			if (productData.discountType === "PERCENTAGE") {
				payload.discountPercent = Number(productData.discount || 0);
			} else if (productData.discountType === "FLAT") {
				payload.discountAmount = Number(productData.discount || 0);
			}
		}
		if (productData.discountType) {
			payload.discountType = normalizeDiscountType(productData.discountType);
		}
		if (productData.dealId) payload.dealId = productData.dealId;
		if (productData.bannerId) payload.bannerId = productData.bannerId;
		if (productData.productImages && productData.productImages.length > 0) {
			payload.productImages = productData.productImages;
		}

		// Add fields based on whether product has variants
		if (productData.hasVariants) {
			if (productData.variants && productData.variants.length > 0) {
				payload.variants = productData.variants.map(normalizeVariantPayload);
			}
		} else {
			// For non-variant products, these fields are required
			payload.basePrice = productData.basePrice;
			payload.stock = productData.stock;
			payload.status = deriveInventoryStatus(Number(productData.stock));
		}

		const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products`;
		//"🎯 API URL:", apiUrl);
		//"📤 Making JSON POST request...");

		// Make the JSON POST API call according to new contract
		const response = await axiosInstance.post(apiUrl, payload, {
			headers: {
				"Content-Type": "application/json",
			},
			timeout: 30000, // 30 second timeout
		});

		//"=== PRODUCT CREATION SUCCESS ===");
		//"Response Status:", response.status);
		//"Response Headers:", response.headers);
		//"Response Data:", JSON.stringify(response.data, null, 2));

		return response.data;
	} catch (error) {
		console.error("=== PRODUCT CREATION ERROR ===");
		console.error("Error Type:", typeof error);
		console.error("Error Name:", error.name);
		console.error("Error Message:", error.message);
		console.error("Full Error Object:", error);

		if (error.response) {
			console.error("=== ERROR RESPONSE DETAILS ===");
			console.error("Status:", error.response.status);
			console.error("Status Text:", error.response.statusText);
			console.error("Headers:", error.response.headers);
			console.error("Data:", error.response.data);
			console.error("Config:", error.response.config);

			if (error.response.status === 401) {
				throw new Error("Unauthorized: Please login again");
			} else if (error.response.status === 400) {
				const errorMsg =
					error.response?.data?.message ||
					"Bad request - please check your input data";
				console.error("400 Error Message:", errorMsg);
				throw new Error(errorMsg);
			} else if (error.response.status === 404) {
				const errorMsg =
					error.response?.data?.message || "Category or subcategory not found";
				console.error("404 Error Message:", errorMsg);
				throw new Error(errorMsg);
			} else if (error.response.status === 500) {
				const errorMsg =
					error.response?.data?.message || "Internal Server Error";
				console.error("500 Error Message:", errorMsg);
				throw new Error(errorMsg);
			} else if (error.response?.data?.message) {
				console.error("API Error Message:", error.response.data.message);
				throw new Error(error.response.data.message);
			}
		} else if (error.request) {
			console.error("=== REQUEST ERROR (No Response) ===");
			console.error("Request:", error.request);
			throw new Error("Network error: No response from server");
		} else {
			console.error("=== SETUP ERROR ===");
			console.error("Error setting up request:", error.message);
		}

		throw error;
	}
};

// Update product function to match new API contract
export const updateProduct = async (
	productId: number,
	categoryId: number,
	subcategoryId: number,
	productData: {
		name: string;
		brand?: string;
		description?: string;
		keywords?: string;
		basePrice?: number;
		discount?: number;
		discountAmount?: number;
		discountPercent?: number;
		discountType?: "PERCENTAGE" | "FLAT" | "NONE";
		status?: "AVAILABLE" | "OUT_OF_STOCK" | "LOW_STOCK";
		stock?: number;
		hasVariants: boolean;
		variants?: any[];
		dealId?: number | null;      
		bannerId?: number | null;    
		productImages?: string[];
	}
) => {
	try {
		const payload: any = {
			name: productData.name,
			subcategoryId,
			hasVariants: productData.hasVariants,
		};

		// Optional fields
		if (productData.brand !== undefined && productData.brand !== null)
			payload.brand = productData.brand;

		if (productData.description !== undefined)
			payload.description = productData.description;

		if (productData.keywords !== undefined && productData.keywords !== null)
			payload.keywords = productData.keywords;

		if (productData.discountAmount !== undefined) {
			payload.discountAmount = productData.discountAmount;
		}
		if (productData.discountPercent !== undefined) {
			payload.discountPercent = productData.discountPercent;
		}

		if (productData.discount !== undefined && payload.discountAmount === undefined && payload.discountPercent === undefined) {
			if (productData.discountType === "PERCENTAGE") {
				payload.discountPercent = Number(productData.discount || 0);
			} else if (productData.discountType === "FLAT") {
				payload.discountAmount = Number(productData.discount || 0);
			} else if (productData.discountType === "NONE" || !productData.discountType) {
				payload.discountAmount = 0;
				payload.discountPercent = 0;
			}
		}

		if (productData.discountType !== undefined) {
			payload.discountType = normalizeDiscountType(productData.discountType);
		}

		if (productData.dealId === null) {
			payload.dealId = null;              // REMOVE deal
		} else if (productData.dealId !== undefined) {
			payload.dealId = productData.dealId; // SET deal
		}

		if (productData.bannerId === null) {
			payload.bannerId = null;
		} else if (productData.bannerId !== undefined) {
			payload.bannerId = productData.bannerId;
		}

		if (productData.productImages !== undefined)
			payload.productImages = productData.productImages;

		// Variants / non-variants
		if (productData.hasVariants) {
			if (productData.variants?.length) {
				payload.variants = productData.variants.map(normalizeVariantPayload);
			}
		} else {
			if (productData.basePrice !== undefined)
				payload.basePrice = productData.basePrice;

			if (productData.stock !== undefined)
				payload.stock = productData.stock;

			if (productData.stock !== undefined)
				payload.status = deriveInventoryStatus(Number(productData.stock));
		}

		console.log(" FINAL UPDATE PAYLOAD:", payload);

		const apiUrl = `/api/categories/${categoryId}/subcategories/${subcategoryId}/products/${productId}`;

		const response = await axiosInstance.put(apiUrl, payload, {
			headers: { "Content-Type": "application/json" },
		});

		return {
			success: true,
			data: response.data,
			message: "Product updated successfully",
		};
	} catch (error: any) {
		console.error("❌ UPDATE PRODUCT ERROR:", error);
		throw error;
	}
};


export const deleteProduct = async (productId: number, token?: string) => {
	try {
		// Prepare headers
		const headers: any = {};

		// Add authorization header if token is provided
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await axios.delete(
			`${API_BASE_URL}/api/product/${productId}`,
			{ headers }
		);

		//"Product deleted successfully:", response.data);
		return response.data;
	} catch (error: unknown) {
		if (typeof error === "object" && error !== null && "response" in error) {
			const err = error as { response?: { status?: number; data?: any } };
			console.error("Error deleting product:", err.response?.data || error);
			// Prefer the backend's own message when it sent one over a
			// generic per-status message that would otherwise swallow it.
			// Deleting a product now always succeeds (it's archived, not
			// blocked, regardless of order history), so this mainly covers
			// 403/404/validation errors.
			const backendMessage = err.response?.data?.message;
			if (backendMessage) {
				throw new Error(backendMessage);
			}
			if (err.response?.status === 403) {
				throw new Error(
					"Not authorized to delete this product. You can only delete products you own."
				);
			} else if (err.response?.status === 401) {
				throw new Error("Authentication failed. Please login again.");
			} else if (err.response?.status === 404) {
				throw new Error("Product not found.");
			}
		}
		throw error;
	}
};

export const fetchAllProducts = async (
	page = 1,
	limit = 10,
	search = "",
): Promise<{ products: AdminListProduct[]; total: number; hasMore: boolean }> => {
	const response = await axiosInstance.get<{
		success: boolean;
		data?: unknown[];
		meta?: { total?: number; hasNextPage?: boolean };
	}>("/api/categories/all/products", {
		params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
	});
	const rows = Array.isArray(response.data.data) ? response.data.data : [];
	const products = rows.map((row) => {
		const product = row as Record<string, any>;
		return {
			...product,
			id: String(product.id),
			name: String(product.name ?? product.title ?? ""),
			images: Array.isArray(product.productImages) ? product.productImages : [],
			status: product.status ?? "AVAILABLE",
		} as AdminListProduct;
	});
	return {
		products,
		total: Number(response.data.meta?.total ?? products.length),
		hasMore: Boolean(response.data.meta?.hasNextPage),
	};
};

export const restoreProduct = async (productId: number, token?: string) => {
	const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
	const response = await axios.patch(
		`${API_BASE_URL}/api/product/${productId}/restore`,
		{},
		{ headers },
	);
	return response.data;
};

export const restoreVariant = async (
	productId: number,
	variantId: number,
	token?: string,
) => {
	const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
	const response = await axios.patch(
		`${API_BASE_URL}/api/product/${productId}/variant/${variantId}/restore`,
		{},
		{ headers },
	);
	return response.data;
};

export const fetchArchivedProducts = async (
	page: number = 1,
	limit: number = 20,
	token?: string,
	options: { search?: string; type?: "product" | "variants" } = {},
) => {
	const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
	const response = await axios.get(`${API_BASE_URL}/api/product/archived`, {
		params: { page, limit, ...options },
		headers,
	});
	return response.data;
};

export type ProductSortOption =
	| "newest"
	| "oldest"
	| "a-z"
	| "z-a"
	| "price-low-high"
	| "price-high-low"
	| "stock-low-high"
	| "stock-high-low";

export type ProductStatusFilter = "" | "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK";

export const fetchProducts = async (
	vendorId: number,
	page: number = 1,
	limit: number = 10,
	options?: {
		search?: string;
		sortBy?: ProductSortOption;
		status?: ProductStatusFilter;
	}
) => {
	try {
		const params: Record<string, string | number> = { page, limit };
		if (options?.search && options.search.trim()) {
			params.search = options.search.trim();
		}
		if (options?.sortBy) {
			params.sortBy = options.sortBy;
		}
		if (options?.status) {
			params.status = options.status;
		}

		const response = await axiosInstance.get(
			`/api/vendors/${vendorId}/products`,
			{ params }
		);

		return response;
	} catch (error: unknown) {
		console.error("Error fetching products:", error);
		throw error;
	}
};

// Enhanced axios interceptor setup with better error handling
export const setupAxiosInterceptors = (
	getTokenFn: () => string | null,
	logoutFn?: () => void,
	refreshTokenFn?: () => Promise<void>
) => {
	// Request interceptor
	axiosInstance.interceptors.request.use(
		(config) => {
			const token = getTokenFn?.();
			if (token && !config.headers.Authorization) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			return config;
		},
		(error) => {
			console.error("Request interceptor error:", error);
			return Promise.reject(error);
		}
	);

	// Response interceptor for handling auth errors
	axiosInstance.interceptors.response.use(
		(response) => {
			return response;
		},
		async (error) => {
			console.error("Response interceptor error:", {
				status: error?.response?.status,
				data: error?.response?.data,
				config: {
					url: error?.config?.url,
					method: error?.config?.method,
					headers: error?.config?.headers,
				},
			});

			const originalRequest = error.config;
			if (
				error?.response?.status === 401 &&
				refreshTokenFn &&
				!originalRequest._retry
			) {
				originalRequest._retry = true;
				try {
					await refreshTokenFn();
					// After refreshing, retry the original request
					const token = getTokenFn?.();
					if (token) {
						originalRequest.headers["Authorization"] = `Bearer ${token}`;
					}
					return axiosInstance(originalRequest);
				} catch (refreshError) {
					if (logoutFn) {
						logoutFn();
					}
					return Promise.reject(refreshError);
				}
			}

			// Handle authentication errors (if refreshTokenFn not provided or failed)
			if (error?.response?.status === 401) {
				console.warn("Authentication failed, logging out...");
				if (logoutFn) {
					logoutFn();
				}
			}

			return Promise.reject(error);
		}
	);
};
export const fetchProductsBySection = async (
	sectionId: number
): Promise<Product[]> => {
	try {
		const response = await axiosInstance.get<{
			success: boolean;
			message: string;
			data: RawProduct[];
		}>(`/api/homepage/${sectionId}`, {
			headers: {
				accept: "application/json",
			},
		});

		if (!response.data.success) {
			throw new Error(response.data.message || "Failed to fetch products");
		}

		// Map the API response to the Product interface
		return response.data.data.map((rawProduct) => ({
			id: rawProduct.id,
			title: rawProduct.name, // Map name to title
			description: rawProduct.description,
			price: rawProduct.basePrice, // Map basePrice to price
			basePrice: rawProduct.basePrice,
			discount: rawProduct.discount,
			discountType: rawProduct.discountType,
			rating: rawProduct.avgRating, // Map avgRating to rating
			ratingCount: rawProduct.count, // Map count to ratingCount
			image: rawProduct.productImages[0] || "", // Use first image as primary image
			stock: rawProduct.stock,
			status: rawProduct.status,
			subcategoryId: rawProduct.subcategoryId,
			vendorId: rawProduct.vendorId,
			dealId: rawProduct.dealId,
			bannerId: rawProduct.bannerId,
			productImages: rawProduct.productImages,
			brandId: rawProduct.brandId,
			hasVariants: rawProduct.hasVariants,
			variants: rawProduct.variants,
			isBestSeller: false, // Not provided in API, default to false
			freeDelivery: false, // Not provided in API, default to false
		}));
	} catch (error: any) {
		console.error("Error fetching products by section:", error);
		throw new Error(
			error.response?.data?.message || "Failed to fetch products"
		);
	}
};
