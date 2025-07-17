import type React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import Pagination from "../Components/Pagination";
import DeleteModal from "../Components/Modal/DeleteModal";
import CategoryEditModal from "../Components/Modal/CategoryEditModal";
import SubCategoryModal from "../Components/Modal/SubCategoryModal";
import "../Styles/AdminCategories.css";
import placeholder from "../assets/earphones.png";
import { Plus } from "lucide-react";

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

interface ApiErrorResponse {
  message?: string;
}

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/electronics.jpg",
    subCategories: [
      { id: "1-1", name: "Smartphones", image: "/assets/smartphones.jpg" },
      { id: "1-2", name: "Laptops", image: "/assets/laptops.jpg" },
    ],
  },
  {
    id: "2",
    name: "Fashion",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/fashion.jpg",
    subCategories: [
      { id: "2-1", name: "Men's Clothing", image: "/assets/mens.jpg" },
      { id: "2-2", name: "Women's Clothing", image: "/assets/womens.jpg" },
    ],
  },
  {
    id: "3",
    name: "Home and Furniture",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/furniture.jpg",
    subCategories: [
      { id: "3-1", name: "Living Room", image: "/assets/living-room.jpg" },
      { id: "3-2", name: "Bedroom", image: "/assets/bedroom.jpg" },
    ],
  },
  {
    id: "4",
    name: "Health and Nutritions",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/health.jpg",
    subCategories: [
      { id: "4-1", name: "Vitamins", image: "/assets/vitamins.jpg" },
      { id: "4-2", name: "Protein", image: "/assets/protein.jpg" },
    ],
  },
  {
    id: "5",
    name: "Automobiles",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/automobiles.jpg",
    subCategories: [
      { id: "5-1", name: "Cars", image: "/assets/cars.jpg" },
      { id: "5-2", name: "Motorcycles", image: "/assets/motorcycles.jpg" },
    ],
  },
  {
    id: "6",
    name: "Beauty and Fragrance",
    status: "Visible",
    date: "04/10/2014",
    image: "/assets/beauty.jpg",
    subCategories: [
      { id: "6-1", name: "Skincare", image: "/assets/skincare.jpg" },
      { id: "6-2", name: "Perfumes", image: "/assets/perfumes.jpg" },
    ],
  },
];

const CACHE_KEY = "admin_categories";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Skeleton Component
const CategorySkeleton: React.FC = () => {
  return (
    <>
      {Array.from({ length: 7 }).map((_, index) => (
        <tr
          key={index}
          className="admin-categories__table-row admin-categories__skeleton-row"
        >
          <td>
            <div className="admin-categories__skeleton admin-categories__skeleton-checkbox"></div>
          </td>
          <td className="admin-categories__name-cell">
            <div className="admin-categories__category-container">
              <div className="admin-categories__skeleton admin-categories__skeleton-image"></div>
              <div className="admin-categories__skeleton admin-categories__skeleton-text admin-categories__skeleton-text--name"></div>
            </div>
          </td>
          <td>
            <div className="admin-categories__skeleton admin-categories__skeleton-text admin-categories__skeleton-text--status"></div>
          </td>
          <td>
            <div className="admin-categories__skeleton admin-categories__skeleton-text admin-categories__skeleton-text--date"></div>
          </td>
          <td className="admin-categories__actions">
            <div className="admin-categories__skeleton admin-categories__skeleton-button"></div>
            <div className="admin-categories__skeleton admin-categories__skeleton-button"></div>
            <div className="admin-categories__skeleton admin-categories__skeleton-button"></div>
            <div className="admin-categories__skeleton admin-categories__skeleton-button"></div>
          </td>
        </tr>
      ))}
    </>
  );
};

const AdminCategories: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriesPerPage] = useState(7);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(null);
  const [showCategoryEditModal, setShowCategoryEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<{
    categoryId: string;
    subCategoryId: string;
  } | null>(null);
  const [isAddingSubCategory, setIsAddingSubCategory] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Clear cache to ensure fresh data
        localStorage.removeItem(CACHE_KEY);

        // Try to load from cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Array.isArray(data) && Date.now() - timestamp < CACHE_TTL) {
              setCategories(data);
              setFilteredCategories(data);
              setIsLoading(false);
              return; // Exit early if valid cache is used
            }
          } catch {}
        }

        // Fetch fresh data
        const response = await axios.get(`${API_BASE_URL}/api/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const formattedCategories: Category[] = await Promise.all(
          response.data.data.map(async (category: any) => {
            // Fetch subcategories for each category
            let subCategories: SubCategory[] = [];
            try {
              const subResponse = await axios.get(
                `${API_BASE_URL}/api/categories/${category.id}/subcategories`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                }
              );
              subCategories = subResponse.data.data.map((sub: any) => ({
                id: sub.id.toString(),
                name: sub.name,
                image: sub.image || undefined,
              }));
            } catch (subErr) {
              console.error(
                `Failed to fetch subcategories for category ${category.id}:`,
                subErr
              );
            }
            return {
              id: category.id.toString(),
              name: category.name,
              status: "Visible" as const, // Assuming API doesn't return status
              date: new Date(category.createdAt).toLocaleDateString(),
              image: category.image || undefined, // Ensure image is included
              subCategories,
            };
          })
        );
        setCategories(formattedCategories);
        setFilteredCategories(formattedCategories);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: formattedCategories, timestamp: Date.now() })
        );
      } catch (err) {
        console.error("Fetch categories error:", err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Categories API endpoint not found. Using sample data.");
            setCategories(mockCategories);
            setFilteredCategories(mockCategories);
          } else if (err.response?.status === 401) {
            setError("Unauthorized. Please log in as an admin.");
          } else {
            setError(
              (err.response?.data as ApiErrorResponse)?.message ||
                "Failed to fetch categories"
            );
            setCategories(mockCategories);
            setFilteredCategories(mockCategories);
          }
        } else {
          setError("An unexpected error occurred while fetching categories");
          setCategories(mockCategories);
          setFilteredCategories(mockCategories);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  useEffect(() => {
    const results = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(results);
    setCurrentPage(1);
  }, [searchQuery, categories]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(
    indexOfFirstCategory,
    indexOfLastCategory
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsAddingCategory(true);
    setShowCategoryEditModal(true);
  };

  const handleSaveCategory = async (
    updatedCategory: Category,
    imageFile?: File
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAddingCategory) {
        // Create new category with optional image
        const formData = new FormData();
        formData.append("name", updatedCategory.name);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/categories`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const newCategory: Category = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          status: "Visible",
          date: new Date().toLocaleDateString(),
          image: response.data.data.image || undefined,
          subCategories: [],
        };

        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
        );
      } else if (updatedCategory.id) {
        // Update existing category with optional image
        const formData = new FormData();
        formData.append("name", updatedCategory.name);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        const response = await axios.put(
          `${API_BASE_URL}/api/categories/${updatedCategory.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const updatedCategoryFromApi: Category = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          status: updatedCategory.status,
          date: updatedCategory.date,
          image: response.data.data.image || updatedCategory.image,
          subCategories:
            response.data.data.subcategories?.map((sub: any) => ({
              id: sub.id.toString(),
              name: sub.name,
              image: sub.image || undefined,
            })) || updatedCategory.subCategories,
        };

        const updatedCategories = categories.map((category) =>
          category.id === updatedCategory.id ? updatedCategoryFromApi : category
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
        );
      }
    } catch (err) {
      console.error("Save category error:", err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          (err.response?.data as ApiErrorResponse)?.message || "Unknown error";
        if (status === 400) {
          setError("Invalid category name or ID. Please provide valid data.");
        } else if (status === 401) {
          setError("Unauthorized. Please log in as an admin.");
        } else if (status === 403) {
          setError("Forbidden. Admin access required.");
        } else if (status === 404) {
          setError("Category not found.");
        } else {
          setError(message || "Failed to save category");
        }
        // Fallback to mock data
        if (isAddingCategory) {
          const newCategory: Category = {
            ...updatedCategory,
            id: `${Date.now()}`,
            date: new Date().toLocaleDateString(),
            subCategories: [],
          };
          const updatedCategories = [...categories, newCategory];
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
          );
        } else {
          const updatedCategories = categories.map((category) =>
            category.id === updatedCategory.id ? updatedCategory : category
          );
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
          );
        }
      } else {
        setError("An unexpected error occurred while saving category");
      }
    } finally {
      setIsLoading(false);
      setShowCategoryEditModal(false);
      setIsAddingCategory(false);
    }
  };

  const handleAddSubCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setSelectedCategory(category);
      setSelectedSubCategory(null);
      setIsAddingSubCategory(true);
      setShowSubCategoryModal(true);
    }
  };

  const handleSaveSubCategory = async (
    categoryId: string,
    subCategory: SubCategory,
    imageFile?: File
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAddingSubCategory) {
        // Create new subcategory with optional image
        const formData = new FormData();
        formData.append("name", subCategory.name);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/categories/${categoryId}/subcategories`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const newSubCategory: SubCategory = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          image: response.data.data.image || undefined,
        };

        const updatedCategories = categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subCategories: [...category.subCategories, newSubCategory],
              }
            : category
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
        );
      } else if (subCategory.id) {
        // Update existing subcategory with optional image
        const formData = new FormData();
        formData.append("name", subCategory.name);
        if (imageFile) {
          formData.append("image", imageFile);
        }

        const response = await axios.put(
          `${API_BASE_URL}/api/categories/${categoryId}/subcategories/${subCategory.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const updatedSubCategory: SubCategory = {
          id: response.data.data.id.toString(),
          name: response.data.data.name,
          image: response.data.data.image || subCategory.image,
        };

        const updatedCategories = categories.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                subCategories: category.subCategories.map((sub) =>
                  sub.id === subCategory.id ? updatedSubCategory : sub
                ),
              }
            : category
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
        );
      }
    } catch (err) {
      console.error("Save subcategory error:", err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          (err.response?.data as ApiErrorResponse)?.message || "Unknown error";
        if (status === 400) {
          setError("Invalid subcategory name or ID.");
        } else if (status === 401) {
          setError("Unauthorized. Please log in as an admin.");
        } else if (status === 403) {
          setError("Forbidden. Admin access required.");
        } else if (status === 404) {
          setError("Category or subcategory not found.");
        } else {
          setError(message || "Failed to save subcategory");
        }
        // Fallback to local state update
        if (isAddingSubCategory) {
          const newSubCategoryId = `${categoryId}-${Date.now()}`;
          const updatedCategories = categories.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  subCategories: [
                    ...category.subCategories,
                    { ...subCategory, id: newSubCategoryId },
                  ],
                }
              : category
          );
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
          );
        } else {
          const updatedCategories = categories.map((category) =>
            category.id === categoryId
              ? {
                  ...category,
                  subCategories: category.subCategories.map((sub) =>
                    sub.id === subCategory.id ? subCategory : sub
                  ),
                }
              : category
          );
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: updatedCategories, timestamp: Date.now() })
          );
        }
      } else {
        setError("An unexpected error occurred while saving subcategory");
      }
    } finally {
      setIsLoading(false);
      setShowSubCategoryModal(false);
      setIsAddingSubCategory(false);
    }
  };

  const editSubCategory = (categoryId: string, subCategoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      const subCategory = category.subCategories.find(
        (s) => s.id === subCategoryId
      );
      if (subCategory) {
        setSelectedCategory(category);
        setSelectedSubCategory(subCategory);
        setIsAddingSubCategory(false);
        setShowSubCategoryModal(true);
      }
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setSubCategoryToDelete(null);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubCategory = (
    categoryId: string,
    subCategoryId: string
  ) => {
    setSubCategoryToDelete({ categoryId, subCategoryId });
    setCategoryToDelete(null);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (categoryToDelete) {
        console.log("Deleting category with token:", token);
        await axios.delete(
          `${API_BASE_URL}/api/categories/${categoryToDelete.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const updatedCategories = categories.filter(
          (category) => category.id !== categoryToDelete.id
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        setCategoryToDelete(null);
      } else if (subCategoryToDelete) {
        console.log("Deleting subcategory with token:", token);
        await axios.delete(
          `${API_BASE_URL}/api/categories/${subCategoryToDelete.categoryId}/subcategories/${subCategoryToDelete.subCategoryId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const updatedCategories = categories.map((category) =>
          category.id === subCategoryToDelete.categoryId
            ? {
                ...category,
                subCategories: category.subCategories.filter(
                  (sub) => sub.id !== subCategoryToDelete.subCategoryId
                ),
              }
            : category
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        setSubCategoryToDelete(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message =
          (err.response?.data as ApiErrorResponse)?.message || "Unknown error";
        if (status === 400) {
          setError("Invalid category or subcategory ID.");
        } else if (status === 401) {
          setError("Unauthorized. Please log in as an admin.");
        } else if (status === 403) {
          setError("Forbidden. Admin access required.");
        } else if (status === 404) {
          setError("Category or subcategory not found.");
        } else {
          setError(message || "Failed to delete item");
        }
        // Fallback to local state update
        if (categoryToDelete) {
          const updatedCategories = categories.filter(
            (category) => category.id !== categoryToDelete.id
          );
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          setCategoryToDelete(null);
        } else if (subCategoryToDelete) {
          const updatedCategories = categories.map((category) =>
            category.id === subCategoryToDelete.categoryId
              ? {
                  ...category,
                  subCategories: category.subCategories.filter(
                    (sub) => sub.id !== subCategoryToDelete.subCategoryId
                  ),
                }
              : category
          );
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          setSubCategoryToDelete(null);
        }
      } else {
        setError("An unexpected error occurred while deleting item");
      }
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
    }
  };

  const editCategory = (category: Category) => {
    setSelectedCategory({ ...category });
    setIsAddingCategory(false);
    setShowCategoryEditModal(true);
  };

  return (
    <div className="admin-categories">
      <AdminSidebar />
      <div className="admin-categories__content">
        {error && (
          <div className="admin-categories__error">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
        <Header
          onSearch={handleSearch}
          showSearch={true}
          title="Category Management"
        />
        <div className="admin-categories__list-container">
          <div className="admin-categories__header">
            <h2>Category Management</h2>
            <button
              className="admin-categories__add-btn"
              onClick={handleAddCategory}
            >
              Add Category
            </button>
          </div>
          <div className="admin-categories__table-container">
            <table className="admin-categories__table">
              <thead className="admin-categories__table-head">
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Category Name</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <CategorySkeleton />
                ) : (
                  currentCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="admin-categories__table-row"
                    >
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td className="admin-categories__name-cell">
                        <div className="admin-categories__category-container">
                          <div className="admin-categories__category-image">
                            {category.image ? (
                              <img
                                src={
                                  category.image ||
                                  placeholder ||
                                  "/placeholder.svg"
                                }
                                alt={category.name}
                              />
                            ) : (
                              <div className="admin-categories__no-image">
                                No Image
                              </div>
                            )}
                          </div>
                          <span>{category.name}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-categories__status admin-categories__status--${category.status.toLowerCase()}`}
                        >
                          <span className="admin-categories__status-dot"></span>
                          {category.status}
                        </span>
                      </td>
                      <td>{category.date}</td>
                      <td className="admin-categories__actions">
                        <button
                          className="admin-categories__action-btn admin-categories__delete-btn"
                          onClick={() => confirmDeleteCategory(category)}
                          aria-label="Delete category"
                        >
                          <svg
                            width="20"
                            height="20"
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
                              d="M8 6V4C8 2.96957 8.21071 2.46086 8.58579 2.08579C8.96086 1.71071 9.46957 1.5 10 1.5H14C14.5304 1.5 15.0391 1.71071 15.4142 2.08579C15.7893 2.46086 16 2.96957 16 3.5V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="admin-categories__action-btn admin-categories__view-btn"
                          onClick={() => setSelectedCategory(category)}
                          aria-label="View category"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 5C7.63636 5 4 8.63636 4 12C4 15.3636 7.63636 19 12 19C16.3636 19 20 15.3636 20 12C20 8.63636 16.3636 5 12 5Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          className="admin-categories__action-btn admin-categories__edit-btn"
                          onClick={() => editCategory(category)}
                          aria-label="Edit category"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20 20 18V13"
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
                          className="admin-categories__action-btn admin-categories__add-btn"
                          onClick={() => handleAddSubCategory(category.id)}
                          aria-label="Add subcategory"
                        >
                          ADD
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedCategory && (
            <div className="admin-categories__subcategories">
              <h3>Subcategories for {selectedCategory.name}</h3>
              <table className="admin-categories__subcategories-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCategory.subCategories.map((sub) => (
                    <tr key={sub.id}>
                      <td>{sub.name}</td>
                      <td>
                        <div className="admin-categories__subcategory-image">
                          {sub.image ? (
                            <img
                              src={
                                sub.image || placeholder || "/placeholder.svg"
                              }
                              alt={sub.name}
                            />
                          ) : (
                            <div className="admin-categories__no-image">
                              No Image
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-categories__actions">
                          <button
                            onClick={() =>
                              editSubCategory(selectedCategory.id, sub.id)
                            }
                            className="admin-categories__action-btn admin-categories__edit-btn"
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
                            onClick={() =>
                              confirmDeleteSubCategory(
                                selectedCategory.id,
                                sub.id
                              )
                            }
                            className="admin-categories__action-btn admin-categories__delete-btn"
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
                                d="M8 6V4C8 2.96957 8.21071 2.46086 8.58579 2.08579C8.96086 1.71071 9.46957 1.5 10 1.5H14C14.5304 1.5 15.0391 1.71071 15.4142 2.08579C15.7893 2.46086 16 2.96957 16 3.5V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
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

          <div className="admin-categories__pagination-container">
            <div className="admin-categories__pagination-info">
              Showing {indexOfFirstCategory + 1}-
              {Math.min(indexOfLastCategory, filteredCategories.length)} out of{" "}
              {filteredCategories.length}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(
                filteredCategories.length / categoriesPerPage
              )}
              onPageChange={paginate}
            />
          </div>
        </div>
      </div>

      <CategoryEditModal
        show={showCategoryEditModal}
        onClose={() => setShowCategoryEditModal(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
        isAdding={isAddingCategory}
      />

      <SubCategoryModal
        show={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onSave={(subCategory, imageFile) => {
          if (selectedCategory) {
            handleSaveSubCategory(selectedCategory.id, subCategory, imageFile);
          }
        }}
        subCategory={selectedSubCategory}
        categoryName={selectedCategory?.name || ""}
        isAdding={isAddingSubCategory}
      />

      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
        productName={
          categoryToDelete
            ? `Category: ${categoryToDelete.name}`
            : subCategoryToDelete
            ? `Subcategory from ${
                categories.find((c) => c.id === subCategoryToDelete.categoryId)
                  ?.name || ""
              }`
            : "Item"
        }
      />
    </div>
  );
};

export default AdminCategories;
