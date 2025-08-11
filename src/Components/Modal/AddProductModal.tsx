import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config";
import { ProductFormData } from "../../types/product";
import { useVendorAuth } from "../../context/VendorAuthContext";

enum InventoryStatus {
  AVAILABLE = "AVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  LOW_STOCK = "LOW_STOCK",
}

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

interface Subcategory {
  id: number;
  name: string;
}

interface InventoryItem {
  sku: string;
  status: string;
}

interface AddProductModalProps {
  show: boolean;
  onClose: () => void;
  onAdd: (
    product: ProductFormData,
    categoryId: number,
    subcategoryId: number,
    token: string,
    role: "admin" | "vendor"
  ) => Promise<void>;
  role: "admin" | "vendor";
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  show,
  onClose,
  onAdd,
  role,
}) => {
  const { authState } = useVendorAuth();
  console.log("Vendor ID from context:", authState.vendor?.id);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "Awesome T-Shirt",
    description: "High quality cotton t-shirt",
    basePrice: "29.99",
    stock: 100,
    discount: "5",
    discountType: "PERCENTAGE",
    vendorId: "",
    inventory: [],
    status: "AVAILABLE",
    productImages: [],
    categoryId: 0,
    subcategoryId: 0,
    size: [],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    number | null
  >(null);
  const [inventoryInput, setInventoryInput] = useState({
    selectedSize: "",
    status: InventoryStatus.AVAILABLE,
  });
  const [error, setError] = useState<string | null>(null);
  const [token] = useState<string | null>(localStorage.getItem("token"));

  const statusOptions = Object.values(InventoryStatus);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
          const defaultCategory = result.data.find(
            (cat: Category) => cat.id === 1
          );
          if (defaultCategory) setSelectedCategoryId(1);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load categories";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching categories:", err);
      }
    };
    if (show) fetchCategories();
  }, [show, token]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      if (selectedCategoryId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/categories/${selectedCategoryId}/subcategories`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          if (result.success) {
            setSubcategories(result.data);
            const defaultSubcategory = result.data.find(
              (sub: Subcategory) => sub.id === 2
            );
            if (defaultSubcategory) setSelectedSubcategoryId(2);
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to load subcategories";
          setError(errorMessage);
          toast.error(errorMessage);
          console.error("Error fetching subcategories:", err);
        }
      } else {
        setSubcategories([]);
        setSelectedSubcategoryId(null);
      }
    };
    fetchSubcategories();
  }, [selectedCategoryId, token]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInventoryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInventoryInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleInventoryAdd = () => {
    try {
      if (!inventoryInput.selectedSize)
        throw new Error("Please select a size for the inventory");
      if (
        !inventoryInput.status ||
        !statusOptions.includes(inventoryInput.status)
      )
        throw new Error("Valid status is required");
      const sku = `TSHIRT-${inventoryInput.selectedSize}`;
      if (formData.inventory.some((inv: InventoryItem) => inv.sku === sku))
        throw new Error(
          `Inventory for size ${inventoryInput.selectedSize} already exists`
        );
      setFormData((prev) => ({
        ...prev,
        inventory: [
          ...prev.inventory,
          {
            sku,
            status: inventoryInput.status,
          },
        ],
      }));
      setInventoryInput({
        selectedSize: "",
        status: InventoryStatus.AVAILABLE,
      });
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add inventory";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error adding inventory:", err);
    }
  };

  const handleInventoryRemove = (skuToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((inv) => inv.sku !== skuToRemove),
    }));
  };

  const validateForm = () => {
    if (!formData.name) return "Product name is required";
    if (
      !formData.basePrice ||
      !/^\d+(\.\d{1,2})?$/.test(String(formData.basePrice))
    )
      return "Valid base price is required (e.g., 29.99)";
    if (!formData.stock || !/^\d+$/.test(String(formData.stock)))
      return "Valid stock is required (integer)";
    if (
      formData.discount &&
      !/^\d+(\.\d{1,2})?$/.test(String(formData.discount))
    )
      return "Valid discount is required (e.g., 5.00)";
    if (!formData.inventory.length) return "At least one inventory entry is required";
    if (
      formData.inventory.some(
        (inv: { sku: string; status: string }) =>
          !inv.sku ||
          !statusOptions.includes(inv.status as InventoryStatus)
      )
    ) {
      return "Invalid inventory entries: ensure SKUs are valid and statuses are valid";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    if (!token) {
      const errorMessage = "Authentication token is missing";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    if (!authState.vendor?.id) {
      const errorMessage = "Vendor ID is missing from context";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    try {
      const payload: ProductFormData = {
        ...formData,
        vendorId: String(authState.vendor.id),
        categoryId: selectedCategoryId!,
        subcategoryId: selectedSubcategoryId!,
      };
      console.log("AddProductModal Request Body:", {
        payload,
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId,
      });
      await onAdd(
        payload,
        selectedCategoryId!,
        selectedSubcategoryId!,
        token,
        role
      );
      setFormData({
        name: "",
        description: "",
        basePrice: "",
        stock: 0,
        discount: "",
        discountType: "PERCENTAGE",
        size: [],
        vendorId: "",
        inventory: [],
        status: "AVAILABLE",
        productImages: [],
        categoryId: 0,
        subcategoryId: 0,
      });
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
      setInventoryInput({
        selectedSize: "",
        status: InventoryStatus.AVAILABLE,
      });
      setError(null);
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to add product";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error adding product:", err);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "500px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>Add Product Vendor</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
        {error && (
          <div
            className="modal-error"
            style={{
              color: "red",
              margin: "10px 0",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {error}
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <div className="form-group">
              <label>Category</label>
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subcategory</label>
              <select
                value={selectedSubcategoryId || ""}
                onChange={(e) =>
                  setSelectedSubcategoryId(Number(e.target.value))
                }
                required
                disabled={!selectedCategoryId}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Subcategory</option>
                {subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  minHeight: "100px",
                }}
              />
            </div>
            <div className="form-group">
              <label>Base Price</label>
              <input
                type="text"
                name="basePrice"
                value={formData.basePrice ? String(formData.basePrice) : ""}
                onChange={handleInputChange}
                required
                pattern="\d+(\.\d{1,2})?"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="text"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                pattern="\d+"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="form-group">
              <label>Discount</label>
              <input
                type="text"
                name="discount"
                value={formData.discount ? String(formData.discount) : ""}
                onChange={handleInputChange}
                pattern="\d+(\.\d{1,2})?"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="form-group">
              <label>Discount Type</label>
              <select
                name="discountType"
                value={formData.discountType ?? "PERCENTAGE"}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat</option>
              </select>
            </div>
            <div className="form-group">
              <label>Inventory</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <select
                  name="selectedSize"
                  value={inventoryInput.selectedSize}
                  onChange={handleInventoryChange}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="">Select Size for Inventory</option>
                  {/* Sizes are now hardcoded or removed, so this will be empty */}
                </select>

                <select
                  name="status"
                  value={inventoryInput.status}
                  onChange={handleInventoryChange}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleInventoryAdd}
                  disabled={
                    !inventoryInput.selectedSize ||
                    !inventoryInput.status
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: "4px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Add Inventory
                </button>
              </div>
              {formData.inventory.length > 0 && (
                <ul
                  style={{ listStyle: "none", padding: "0", marginTop: "10px" }}
                >
                  {formData.inventory.map(
                    (inv: InventoryItem, index: number) => (
                      <li
                        key={index}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        {`${inv.sku} - ${inv.status}`}
                        <button
                          type="button"
                          onClick={() => handleInventoryRemove(inv.sku)}
                          style={{
                            background: "none",
                            color: "red",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>
          <div
            className="modal-footer"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
