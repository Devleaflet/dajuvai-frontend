import React from "react";
import { Product } from "../Components/Types/Product";
import defaultProductImage from "../assets/logo.webp";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  isMobile: boolean;
  showVendor: boolean;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  onEdit,
  isMobile,
  showVendor,
}) => {
  // Helper function to compute discounted price
  const calculatePrice = (basePrice: string | number, discount?: string, discountType?: string): number => {
    const base = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
    if (!discount || !discountType) return base;
    const discountValue = parseFloat(discount) || 0;
    if (discountType === "PERCENTAGE") {
      return base * (1 - discountValue / 100);
    } else if (discountType === "FIXED" || discountType === "FLAT") {
      return base - discountValue;
    }
    return base;
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
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={isMobile ? (showVendor ? 8 : 7) : (showVendor ? 9 : 8)} className="empty-state">
                No products found matching your criteria
              </td>
            </tr>
          ) : (
            products.map((product) => {
              // Handle variant products
              let numericStock = 0;
              let displayPrice = 0;
              
              if (product.variants && product.variants.length > 0) {
                // Use first variant's price and stock
                const firstVariant = product.variants[0] as any;
                numericStock = (firstVariant?.stock ?? product.stock ?? 0) as number;

                // Prefer precomputed calculatedPrice from mapping when available
                const variantBase = (firstVariant?.price ?? firstVariant?.originalPrice ?? firstVariant?.basePrice ?? product.basePrice ?? product.price) as number | string | undefined;
                const hasCalculated = typeof firstVariant?.calculatedPrice === 'number' && isFinite(firstVariant.calculatedPrice);

                if (hasCalculated) {
                  displayPrice = firstVariant.calculatedPrice as number;
                } else if (firstVariant?.discount && firstVariant?.discountType) {
                  displayPrice = calculatePrice(variantBase ?? 0, String(firstVariant.discount), String(firstVariant.discountType));
                } else if (product.discount && product.discountType) {
                  displayPrice = calculatePrice(variantBase ?? 0, String(product.discount), String(product.discountType));
                } else {
                  displayPrice = typeof variantBase === 'string' ? parseFloat(variantBase) : (Number(variantBase) || 0);
                }
              } else {
                // For non-variant products
                numericStock = product.stock ?? 0;
                displayPrice = calculatePrice(product.price, product.discount as any, product.discountType as any);
              }

              // Determine status display
              const statusDisplay = (() => {
                if (product.status === 'OUT_OF_STOCK') {
                  return <span className="product-status out-of-stock">Out of Stock</span>;
                }
                if (product.status === 'LOW_STOCK') {
                  return <span className="product-status low-stock">Low Stock</span>;
                }
                if (product.status === 'AVAILABLE') {
                  return <span className="product-status available">Available</span>;
                }
                return '-';
              })();

              return (
                <tr key={product.id} className="dashboard__table-row">
                  <td>
                    <div
                      className="product-cell__icon vendor-product__image"
                      style={{
                        backgroundImage: `url(${product.productImages?.[0] || product.image || defaultProductImage})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>
                  </td>
                  <td>{product.name || "Unnamed Product"}</td>
                  <td>{product.subcategory?.name || product.category || "Unknown"}</td>
                  {showVendor && <td>{product.vendor || "Unknown"}</td>}
                  <td>Rs. {displayPrice.toFixed(2)}</td>
                  <td>{numericStock}</td>
                  <td>{statusDisplay}</td>
                  <td>
                    <div className="vendor-product__actions-cell">
                      <button
                        className="vendor-product__action-btn vendor-product__edit"
                        onClick={() => onEdit(product)}
                      >
                        <span className="vendor-product__edit-icon"></span>
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