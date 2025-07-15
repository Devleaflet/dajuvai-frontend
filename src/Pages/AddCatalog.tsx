import React, { useState, useRef } from 'react';
import { AdminSidebar } from '../Components/AdminSidebar';
import '../Styles/AddCatalog.css';

interface AddCatalogProps {
  onSave: (data: {
    pageTitle: string;
    catalogNumber: string;
    products: string[];
    images: File[];
  }) => void;
  onCancel: () => void;
}

const AddCatalog: React.FC<AddCatalogProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    pageTitle: 'Dashain Offer',
    catalogNumber: '1',
    products: [] as string[],
    newProduct: '',
    images: [] as File[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduct = () => {
    if (formData.newProduct.trim()) {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, prev.newProduct.trim()],
        newProduct: ''
      }));
    }
  };

  const handleRemoveProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddProduct();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pageTitle: formData.pageTitle,
      catalogNumber: formData.catalogNumber,
      products: formData.products,
      images: formData.images
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="add-catalog-container">
      <AdminSidebar />
      <main className="add-catalog-content">
        <header className="catalog-header">
          <h1>Ad Catalog Management</h1>
          <p className="subtitle">Create and manage promotional catalog</p>
        </header>

        <div className="divider"></div>

        <form onSubmit={handleSubmit} className="catalog-form">
          <section className="form-section">
            <h2>Basic Information</h2>
            
            <div className="form-group">
              <label htmlFor="pageTitle">
                Page Title <span className="required">*</span>
              </label>
              <input
                type="text"
                id="pageTitle"
                name="pageTitle"
                value={formData.pageTitle}
                onChange={handleInputChange}
                required
              />
              
            </div>

            <div className="form-group">
              <label htmlFor="catalogNumber">
                Catalog Number <span className="required">*</span>
              </label>
              <input
                type="number"
                id="catalogNumber"
                name="catalogNumber"
                value={formData.catalogNumber}
                onChange={handleInputChange}
                required
                min="1"
              />
            </div>
          </section>

          <div className="divider"></div>

          <section className="form-section">
            <h2>Products</h2>
            
            {formData.products.length > 0 ? (
              <div className="products-list">
                {formData.products.map((product, index) => (
                  <div key={index} className="product-item">
                    <span>{product}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-products">No products added yet</p>
            )}

            <div className="add-product">
              <input
                type="text"
                placeholder="Enter product code"
                value={formData.newProduct}
                onChange={(e) => setFormData({...formData, newProduct: e.target.value})}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="add-btn"
                onClick={handleAddProduct}
                disabled={!formData.newProduct.trim()}
              >
                Add Product
              </button>
            </div>
          </section>

          <div className="divider"></div>

          <section className="form-section">
            <h2>Images</h2>
            
            {formData.images.length > 0 ? (
              <div className="images-grid">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={URL.createObjectURL(image)} 
                      alt={`Catalog image ${index + 1}`} 
                    />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-images">No images added yet</p>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="upload-btn"
              onClick={triggerFileInput}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload Images
            </button>
            <p className="help-text">You can upload multiple images at once</p>
          </section>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={formData.products.length === 0 || formData.images.length === 0}
            >
              Save Catalog
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddCatalog;