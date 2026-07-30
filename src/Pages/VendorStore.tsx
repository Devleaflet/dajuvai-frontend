import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import ProductCard from "../Components/ProductCard";
import "../Styles/VendorStore.css";
import defaultProductImage from "../assets/logo.webp";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Footer";
import { Product as DisplayProduct } from "../Components/Types/Product";
import { FiMail, FiMapPin, FiSearch } from "react-icons/fi";
import AgeRestrictionModal from "../Components/AgeRestrictionModal";
import { getAgeDecision, saveAgeDecision } from "../utils/ageRestrictionSession";

interface ApiProduct {
	id: number;
	name: string;
	description: string | null;
	basePrice: string | null;
	stock: number | null;
	discount: string;
	discountType: string;
	size?: string[];
	productImages: string[];
	status: string;
	vendorId: number;
	hasVariants?: boolean;
	variants?: Array<{
		id: number;
		sku: string;
		basePrice: string;
		finalPrice?: number | string;
		discount: string;
		discountType: string;
		attributes?: Record<string, any>;
		variantImages?: string[];
		stock: number | null;
	}>;
	ageRestriction?: { isRestricted: boolean; minimumAge: number | null; };
	subcategory: {
		id: number;
		name: string;
	};
	vendor: {
		id: number;
		businessName: string;
		email: string;
		profilePicture?: string | null;

		districtId: number;
		district: {
			id: number;
			name: string;
		};
	};
}

interface VendorInfo {
	businessName: string;
	email?: string;
	profilePicture?: string | null;

	districtName?: string;
}

interface VendorStoreResponse {
	success: boolean;
	data: {
		products: ApiProduct[];
		product?: ApiProduct[];
		total: number;
	};
}

const VendorStore: React.FC = () => {
	const { vendorId } = useParams<{ vendorId: string }>();
	const [vendorProducts, setVendorProducts] = useState<DisplayProduct[]>([]);
	const [totalProducts, setTotalProducts] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [page, setPage] = useState<number>(1);
	const [limit] = useState<number>(10);
	const [vendorInfo, setVendorInfo] = useState<VendorInfo | null>(null);
	const [vendorAvatarError, setVendorAvatarError] = useState(false);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [sortBy, setSortBy] = useState<
		"relevance" | "price_asc" | "price_desc" | "name_asc" | "name_desc"
	>("relevance");
	const [showAgeModal, setShowAgeModal] = useState(false);
	const [hideRestricted, setHideRestricted] = useState(false);
	const [minimumAge, setMinimumAge] = useState(18);

	useEffect(() => {
		const fetchVendorProducts = async () => {
			try {
				setLoading(true);
				const response = await axiosInstance.get<VendorStoreResponse>(
					`/api/vendors/${vendorId}/products?page=${page}&limit=${limit}`
				);
				if (response.data.success) {
					const products =
						response.data.data.products ?? response.data.data.product ?? [];
					// Set vendor info from first product if available
					if (products && products.length > 0 && products[0].vendor) {
						const v = products[0].vendor;
						setVendorInfo({
							businessName: v.businessName,
							email: v.email,
							profilePicture: v.profilePicture,

							districtName: v?.district?.name,
						});
					} else {
						setVendorInfo(null);
					}

					const transformedProducts: DisplayProduct[] = products.map(
						(product) => {
							//("vendorproduct", product);
							// Use backend-computed finalPrice as the source of truth.
							const discountPercent = (product as any).discountPercent;
							const discountAmount = (product as any).discountAmount;
							const priceNum = Number((product as any).finalPrice ?? product.basePrice ?? 0);
							const basePrice = Number(product.basePrice ?? 0);
							const originalPrice: string | undefined = priceNum < basePrice && basePrice > 0 ? basePrice.toFixed(2) : undefined;

							// Map variants (if any) and normalize images
							const variants = (product.variants || []).map((v) => ({
								id: v.id,
								sku: v.sku,
								basePrice: v.basePrice,
								finalPrice: Number(v.finalPrice ?? v.basePrice ?? 0),
								discountAmount: (v as any).discountAmount,
								discountPercent: (v as any).discountPercent,
								discountType: v.discountType as any,
								images: v.variantImages || [],
								stock: v.stock ?? undefined,
								status:
									Number(v.stock ?? 0) <= 0
										? ("OUT_OF_STOCK" as const)
										: ("AVAILABLE" as const),
								attributes: v.attributes || {},
							}));

							return {
								id: product.id,
								title: product.name,
								name: product.name,
								description: product.description || "",
								basePrice: product.basePrice ?? priceNum,
								finalPrice: priceNum,
								price: priceNum,
								originalPrice,
								discountAmount: discountAmount,
								discountPercent: discountPercent,
								discount: Number(product.discount ?? 0),
								hasVariants: product.hasVariants,
								deal: null,
								// Map rating info from backend if present
								rating:
									Number(
										(product as any).avgRating ?? (product as any).rating ?? 0
									) || 0,
								ratingCount: String(
									(Array.isArray((product as any).reviews)
										? (product as any).reviews.length
										: undefined) ??
									(product as any).count ??
									(product as any).ratingCount ??
									0
								),
								category: {
									id: product.subcategory.id,
									name: product.subcategory.name,
								},
								subcategory: {
									id: product.subcategory.id,
									name: product.subcategory.name,
								},
								image:
									(product.productImages && product.productImages[0]) ||
									defaultProductImage,
								vendor: product.vendor.businessName,
								vendorId: product.vendorId,
								productImages: product.productImages || [],
								variants,
								discountType: (product.discountType || "").toUpperCase() as any,
								colors: [],
								memoryOptions: product.size || [],
								stock: product.stock ?? 0,
								piece: product.stock ?? 0,
								status:
									product.status === "OUT_OF_STOCK" ||
										Number(product.stock ?? 0) <= 0
										? "OUT_OF_STOCK"
										: product.status === "LOW_STOCK"
											? "LOW_STOCK"
										: "AVAILABLE",
								ageRestriction: product.ageRestriction,
							};
						}
					);
					setVendorProducts(transformedProducts);
					const restrictedAges = transformedProducts.filter(p => p.ageRestriction?.isRestricted).map(p => p.ageRestriction?.minimumAge ?? 18);
					if (restrictedAges.length) {
						const age = Math.max(...restrictedAges);
						setMinimumAge(age);
						const decision = getAgeDecision(age);
						setHideRestricted(decision === "declined");
						setShowAgeModal(decision === null);
					}
					setTotalProducts(response.data.data.total);
				}
			} catch (error) {
				console.error("Error fetching vendor products:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchVendorProducts();
	}, [vendorId, page, limit]);

	const handlePageChange = (newPage: number) => {
		if (newPage > 0 && newPage <= Math.ceil(totalProducts / limit)) {
			setPage(newPage);
		}
	};

	const filteredProducts = (hideRestricted ? vendorProducts.filter(p => !p.ageRestriction?.isRestricted) : vendorProducts).filter((p) => {
		const q = searchTerm.trim().toLowerCase();
		if (!q) return true;
		const title = (p.title || p.name || "").toLowerCase();
		const desc = (p.description || "").toLowerCase();
		return title.includes(q) || desc.includes(q);
	});

	// Helper to compute effective price consistent with the shared ProductCard.
	const toNumber = (v: any): number => {
		if (v === undefined || v === null) return 0;
		const n = typeof v === "string" ? parseFloat(v) : Number(v);
		return isFinite(n) ? n : 0;
	};
	const calcPrice = (base: any, disc?: any, discType?: string): number => {
		const baseNum = toNumber(base);
		if (!disc || !discType) return baseNum;
		const d = typeof disc === "string" ? parseFloat(disc) : Number(disc);
		if (!isFinite(d)) return baseNum;
		const t = String(discType).toUpperCase();
		if (t === "PERCENTAGE") return baseNum * (1 - d / 100);
		if (t === "FLAT") return baseNum - d;
		return baseNum;
	};
	// Compute the minimum effective price across all variants, falling back to product/base price
	const getMinVariantPrice = (p: DisplayProduct): number => {
		const variants = (p as any).variants || [];
		if (!variants || variants.length === 0) return Number.POSITIVE_INFINITY;
		const prodBase = (p as any).basePrice ?? (p as any).price;
		const prodDisc = (p as any).discount;
		const prodDiscType = (p as any).discountType;
		let minPrice = Number.POSITIVE_INFINITY;
		for (const v of variants as any[]) {
			const base = v.basePrice ?? v.originalPrice ?? prodBase;
			let eff = toNumber(base);
			if (v.discountAmount || v.discountPercent) {
				const disc = v.discountType === 'PERCENTAGE' ? v.discountPercent : v.discountAmount;
				eff = calcPrice(base, disc, v.discountType);
			} else if (v.discount && v.discountType)
				eff = calcPrice(base, v.discount, v.discountType);
			else if (prodDisc && prodDiscType)
				eff = calcPrice(base, prodDisc, prodDiscType);
			if (eff < minPrice) minPrice = eff;
		}
		return isFinite(minPrice) ? minPrice : Number.POSITIVE_INFINITY;
	};

	const getEffectivePrice = (p: DisplayProduct): number => {
		const productPriceNum = toNumber((p as any).price);
		const minVar = getMinVariantPrice(p);
		if (isFinite(minVar)) {
			// If product has its own price, sort by the lower of product vs min variant for intuitiveness
			return productPriceNum > 0 ? Math.min(productPriceNum, minVar) : minVar;
		}
		return productPriceNum;
	};

	const query = searchTerm.trim().toLowerCase();
	const relevanceScore = (p: DisplayProduct): number => {
		if (!query) return 0;
		const title = (p.title || p.name || "").toLowerCase();
		const desc = (p.description || "").toLowerCase();
		let score = 0;
		if (title.startsWith(query)) score += 5;
		if (title.includes(query)) score += 3;
		if (desc.includes(query)) score += 1;
		return score;
	};

	const sortedProducts = [...filteredProducts].sort((a, b) => {
		switch (sortBy) {
			case "price_asc":
				return getEffectivePrice(a) - getEffectivePrice(b);
			case "price_desc":
				return getEffectivePrice(b) - getEffectivePrice(a);
			case "name_asc":
				return (a.title || a.name || "").localeCompare(b.title || b.name || "");
			case "name_desc":
				return (b.title || b.name || "").localeCompare(a.title || a.name || "");
			case "relevance":
			default:
				// When searching, sort by a simple relevance score (desc). If no query, keep original order.
				if (!query) return 0;
				return relevanceScore(b) - relevanceScore(a);
		}
	});

	// VendorStore Skeleton Loader
	const VendorStoreSkeleton: React.FC = () => (
		<>
			<div className="vendor-store__header">
				<div
					className="vendor-store__logo shimmer"
					style={{ width: "4rem", height: "4rem", borderRadius: "50%" }}
				></div>
				<div className="vendor-store__info">
					<div
						className="shimmer"
						style={{
							width: "10rem",
							height: "1.2rem",
							borderRadius: "0.4rem",
							marginBottom: "0.5rem",
						}}
					></div>
					<div
						className="shimmer"
						style={{ width: "16rem", height: "0.9rem", borderRadius: "0.4rem" }}
					></div>
				</div>
			</div>
			<aside className="vendor-store__details">
				<div
					className="shimmer"
					style={{
						width: "7rem",
						height: "1rem",
						borderRadius: "0.3rem",
						marginBottom: "0.7rem",
					}}
				></div>
				<div
					className="shimmer"
					style={{
						width: "12rem",
						height: "0.9rem",
						borderRadius: "0.3rem",
						marginBottom: "0.5rem",
					}}
				></div>
				<div
					className="shimmer"
					style={{
						width: "10rem",
						height: "0.9rem",
						borderRadius: "0.3rem",
						marginBottom: "0.5rem",
					}}
				></div>
				<div
					className="shimmer"
					style={{ width: "8rem", height: "0.9rem", borderRadius: "0.3rem" }}
				></div>
			</aside>
			<main className="vendor-store__products">
				<div className="products-header">
					<div
						className="shimmer"
						style={{
							width: "8rem",
							height: "1.1rem",
							borderRadius: "0.3rem",
							marginBottom: "1rem",
						}}
					></div>
				</div>
				<div className="vendor-store__product-grid">
					{[...Array(8)].map((_, i) => (
						<div
							key={i}
							className="shimmer"
							style={{
								height: "220px",
								borderRadius: "0.7rem",
								marginBottom: "1rem",
							}}
						></div>
					))}
				</div>
			</main>
		</>
	);

	if (loading) {
		return <VendorStoreSkeleton />;
	}



	return (
		<>
			{showAgeModal && <AgeRestrictionModal minimumAge={minimumAge} onConfirm={() => { saveAgeDecision(minimumAge, "accepted"); setHideRestricted(false); setShowAgeModal(false); }} onDecline={() => { saveAgeDecision(minimumAge, "declined"); setHideRestricted(true); setShowAgeModal(false); }} />}
			<Navbar />
			<div className="vendor-store">
				<header className="vendor-store__header">
					<div className="vendor-store__logo">
						{vendorInfo?.profilePicture && !vendorAvatarError ? (
							<img
								src={vendorInfo.profilePicture}
								alt={vendorInfo.businessName || "Vendor"}
								className="vendor-store__logo-image"
								onError={() => setVendorAvatarError(true)}
							/>
						) : (
							<span className="vendor-store__logo-letter">
								{vendorInfo?.businessName?.[0]?.toUpperCase() || "U"}
							</span>
						)}
					</div>
					<div className="vendor-store__info">
						<h1>{vendorInfo?.businessName || "Unknown Vendor"}</h1>
						<p className="vendor-store__description">
							A trusted vendor offering a wide range of products, ensuring
							quality and affordability.
						</p>
					</div>
					<div className="vendor-hero__chips">
						{vendorInfo?.email && (
							<div
								className="vendor-hero__chip"
								title={vendorInfo.email}
							>
								<FiMail className="chip-icon" />
								<span className="chip-text">{vendorInfo.email}</span>
							</div>
						)}

						{vendorInfo?.districtName && (
							<div
								className="vendor-hero__chip"
								title={vendorInfo.districtName}
							>
								<FiMapPin className="chip-icon" />
								<span className="chip-text">{vendorInfo.districtName}</span>
							</div>
						)}
					</div>
				</header>

				<div className="vendor-store__content">
					<aside className="vendor-store__details">
						<h2 className="vendor-details__title">Vendor Details</h2>
						<div className="vendor-details__item">
							<div className="vendor-detail-row">
								<FiMail className="vendor-detail-icon" />
								<div>
									<strong>Email:</strong>{" "}
									<span>{vendorInfo?.email || "N/A"}</span>
								</div>
							</div>
						</div>

						<div className="vendor-details__item">
							<div className="vendor-detail-row">
								<FiMapPin className="vendor-detail-icon" />
								<div>
									<strong>District:</strong>{" "}
									<span>{vendorInfo?.districtName || "N/A"}</span>
								</div>
							</div>
						</div>
					</aside>

					<main className="vendor-store__products">
						<div className="products-header">
							<h2 className="products-title">
								Products ({sortedProducts.length})
							</h2>
						</div>

						<div className="products-controls">
							<div
								className="products-toolbar"
								role="search"
							>
								<form
									className="vendor-search"
									onSubmit={(e) => {
										e.preventDefault();
									}}
									aria-label="Search vendor products"
								>
									<div className="vendor-search__input-wrapper">
										<FiSearch className="vendor-search__icon" />
										<input
											type="text"
											className="vendor-search__input "
											placeholder="Search products..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											style={{
												outline: "none",
											}}
										/>
									</div>
								</form>
							</div>
							<div
								className="vendor-sort"
								aria-label="Sort products"
							>
								<select
									className="vendor-sort__select"
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as any)}
								>
									<option value="relevance">Sort: Relevance</option>
									<option value="price_asc">Price: Low to High</option>
									<option value="price_desc">Price: High to Low</option>
									<option value="name_asc">Name: A to Z</option>
									<option value="name_desc">Name: Z to A</option>
								</select>
							</div>
						</div>

						{sortedProducts.length > 0 ? (
							<div className="vendor-store__product-grid">
								{sortedProducts.map((product) => {

									return (
										<ProductCard
											key={product.id}
											product={product}
										/>
									);
								})}
							</div>
						) : (
							<div className="no-products">
								<p>{hideRestricted && vendorProducts.length > 0 ? "Age-restricted products are hidden until you confirm the age requirement." : "No products match your search."}</p>
							</div>
						)}

						{totalProducts > limit && (
							<div className="vendor-store__pagination">
								<button
									onClick={() => handlePageChange(page - 1)}
									disabled={page === 1}
									className="pagination-button"
								>
									Previous
								</button>
								<span className="pagination-info">
									Page {page} of {Math.ceil(totalProducts / limit)}
								</span>
								<button
									onClick={() => handlePageChange(page + 1)}
									disabled={page === Math.ceil(totalProducts / limit)}
									className="pagination-button"
								>
									Next
								</button>
							</div>
						)}
					</main>
				</div>
			</div>
			<Footer />
		</>
	);
};

export default VendorStore;
