import React from "react";
import { X } from "lucide-react";
import "../../Styles/SubcategoriesViewModal.css";
import placeholder from "../../assets/earphones.png";

interface SubCategory {
  id: string;
  name: string;
  image?: string;
}

interface Category {
  id: string;
  name: string;
  status: "Visible" | "Hidden";
  date: string;
  image?: string;
  subCategories: SubCategory[];
}

interface SubcategoriesViewModalProps {
  show: boolean;
  onClose: () => void;
  category: Category | null;
  onEditSubCategory: (categoryId: string, subCategoryId: string) => void;
  onDeleteSubCategory: (categoryId: string, subCategoryId: string) => void;
  onChangeSubcategoryImage?: (categoryId: string, subCategoryId: string) => void;
  subcategoryImagePreview?: string | null;
  subcategoryImageChanging?: string | null;
}

const SubcategoriesViewModal: React.FC<SubcategoriesViewModalProps> = ({
  show,
  onClose,
  category,
  onEditSubCategory,
  onDeleteSubCategory,
  onChangeSubcategoryImage,
  subcategoryImagePreview,
  subcategoryImageChanging,
}) => {
  if (!show || !category) return null;

  return (
    <div className="subcategories-modal-overlay" onClick={onClose}>
      <div className="subcategories-modal" onClick={(e) => e.stopPropagation()}>
        <div className="subcategories-modal__header">
          <h2 className="subcategories-modal__title">
            Subcategories for {category.name}
          </h2>
          <button className="subcategories-modal__close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="subcategories-modal__content">
          {category.subCategories.length === 0 ? (
            <div className="subcategories-modal__empty">
              <p>No subcategories found for this category.</p>
            </div>
          ) : (
            <div className="subcategories-modal__table-container">
              <table className="subcategories-modal__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {category.subCategories.map((sub) => (
                    <tr key={sub.id}>
                      <td className="subcategories-modal__name">{sub.name}</td>
                      <td>
                        <div className="subcategories-modal__image-container">
                          <div className="subcategories-modal__image">
                            {(subcategoryImagePreview && subcategoryImageChanging === sub.id) || sub.image ? (
                              <img
                                src={(subcategoryImagePreview && subcategoryImageChanging === sub.id) ? subcategoryImagePreview : (sub.image || placeholder || "/placeholder.svg")}
                                alt={sub.name}
                              />
                            ) : (
                              <div className="subcategories-modal__no-image">No Image</div>
                            )}
                          </div>
                          {onChangeSubcategoryImage && (
                            <button 
                              className="subcategories-modal__change-image-btn"
                              onClick={() => onChangeSubcategoryImage(category.id, sub.id)}
                              title="Change image"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="subcategories-modal__actions">
                          <button
                            onClick={() => onEditSubCategory(category.id, sub.id)}
                            className="subcategories-modal__action-btn subcategories-modal__edit-btn"
                            title="Edit subcategory"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => onDeleteSubCategory(category.id, sub.id)}
                            className="subcategories-modal__action-btn subcategories-modal__delete-btn"
                            title="Delete subcategory"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3 6H5H21"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcategoriesViewModal;