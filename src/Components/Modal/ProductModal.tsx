// src/Components/ProductModal/ProductModal.tsx
import React, { useState } from "react";
import { Product } from "../Types/Product";

interface ProductModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (productData: Product) => void;
  product?: Product;
  isEditMode?: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ show, onClose, onSave, product, isEditMode }) => {
  const [productName, setProductName] = useState<string>(product?.name || "");
  const [description, setDescription] = useState<string>(product?.description || "");
  const [basePrice, setBasePrice] = useState<number | null>(typeof product?.price === 'number' ? product.price : product?.price ? parseFloat(product.price as string) : null);
  const [stock, setStock] = useState<number | null>(typeof product?.piece === 'number' ? product.piece : product?.piece ? parseFloat(product.piece as string) : null);
  const [discount, setDiscount] = useState<number | null>(null);
  const [discountType, setDiscountType] = useState<string>("percentage");

  const [status, setStatus] = useState<string>(product?.status || "active");

  // Handle file upload for product image
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSubmit = () => {
    const newProduct: Product = {
      id: product ? product.id : Date.now(),
      name: productName,
      description,
      price: basePrice || 0,
      piece: stock || 0,

      status,
      rating: product?.rating ?? 0,
      ratingCount: product?.ratingCount ?? 0,
      image: product?.image ?? '',
      // Add other required fields here
    };
    onSave(newProduct);
    onClose();
  };

  return (
    <div className={`product-modal ${show ? "open" : ""}`}>
      <div className="product-modal__content">
        <h2>{isEditMode ? "Edit Product" : "Add New Product"}</h2>
        <form>
          {/* General Information */}
          <div className="product-modal__section">
            <h3>General Information</h3>
            <label htmlFor="productName">Product Name</label>
            <input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Product Image */}
          <div className="product-modal__section product-modal__image">
            <h3>Product Image</h3>
            <div className="product-modal__image-preview">
              {selectedImage ? (
                <img src={URL.createObjectURL(selectedImage)} alt="Preview" />
              ) : (
                <p>Set the product image. Only .png, .jpg, and .jpeg files are accepted.</p>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
              id="imageInput"
            />
            <label htmlFor="imageInput" className="product-modal__image-upload">
              <span className="product-modal__image-upload-icon"></span>
              <span className="product-modal__image-upload-text">Upload Image</span>
            </label>
          </div>

          {/* Pricing and Stock */}
          <div className="product-modal__section">
            <h3>Pricing and Stock</h3>
            <div className="product-modal__row">
              <div>
                <label htmlFor="basePrice">Base Price</label>
                <input
                  type="number"
                  id="basePrice"
                  value={basePrice ?? ""}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="stock">Stock</label>
                <input
                  type="number"
                  id="stock"
                  value={stock ?? ""}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="product-modal__row">
              <div>
                <label htmlFor="discount">Discount</label>
                <input
                  type="number"
                  id="discount"
                  value={discount ?? ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="discountType">Discount Type</label>
                <select
                  id="discountType"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Amount</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="product-modal__section">
            <h3>Inventory</h3>

            <div className="product-modal__row">
              <div>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Variations */}
          <div className="product-modal__section">
            <h3>Variations</h3>
            <div className="product-modal__variations">
              <input type="text" placeholder="Add Variation" />
              <button>Add Variation</button>
            </div>
          </div>

          {/* Actions */}
          <div className="product-modal__actions">
            <button onClick={onClose}>Cancel</button>
            <button onClick={handleSubmit}>{isEditMode ? "Save Changes" : "Add Product"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;