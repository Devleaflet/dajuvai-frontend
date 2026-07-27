import React from "react";
import { useHomepageSections } from "../hooks/useHomepageSections";
import ProductCarousel from "./ProductCarousel";
import SidebarBannerStrip from "./SidebarBannerStrip";
import "../Styles/Home.css";
import type { Product as DisplayProduct } from "./Types/Product";
import { getProductPrimaryImage } from "../utils/getProductPrimaryImage";

const HomepageSectionCardSkeleton: React.FC = () => (
  <div className="homepage-section-skeleton__card">
    <div className="homepage-section-skeleton__media homepage-section-skeleton__shimmer" />
    <div className="homepage-section-skeleton__content">
      <div className="homepage-section-skeleton__line homepage-section-skeleton__line--title homepage-section-skeleton__shimmer" />
      <div className="homepage-section-skeleton__line homepage-section-skeleton__line--text homepage-section-skeleton__shimmer" />
      <div className="homepage-section-skeleton__price-row">
        <div className="homepage-section-skeleton__price homepage-section-skeleton__shimmer" />
      </div>
    </div>
  </div>
);

const HomepageSections: React.FC = () => {
  const { data: sections, isLoading, error } = useHomepageSections();

  if (isLoading) {
    return (
      <div className="homepage-sections-loading" aria-hidden="true">
        {[0, 1].map((sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            <section className="homepage-section-skeleton">
              <div className="homepage-section-skeleton__header">
                <div className="homepage-section-skeleton__title-wrap">
                  <div className="homepage-section-skeleton__title homepage-section-skeleton__shimmer" />
                </div>
                <div className="homepage-section-skeleton__cta homepage-section-skeleton__shimmer" />
              </div>

              <div className="homepage-section-skeleton__carousel">
                <div className="homepage-section-skeleton__row">
                  {[0, 1, 2, 3, 4, 5, 6].map((cardIndex) => (
                    <HomepageSectionCardSkeleton key={cardIndex} />
                  ))}
                </div>
              </div>
            </section>
          </React.Fragment>
        ))}
      </div>
    );
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

  const activeSections = sections.filter((section) => section.isActive);

  return (
    <div className="homepage-sections">
      {activeSections.map((section, i) => {
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
              discount: Number(product.discount),
              discountAmount: product.discountAmount
                ? Number(product.discountAmount)
                : 0,
              discountPercent: product.discountPercent
                ? Number(product.discountPercent)
                : 0,
              discountType: (product.discountType === "PERCENTAGE" ||
              product.discountType === "FLAT"
                ? product.discountType
                : undefined) as DisplayProduct["discountType"],
              rating:
                Number(
                  (product as any).avgRating ?? (product as any).rating ?? 0,
                ) || 0,
              ratingCount: String(
                (Array.isArray((product as any).reviews)
                  ? (product as any).reviews.length
                  : undefined) ??
                  (product as any).reviewCount ??
                  (product as any).ratingCount ??
                  0,
              ),
              isBestSeller: false,
              freeDelivery: true,
              image: primaryImage,
              stock: product.stock,
              productImages,
              variants: (product as any).variants,
            } satisfies DisplayProduct;
          },
        );

        return (
          <React.Fragment key={section.id}>
            <ProductCarousel
              title={section.title}
              sectionId={section.id}
              products={mappedProducts}
              showTitle={true}
            />
            <SidebarBannerStrip placementAfterSection={i + 1} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default HomepageSections;
