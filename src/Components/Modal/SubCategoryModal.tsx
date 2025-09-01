// SubCategoryModal.tsx
import React, { useState, useEffect } from "react";
import "../../Styles/CategoryModal.css"; // Reuse same styles for consistency

interface SubCategory {
  id: string;
  name: string;
  image?: string;
}

interface SubCategoryModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (subCategory: SubCategory, imageFile?: File) => void;
  subCategory: SubCategory | null;
  categoryName: string;
  isAdding: boolean;
  isLoading?: boolean;
}

const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  show,
  onClose,
  onSave,
  subCategory,
  categoryName,
  isAdding,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<SubCategory>({
    id: "",
    name: "",
    image: undefined,
  });
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (subCategory) {
      setFormData(subCategory);
      setImagePreview(subCategory.image || null);
      setImageFile(undefined);
    } else {
      setFormData({
        id: "",
        name: "",
        image: undefined,
      });
      setImagePreview(null);
      setImageFile(undefined);
    }
  }, [subCategory, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onSave(formData, imageFile);
    }
  };

  if (!show) return null;

  return (
    <div className="category-modal">
      <div className="category-modal__overlay" onClick={onClose}></div>
      <div className="category-modal__content">
        <div className="category-modal__header">
          <h2>
            {isAdding
              ? `Add Subcategory to ${categoryName}`
              : `Edit Subcategory`}
          </h2>
          <button className="category-modal__close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="category-modal__form">
          <div className="category-modal__form-group">
            <label htmlFor="name">Subcategory Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter subcategory name"
            />
          </div>

          <div className="category-modal__form-group">
            <label htmlFor="image">Subcategory Image</label>
            <div className="category-modal__file-upload-container">
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="category-modal__file-upload-btn"
                onClick={() => document.getElementById('image')?.click()}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Add Image</span>
              </button>
            </div>
            {imagePreview && (
              <div className="category-modal__image-preview">
                <img src={imagePreview} alt="Subcategory Preview" />
              </div>
            )}
          </div>

          <div className="category-modal__actions">
            <button
              type="button"
              className="category-modal__cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="category-modal__save-btn"
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                position: 'relative'
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ opacity: 0.5 }}>
                    {isAdding ? "Creating..." : "Saving..."}
                  </span>
                  <span 
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  <style>{`
                    @keyframes spin {
                      0% { transform: translateY(-50%) rotate(0deg); }
                      100% { transform: translateY(-50%) rotate(360deg); }
                    }
                  `}</style>
                </>
              ) : (
                isAdding ? "Create Subcategory" : "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubCategoryModal;
