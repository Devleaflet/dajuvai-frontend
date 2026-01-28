import React from "react";
import { Product } from "../Components/Types/Product";
import defaultProductImage from "../assets/logo.webp";
import { API_BASE_URL } from "../config";

interface ProductListProps {
	products: Product[];
	onEdit: (product: Product) => void;
	onDelete: (product: Product) => void;
	isMobile: boolean;
	showVendor: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
	products,
	onEdit,
	onDelete,
	isMobile,
	showVendor,
}) => {


	// Normalize/complete image URLs similar to Shop page
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

	// Get display image for product
	const getDisplayImage = (product: Product): string => {
		const productImages = (product.productImages || [])
			.filter(
				(img): img is string =>
					!!img && typeof img === "string" && img.trim() !== ""
			)
			.map(processImageUrl)
			.filter(Boolean);
		if (productImages.length > 0) return productImages[0];

		if (typeof product.image === "string" && product.image.trim()) {
			const img = processImageUrl(product.image);
			if (img) return img;
		}

		const variantImages: string[] = (product.variants || [])
			.flatMap((v: any) => [
				v?.image,
				...(Array.isArray(v?.images) ? v.images : []),
				...(Array.isArray(v?.variantImages) ? v.variantImages : []),
			])
			.filter(
				(img): img is string =>
					!!img && typeof img === "string" && img.trim() !== ""
			)
			.map(processImageUrl)
			.filter(Boolean);
		if (variantImages.length > 0) return variantImages[0];

		return defaultProductImage;
	};

	const getLowestVariantPrice = (product: Product): number | null => {
		if (!product.variants || product.variants.length === 0) return null;

		const prices = product.variants
			.map((v: any) => {
				const val =
					typeof v.finalPrice === "string"
						? parseFloat(v.finalPrice)
						: Number(v.finalPrice ?? v.price);
				return isNaN(val) ? null : val;
			})
			.filter((v): v is number => v !== null);

		return prices.length > 0 ? Math.min(...prices) : null;
	};

	const getVariantStock = (product: Product): number => {
		if (!product.variants || product.variants.length === 0)
			return product.stock ?? 0;

		return product.variants.reduce(
			(sum: number, v: any) => sum + (Number(v.stock) || 0),
			0
		);
	};

	return (
		<div className="dashboard__card vendor-product__table-container">
			<table className="dashboard__table">
				<thead className="dashboard__table-header">
					<tr>
						<th>Image</th>
						<th>Product Name</th>
						<th>Category</th>
						{showVendor && <th>Vendor</th>}
						<th>Price</th>
						<th>Stock</th>
						<th>Deal</th>
						<th>Variants</th>
						<th>Status</th>
						<th>Action</th>
					</tr>
				</thead>
				<tbody>
					{products.length === 0 ? (
						<tr>
							<td
								colSpan={isMobile ? (showVendor ? 8 : 7) : showVendor ? 9 : 8}
								className="empty-state"
							>
								No products found matching your criteria
							</td>
						</tr>
					) : (
						products.map((product) => {
							const displayImage = getDisplayImage(product);
							const hasDeal = product.deal !== null;
							let numericStock = product.hasVariants
								? getVariantStock(product)
								: product.stock ?? 0;

							let displayPrice: number | null = null;

							if (product.hasVariants) {
								displayPrice = getLowestVariantPrice(product);
							} else {
								const val =
									typeof product.price === "string"
										? parseFloat(product.finalPrice)
										: Number(product.finalPrice);
								displayPrice = isNaN(val) ? null : val;
							}

							const statusDisplay = (() => {
								if (product.status === "OUT_OF_STOCK") {
									return (
										<span className="product-status out-of-stock">
											Out of Stock
										</span>
									);
								}
								if (product.status === "LOW_STOCK") {
									return (
										<span className="product-status low-stock">Low Stock</span>
									);
								}
								if (product.status === "AVAILABLE") {
									return (
										<span className="product-status available">Available</span>
									);
								}
								return "-";
							})();

							return (
								<tr
									key={product.id}
									className={`dashboard__table-row ${product.status === "LOW_STOCK" ? "row-low-stock" : ""
										}`}
								>
									<td>
										<div
											className="product-cell__icon vendor-product__image"
											style={{
												backgroundImage: `url(${displayImage})`,
												backgroundSize: "cover",
												backgroundPosition: "center",
											}}
										></div>
									</td>
									<td>{product.name || "Unnamed Product"}</td>
									<td>
										{product.subcategory?.name || product.category || "Unknown"}
									</td>
									{showVendor && <td>{product.vendor || "Unknown"}</td>}
									<td>
										{displayPrice !== null ? (
											<>
												Rs. {displayPrice.toFixed(2)}
												{product.hasVariants && (
													<span className="variant-price-note"> (from)</span>
												)}
											</>
										) : (
											<span className="price-na">—</span>
										)}
									</td>
									<td>{numericStock}</td>
									<td>
										{hasDeal ? (
											<span className="deal-badge">Yes</span>
										) : (
											<span className="deal-badge deal-badge--no">No</span>
										)}
									</td>
									<td>
										{product.hasVariants ? (
											<span className="deal-badge">Yes</span>
										) : (
											<span className="deal-badge deal-badge--no">No</span>
										)}
									</td>
									<td>{statusDisplay}</td>
									<td>
										<div className="vendor-product__actions-cell">
											<button
												className="vendor-product__action-buttton vendor-product__edit"
												onClick={() => onEdit(product)}
												title="Edit Product"
											>
												<span className="vendor-product__edit-icon"></span>
											</button>
											<button
												className="vendor-product__action-buttton vendor-product__delete"
												onClick={() => onDelete(product)}
												title="Delete Product"
											>
												<span className="vendor-product__delete-icon"></span>
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
};

export default ProductList;
