import React from "react";
import { useHomepageSections } from "../hooks/useHomepageSections";
import ProductCarousel from "./ProductCarousel";
import ProductCardSkeleton from "../skeleton/ProductCardSkeleton";
import "../Styles/Home.css";
import type { Product as DisplayProduct } from "./Types/Product";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";

const HomepageSections: React.FC = () => {
	const { data: sections, isLoading, error } = useHomepageSections();

	if (isLoading) {
		const skeletonSections = [];
		for (let i = 0; i < 2; i++) {
			skeletonSections.push(
				<div
					key={i}
					style={{ marginBottom: 32 }}
				>
					<div
						className="homepage-section-title skeleton"
						style={{ width: 200, height: 32, marginBottom: 16 }}
					/>
					<div className="homepage-sections-loading-row">
						{[0, 1, 2, 3].map((_, j) => (
							<ProductCardSkeleton
								key={j}
								count={1}
							/>
						))}
					</div>
				</div>
			);
		}
		return <div className="homepage-sections-loading">{skeletonSections}</div>;
	}

	if (error) {
		return (
			<div style={{ color: "red", textAlign: "center", margin: 32 }}>
				Failed to load homepage sections.
			</div>
		);
	}

	if (!sections || sections.length === 0) {
		return (
			<div style={{ textAlign: "center", margin: 32 }}>
				No homepage sections available.
			</div>
		);
	}

	return (
		<div className="homepage-sections">
			{sections
				.filter((section) => section.isActive)
				.map((section) => {
					const mappedProducts: DisplayProduct[] = section.products.map(
						(product) => {
							const primaryImage = getProductPrimaryImage(product, "");
							const productImages = Array.isArray(product.productImages)
								? product.productImages
								: [];

							return {
								id: product.id,
								title: product.name,
								description: product.description,
								price: product.basePrice,
								hasVariants: product.hasVariants,
								deal: product.deal ?? null,
								basePrice: product.basePrice,
								finalPrice: product.finalPrice,
								discount: product.discount,
								discountType: (product.discountType === "PERCENTAGE" ||
									product.discountType === "FLAT"
									? product.discountType
									: undefined) as DisplayProduct["discountType"],
								rating:
									Number(
										(product as any).avgRating ?? (product as any).rating ?? 0
									) || 0,
								ratingCount: String(
									(Array.isArray((product as any).reviews)
										? (product as any).reviews.length
										: undefined) ??
									(product as any).reviewCount ??
									(product as any).ratingCount ??
									0
								),
								isBestSeller: false,
								freeDelivery: true,
								image: primaryImage,
								stock: product.stock,
								productImages,
								variants: (product as any).variants,
							} satisfies DisplayProduct;
						}
					);
					return (
						<ProductCarousel
							key={section.id}
							title={section.title}
							sectionId={section.id} 
							products={mappedProducts}
							showTitle={true}
						/>
					);
				})}
		</div>
	);
};

export default HomepageSections;
