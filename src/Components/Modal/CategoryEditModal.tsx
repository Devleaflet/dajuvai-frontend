import React, { useState, useEffect } from "react";
import "../../Styles/CategoryModal.css";

interface Category {
  id: string;
  name: string;
  status: "Visible" | "Hidden";
  date: string;
  image?: string;
  subCategories: any[];
}

interface CategoryEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (category: Category, imageFile?: File) => void;
  category: Category | null;
  isAdding: boolean;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  show,
  onClose,
  onSave,
  category,
  isAdding,
}) => {
  const [formData, setFormData] = useState<Partial<Category>>({
    id: "",
    name: "",
    status: "Visible",
    date: new Date().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    image: "",
    subCategories: [],
  });
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({
        ...category,
      });
      setImagePreview(category.image || null);
      setImageFile(undefined);
    } else {
      setFormData({
        id: "",
        name: "",
        status: "Visible",
        date: new Date().toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }),
        image: "",
        subCategories: [],
      });
      setImagePreview(null);
      setImageFile(undefined);
    }
  }, [category, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    } else {
      setImageFile(undefined);
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onSave(formData as Category, imageFile);
    }
  };

  if (!show) return null;

  return (
    <div className="category-modal">
      <div className="category-modal__overlay" onClick={onClose}></div>
      <div className="category-modal__content">
        <div className="category-modal__header">
          <h2>{isAdding ? "Add New Category" : "Edit Category"}</h2>
          <button className="category-modal__close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="category-modal__form">
          <div className="category-modal__form-group">
            <label htmlFor="name">Category Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter category name"
            />
          </div>

          <div className="category-modal__form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Visible">Visible</option>
              <option value="Hidden">Hidden</option>
            </select>
          </div>

          <div className="category-modal__form-group">
            <label htmlFor="image">Category Image</label>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
            />
            {imagePreview && (
              <div className="category-modal__image-preview">
                <img src={imagePreview} alt="Category Preview" />
              </div>
            )}
          </div>

          <div className="category-modal__actions">
            <button type="button" className="category-modal__cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="category-modal__save-btn">
              {isAdding ? "Create Category" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryEditModal;