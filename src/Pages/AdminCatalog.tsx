import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Plus, Edit, Trash2, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import toast, { Toaster } from "react-hot-toast";
import "../Styles/AdminCatalog.css";
import { AdminSidebar } from "../Components/AdminSidebar";
import Header from "../Components/Header";
import { API_BASE_URL } from "../config";
import { useAuth } from "../context/AuthContext";

interface Product {
	id: number;
	name: string;
	title?: string;
	price?: number;
	productImages?: string[];
}

interface HomepageSection {
	id: number;
	title: string;
	isActive: boolean;
	products: Product[];
}

interface Category {
	id: number;
	name: string;
	subcategories: Subcategory[];
}

interface Subcategory {
	id: number;
	name: string;
	products: Product[];
}

interface Deal {
	id: number;
	name: string;
	discount: Float32Array;
	status: string;
}

const AdminCatalog = () => {
	const { token } = useAuth();
	const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(
		[]
	);
	const [loadingSections, setLoadingSections] = useState(true);
	const [loadingProducts, setLoadingProducts] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showHomepageModal, setShowHomepageModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [sectionToDelete, setSectionToDelete] = useState<number | null>(null);
	const [editingHomepage, setEditingHomepage] =
		useState<HomepageSection | null>(null);
	const [modalTitle, setModalTitle] = useState("");
	const [modalIsActive, setModalIsActive] = useState(true);
	const [modalProductIds, setModalProductIds] = useState<number[]>([]);
	const [allProducts, setAllProducts] = useState<Product[]>([]);
	const [subCategoryProducts, setSubCategoryProducts] = useState<Product[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [deals, setDeals] = useState<Deal[]>([]);
	const [productSearchQuery, setProductSearchQuery] = useState("");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
	const [currentStep, setCurrentStep] = useState(1);
	const [selectedProductSource, setSelectedProductSource] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("");
	const [selectedSubcategory, setSelectedSubcategory] = useState("");
	const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
	const [selectedDeal, setSelectedDeal] = useState("");
	const [selectedCategoryId, setSelectedCategoryId] = useState<number>();
	const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number>();
	const [selectedDealId, setSelectedDealId] = useState<number>();
	const [sectionToEdit, setSectiontoEdit] = useState<number>();

	const handleProductSelect = (productId: number) => {
		setSelectedProducts((prev) => {
			const newSelection = prev.includes(productId)
				? prev.filter((id) => id !== productId)
				: [...prev, productId];
			setModalProductIds(newSelection);
			return newSelection;
		});
	};

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearchQuery(productSearchQuery);
		}, 300);
		return () => clearTimeout(handler);
	}, [productSearchQuery]);

	useEffect(() => {
		fetchHomepageSections();
		fetchProducts();
		fetchCategories();
		fetchDeals();
	}, [token]);

	const fetchHomepageSections = async () => {
		if (!token) return;
		setLoadingSections(true);
		setError(null);
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/homepage?includeInactive=true`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				}
			);
			if (!response.ok) throw new Error("Failed to fetch homepage sections");
			const data = await response.json();
			setHomepageSections(data.data);
		} catch (err) {
			setError("Failed to load homepage sections");
			toast.error("Failed to load homepage sections");
		} finally {
			setLoadingSections(false);
		}
	};

	const fetchProducts = async () => {
		if (!token) return;
		setLoadingProducts(true);
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/categories/all/products`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				}
			);
			if (!response.ok) throw new Error("Failed to fetch products");
			const data = await response.json();
			const formattedProducts = data.data.map((item: any) => ({
				id: item.id,
				name: item.name,
				title: item.name,
				price: parseFloat(item.basePrice),
				productImages: item.variants?.[0]?.variantImages || item.productImages,
			}));
			setAllProducts(formattedProducts);
		} catch (err) {
			toast.error("Failed to load products");
		} finally {
			setLoadingProducts(false);
		}
	};

	const fetchCategories = async () => {
		if (!token) return;
		try {
			const response = await fetch(`${API_BASE_URL}/api/categories`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});
			if (!response.ok) throw new Error("Failed to fetch categories");
			const data = await response.json();
			setCategories(data.data);
		} catch (err) {
			toast.error("Failed to load categories");
		}
	};

	const handleToggleHomepageStatus = async (id: number) => {
		if (!token) return;
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/homepage/${id}/toggle-status`,
				{
					method: "PATCH",
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				}
			);
			if (!response.ok) throw new Error("Failed to toggle section status");
			const data = await response.json();
			setHomepageSections((sections) =>
				sections.map((section) =>
					section.id === id
						? { ...section, isActive: data.data.isActive }
						: section
				)
			);
			toast.success("Section status updated successfully");
		} catch (err) {
			toast.error("Failed to update section status");
		}
	};

	const handleDeleteHomepageSection = async (id: number) => {
		if (!token) return;
		try {
			const response = await fetch(`${API_BASE_URL}/api/homepage/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});
			if (!response.ok) throw new Error("Failed to delete section");
			setHomepageSections((sections) =>
				sections.filter((section) => section.id !== id)
			);
			toast.success("Homepage section deleted successfully");
			setShowDeleteModal(false);
			setSectionToDelete(null);
		} catch (err) {
			toast.error("Failed to delete section");
		}
	};

	const openDeleteConfirmation = useCallback((id: number) => {
		setSectionToDelete(id);
		setShowDeleteModal(true);
	}, []);

	const openHomepageModal = useCallback(
		(section?: HomepageSection, show?: number) => {
			if (section) {
				setEditingHomepage(section);
				setModalTitle(section.title);
				setModalIsActive(section.isActive);
				setModalProductIds(section.products.map((p) => p.id));
				setSelectedProducts(section.products.map((p) => p.id));
				setSectiontoEdit(section.id);
			} else {
				setEditingHomepage(null);
				setModalTitle("");
				setModalIsActive(true);
				setModalProductIds([]);
				setSelectedProducts([]);
				setSelectedProductSource("");
				setSelectedCategory("");
				setSelectedSubcategory("");
				setSelectedDeal("");
			}
			setProductSearchQuery("");
			setDebouncedSearchQuery("");
			setCurrentStep(1);
			if (show == -1) {
				setShowHomepageModal(false);
			} else {
				setShowHomepageModal(true);
			}
		},
		[]
	);

	const handleSaveHomepageSection = async () => {
		try {
			let payload = {
				title: modalTitle,
				isActive: modalIsActive,
				productSource: selectedProductSource,
			};

			let endpoint =
				`${API_BASE_URL}/api/homepage` +
				(editingHomepage ? "/" + sectionToEdit : ``);

			// Build payload based on product source
			switch (selectedProductSource) {
				case "manual":
					payload.productIds = modalProductIds;
					break;

				case "deal":
					payload.selectedDealId = selectedDealId;
					break;

				case "category":
					payload.selectedCategoryId = selectedCategoryId;
					break;

				case "subcategory":
					payload.selectedCategoryId = selectedCategoryId;
					payload.selectedSubcategoryId = selectedSubcategoryId;
					break;

				default:
					throw new Error(`Unknown product source: ${selectedProductSource}`);
			}

			if (editingHomepage) {
				payload.sectionId = sectionToEdit;
			}

			console.log(
				"😂🔥",
				sectionToEdit,
				payload,
				endpoint,
				selectedProductSource
			);

			const res = await fetch(endpoint, {
				method: editingHomepage ? "PUT" : "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const errorData = await res.text();
				throw new Error(`Failed to save: ${res.status} - ${errorData}`);
			}

			const result = await res.json();
			console.log(`✅ ${selectedProductSource} section saved`, result);
			const successMessage = editingHomepage
				? "Homepage section updated successfully"
				: "Homepage section added successfully";
			toast.success(successMessage);
			fetchHomepageSections();
			openHomepageModal(null, -1);
		} catch (err) {
			console.error("❌ Error:", err);
		}
	};

	const filteredSections = useMemo(
		() =>
			homepageSections.filter((section) =>
				section.title.toLowerCase().includes(searchQuery.toLowerCase())
			),
		[homepageSections, searchQuery]
	);

	const filteredProducts = useMemo(
		() =>
			allProducts.filter((product) =>
				product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
			),
		[allProducts, debouncedSearchQuery]
	);

	const nextStep = () => {
		if (currentStep < 2) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleProductSourceChange = (
		e: React.ChangeEvent<HTMLSelectElement>
	) => {
		setSelectedProductSource(e.target.value);
		setSelectedCategory("");
		setSelectedSubcategory("");
		setSelectedDeal("");
		// Do not reset selectedProducts or modalProductIds to persist selections
	};

	const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setSelectedCategory(value);

		const category = categories.find((c) => c.name === value);
		const id = category ? category.id : 0;
		setSelectedCategoryId(id);
	};

	const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setSelectedSubcategory(value);

		const subcategory = getSubcategories().find((s) => s.name === value);
		const id = subcategory ? subcategory.id : 0;
		setSelectedSubcategoryId(id);
	};

	const handleDealChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		setSelectedDeal(value);

		const deal = deals.find((d) => d.name === value);
		const id = deal ? deal.id : 0;
		setSelectedDealId(id);
	};

	const getSubcategories = () => {
		const category = categories.find((cat) => cat.name === selectedCategory);
		return category ? category.subcategories : [];
	};

	const fetchProductsForSubcategory = async (subcategoryId: number) => {
		if (!token) return;
		setLoadingProducts(true);
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/categories/all/products?subcategoryId=${subcategoryId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						Accept: "application/json",
					},
				}
			);
			if (!response.ok) throw new Error("Failed to fetch products");
			const data = await response.json();
			const formattedProducts = data.data.map((item: any) => ({
				id: item.id,
				name: item.name,
				title: item.name,
				hasVariants: item.hasVariants,
				price: parseFloat(item.basePrice),
				productImages:
					item.variants.length > 0
						? item.variants[0].variantImages
						: item.productImages,
			}));
			setSubCategoryProducts(formattedProducts);
		} catch (err) {
			toast.error("Failed to load products");
			setSubCategoryProducts([]);
		} finally {
			setLoadingProducts(false);
		}
	};

	const fetchDeals = async () => {
		if (!token) return;
		setLoadingProducts(true);
		try {
			const response = await fetch(`${API_BASE_URL}/api/deal`, {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: "application/json",
				},
			});

			if (!response.ok) throw new Error("Failed to fetch deals");
			const data = await response.json();
			const formattedDeals = data.data.deals.map((item: any) => ({
				id: item.id,
				name: item.name,
				discount: item.discountPercentage,
				status: item.status,
			}));

			setDeals(formattedDeals);
		} catch (err) {
			toast.error("Failed to load produdealscts");
			setDeals([]);
		} finally {
			setLoadingProducts(false);
		}
	};

	useEffect(() => {
		const category = categories.find((cat) => cat.name === selectedCategory);
		const subcategory = category?.subcategories.find(
			(sub) => sub.name === selectedSubcategory
		);
		if (subcategory) {
			fetchProductsForSubcategory(subcategory.id);
		} else {
			setSubCategoryProducts([]);
			setLoadingProducts(false);
		}
	}, [selectedSubcategory, selectedCategory]);

	return (
		<div className="admin-catalog">
			{/* <Toaster
				position="top-right"
				toastOptions={{
					duration: 3000,
					style: {
						background: "#333",
						color: "#fff",
					},
					success: {
						style: { backgroundColor: "#4caf50" },
					},
					error: {
						style: { backgroundColor: "#f44336" },
					},
				}}
			/> */}
			<AdminSidebar />
			<div className="admin-catalog__container">
				<Header
					onSearch={() => {}}
					showSearch={false}
					title="Content Management"
				/>
				<div className="admin-catalog__content">
					<div className="admin-catalog__card">
						<div className="admin-catalog__card-header">
							<div className="admin-catalog__section-info">
								<h3 className="admin-catalog__section-title">
									Homepage Sections
								</h3>
								<p className="admin-catalog__section-description">
									Manage sections that appear on your homepage
								</p>
							</div>
							<div className="admin-catalog__controls">
								<div className="admin-catalog__search">
									<Search className="admin-catalog__search-icon" />
									<input
										type="text"
										placeholder="Search sections..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="admin-catalog__search-input"
									/>
								</div>
								<button
									onClick={() => openHomepageModal()}
									className="admin-catalog__add-button"
								>
									<Plus className="admin-catalog__button-icon" />
									Add Section
								</button>
							</div>
						</div>

						<div className="admin-catalog__table-container">
							{error ? (
								<div className="admin-catalog__error">{error}</div>
							) : loadingSections ? (
								<div className="admin-catalog__loading">
									{[...Array(5)].map((_, i) => (
										<div
											key={i}
											className="admin-catalog__skeleton-row"
										>
											<div className="admin-catalog__skeleton-cell"></div>
											<div className="admin-catalog__skeleton-cell"></div>
											<div className="admin-catalog__skeleton-cell"></div>
											<div className="admin-catalog__skeleton-cell"></div>
										</div>
									))}
								</div>
							) : (
								<table className="admin-catalog__table">
									<thead className="admin-catalog__table-head">
										<tr className="admin-catalog__table-row">
											<th className="admin-catalog__table-header">Title</th>
											<th className="admin-catalog__table-header">Status</th>
											<th className="admin-catalog__table-header">Products</th>
											<th className="admin-catalog__table-header">Actions</th>
										</tr>
									</thead>
									<tbody className="admin-catalog__table-body">
										{filteredSections.map((section) => (
											<tr
												key={section.id}
												className="admin-catalog__table-row"
											>
												<td className="admin-catalog__table-cell admin-catalog__table-cell--title">
													{section.title}
												</td>
												<td className="admin-catalog__table-cell">
													<button
														onClick={() =>
															handleToggleHomepageStatus(section.id)
														}
														className={`admin-catalog__status-toggle ${
															section.isActive
																? "admin-catalog__status-toggle--active"
																: "admin-catalog__status-toggle--inactive"
														}`}
													>
														{section.isActive ? "Active" : "Inactive"}
													</button>
												</td>
												<td className="admin-catalog__table-cell">
													<div className="admin-catalog__product-tags">
														{section.products.slice(0, 3).map((product) => (
															<span
																key={product.id}
																className="admin-catalog__product-tag"
																style={{
																	backgroundColor: "#e6e3e3ff",
																	borderRadius: "6px",
																	padding: "2px 4px",
																	marginInline: "3px",
																}}
															>
																{product.title || product.name}
															</span>
														))}
														{section.products.length > 3 && (
															<span className="admin-catalog__product-tag admin-catalog__product-tag--more">
																+{section.products.length - 3}
															</span>
														)}
													</div>
												</td>
												<td className="admin-catalog__table-cell">
													<div className="admin-catalog__actions">
														<button
															onClick={() => openHomepageModal(section)}
															className="admin-catalog__action-button admin-catalog__action-button--edit"
														>
															<Edit className="admin-catalog__action-icon" />
														</button>
														<button
															onClick={() => openDeleteConfirmation(section.id)}
															className="admin-catalog__action-button admin-catalog__action-button--delete"
														>
															<Trash2 className="admin-catalog__action-icon" />
														</button>
													</div>
												</td>
											</tr>
										))}
										{!loadingSections && filteredSections.length === 0 && (
											<tr className="admin-catalog__table-row">
												<td
													colSpan={4}
													className="admin-catalog__table-cell admin-catalog__no-data"
												>
													No sections found
												</td>
											</tr>
										)}
									</tbody>
								</table>
							)}
						</div>
					</div>

					<Dialog.Root
						open={showHomepageModal}
						onOpenChange={setShowHomepageModal}
					>
						<Dialog.Portal>
							<Dialog.Overlay className="admin-catalog__modal-overlay" />
							<Dialog.Content className="admin-catalog__modal admin-catalog__modal--homepage">
								<Dialog.Title className="admin-catalog__modal-title">
									{editingHomepage
										? "Edit Homepage Section"
										: "Add Homepage Section"}
								</Dialog.Title>
								<Dialog.Close asChild>
									<button
										className="admin-catalog__modal-close"
										aria-label="Close"
									>
										<X size={24} />
									</button>
								</Dialog.Close>
								<div className="form-container">
									{currentStep === 1 && (
										<div>
											<div className="admin-catalog-form-container">
												<div className="admin-catalog__form-group">
													<label
														htmlFor="title"
														className="admin-catalog__form-label"
													>
														Title
													</label>
													<input
														id="title"
														type="text"
														value={modalTitle}
														onChange={(e) => setModalTitle(e.target.value)}
														placeholder="Section title"
														className="admin-catalog__form-input"
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																e.preventDefault();
																nextStep();
															}
														}}
													/>
												</div>
												<div className="admin-catalog__checkbox-container">
													<input
														id="isActive"
														type="checkbox"
														className="admin-catalog__checkbox"
														checked={modalIsActive}
														onChange={(e) => setModalIsActive(e.target.checked)}
													/>
													<label
														htmlFor="isActive"
														className="admin-catalog__checkbox-label"
													>
														Active
													</label>
												</div>
											</div>
											<div className="buttons">
												<div></div>
												<button
													type="button"
													className="btn btn-next"
													onClick={nextStep}
													disabled={!modalTitle.trim()}
												>
													Next
												</button>
											</div>
										</div>
									)}
									{currentStep === 2 && (
										<div>
											<div className="admin-catalog-form-container">
												<div className="admin-catalog__form-group">
													<label
														htmlFor="productSource"
														className="admin-catalog__form-label"
													>
														Select Product Source
													</label>
													<select
														id="productSource"
														value={selectedProductSource}
														onChange={handleProductSourceChange}
														className="admin-catalog__form-input"
													>
														<option value="">--Select Product Source--</option>
														<option value="manual">
															Insert Products Manually
														</option>
														<option value="category">Select Category</option>
														<option value="subcategory">
															Select Subcategory
														</option>
														<option value="deal">Select Deals</option>
													</select>
												</div>
												{selectedProductSource === "manual" && (
													<>
														<div className="admin-catalog__form-group">
															<label
																htmlFor="selectCategoryManual"
																className="admin-catalog__form-label"
															>
																Select Category
															</label>
															<select
																id="selectCategoryManual"
																value={selectedCategory}
																onChange={handleCategoryChange}
																className="admin-catalog__form-input"
															>
																<option value="">--Select Category--</option>
																{categories.map((category) => (
																	<option
																		key={category.id}
																		value={category.name}
																	>
																		{category.name}
																	</option>
																))}
															</select>
														</div>
														{selectedCategory && (
															<div className="admin-catalog__form-group">
																<label
																	htmlFor="selectSubcategoryManual"
																	className="admin-catalog__form-label"
																>
																	Select Subcategory
																</label>
																<select
																	id="selectSubcategoryManual"
																	value={selectedSubcategory}
																	onChange={handleSubcategoryChange}
																	className="admin-catalog__form-input"
																>
																	<option value="">
																		--Select Subcategory--
																	</option>
																	{getSubcategories().map((subcategory) => (
																		<option
																			key={subcategory.id}
																			value={subcategory.name}
																		>
																			{subcategory.name}
																		</option>
																	))}
																</select>
															</div>
														)}
														{/* Selected Products Section */}
														{selectedProducts.length > 0 && (
															<div className="admin-catalog__form-group">
																<h4
																	className="admin-catalog__form-label"
																	style={{
																		fontWeight: "bold",
																	}}
																>
																	Selected Products
																</h4>
																<div className="admin-catalog-grid">
																	{allProducts
																		.filter((product) =>
																			selectedProducts.includes(product.id)
																		)
																		.map((product) => (
																			<div
																				key={product.id}
																				className="admin-catalog-card selected"
																				onClick={() =>
																					handleProductSelect(product.id)
																				}
																			>
																				<input
																					type="checkbox"
																					id={`product-${product.id}`}
																					className="admin-catalog-checkbox"
																					checked={selectedProducts.includes(
																						product.id
																					)}
																					onChange={() =>
																						handleProductSelect(product.id)
																					}
																					onClick={(e) => e.stopPropagation()}
																				/>
																				<div className="admin-catalog-image-wrapper">
																					<img
																						src={
																							product.productImages?.[0] ||
																							"/placeholder.png"
																						}
																						alt={product.title}
																						className="admin-catalog-image"
																					/>
																				</div>
																				<div className="admin-catalog-info">
																					<h4
																						className="admin-catalog-title"
																						title={product.title}
																					>
																						{product.title}
																					</h4>
																				</div>
																			</div>
																		))}
																</div>
															</div>
														)}
														{/* Subcategory Products for Selection */}
														{selectedSubcategory && (
															<>
																{loadingProducts ? (
																	<div className="admin-catalog-grid">
																		{Array.from({ length: 6 }).map((_, i) => (
																			<div
																				key={i}
																				className="admin-catalog-card skeleton"
																			>
																				<div className="admin-catalog-image-wrapper skeleton-box"></div>
																				<div className="admin-catalog-info">
																					<div
																						className="skeleton-box"
																						style={{
																							height: "16px",
																							width: "80%",
																							margin: "6px auto",
																						}}
																					></div>
																					<div
																						className="skeleton-box"
																						style={{
																							height: "14px",
																							width: "40%",
																							margin: "6px auto",
																						}}
																					></div>
																				</div>
																			</div>
																		))}
																	</div>
																) : subCategoryProducts.length > 0 ? (
																	<div className="admin-catalog__form-group">
																		<h4
																			className="admin-catalog__form-label"
																			style={{
																				fontWeight: "bold",
																			}}
																		>
																			Available Products
																		</h4>
																		<div className="admin-catalog-grid">
																			{subCategoryProducts.map((product) => {
																				const isSelected =
																					selectedProducts.includes(product.id);
																				return (
																					<div
																						key={product.id}
																						className={`admin-catalog-card ${
																							isSelected ? "selected" : ""
																						}`}
																						onClick={() =>
																							handleProductSelect(product.id)
																						}
																					>
																						<input
																							type="checkbox"
																							id={`product-${product.id}`}
																							className="admin-catalog-checkbox"
																							checked={isSelected}
																							onChange={() =>
																								handleProductSelect(product.id)
																							}
																							onClick={(e) =>
																								e.stopPropagation()
																							}
																						/>
																						<div className="admin-catalog-image-wrapper">
																							<img
																								src={
																									product.productImages?.[0] ||
																									"/placeholder.png"
																								}
																								alt={product.title}
																								className="admin-catalog-image"
																							/>
																						</div>
																						<div className="admin-catalog-info">
																							<h4
																								className="admin-catalog-title"
																								title={product.title}
																							>
																								{product.title}
																							</h4>
																						</div>
																					</div>
																				);
																			})}
																		</div>
																	</div>
																) : (
																	<p className="text-gray-500 text-center mt-6">
																		No products available for this subcategory.
																	</p>
																)}
															</>
														)}
													</>
												)}
												{selectedProductSource === "category" && (
													<div className="admin-catalog__form-group">
														<label
															htmlFor="selectCategory"
															className="admin-catalog__form-label"
														>
															Select Category
														</label>
														<select
															id="selectCategory"
															value={selectedCategory}
															onChange={handleCategoryChange}
															className="admin-catalog__form-input"
														>
															<option value="">--Select Category--</option>
															{categories.map((category) => (
																<option
																	key={category.id}
																	value={category.name}
																>
																	{category.name}
																</option>
															))}
														</select>
													</div>
												)}
												{selectedProductSource === "subcategory" && (
													<>
														<div className="admin-catalog__form-group">
															<label
																htmlFor="selectCategoryManual"
																className="admin-catalog__form-label"
															>
																Select Category
															</label>
															<select
																id="selectCategoryManual"
																value={selectedCategory}
																onChange={handleCategoryChange}
																className="admin-catalog__form-input"
															>
																<option value="">--Select Category--</option>
																{categories.map((category) => (
																	<option
																		key={category.id}
																		value={category.name}
																	>
																		{category.name}
																	</option>
																))}
															</select>
														</div>
														<div className="admin-catalog__form-group">
															<label
																htmlFor="selectSubcategoryManual"
																className="admin-catalog__form-label"
															>
																Select Subcategory
															</label>
															<select
																id="selectSubcategoryManual"
																value={selectedSubcategory}
																onChange={handleSubcategoryChange}
																className="admin-catalog__form-input"
															>
																<option value="">--Select Subcategory--</option>
																{getSubcategories().map((subcategory) => (
																	<option
																		key={subcategory.id}
																		value={subcategory.name}
																	>
																		{subcategory.name}
																	</option>
																))}
															</select>
														</div>
													</>
												)}

												{selectedProductSource === "deal" && (
													<div className="admin-catalog__form-group">
														<label
															htmlFor="selectDeal"
															className="admin-catalog__form-label"
														>
															Select Deals
														</label>
														<select
															id="selectDeal"
															value={selectedDeal}
															onChange={handleDealChange}
															className="admin-catalog__form-input"
														>
															<option value="">--Select Deal--</option>
															{deals.map((deal) => (
																<option
																	key={deal.id}
																	value={deal.name}
																>
																	{deal.name}
																</option>
															))}
														</select>
													</div>
												)}
											</div>
											<div className="buttons">
												<button
													type="button"
													className="btn btn-prev"
													onClick={prevStep}
												>
													Previous
												</button>
												<button
													className="btn btn-submit"
													onClick={handleSaveHomepageSection}
													disabled={
														!modalTitle ||
														!selectedProductSource ||
														(selectedProductSource === "manual" &&
															modalProductIds.length === 0) ||
														(selectedProductSource === "category" &&
															!selectedCategory) ||
														(selectedProductSource === "deal" &&
															!selectedDeal) ||
														(selectedProductSource === "subcategory" &&
															(!selectedCategory || !selectedSubcategory))
													}
												>
													{editingHomepage ? "Save" : "Create"}
												</button>
											</div>
										</div>
									)}
								</div>
							</Dialog.Content>
						</Dialog.Portal>
					</Dialog.Root>

					<Dialog.Root
						open={showDeleteModal}
						onOpenChange={setShowDeleteModal}
					>
						<Dialog.Portal>
							<Dialog.Overlay className="admin-catalog__modal-overlay" />
							<Dialog.Content className="admin-catalog__modal admin-catalog__modal--delete">
								<Dialog.Title className="admin-catalog__modal-title">
									Confirm Deletion
								</Dialog.Title>
								<Dialog.Close asChild>
									<button
										className="admin-catalog__modal-close"
										aria-label="Close"
									>
										<X size={24} />
									</button>
								</Dialog.Close>
								<div className="admin-catalog__modal-body">
									<p className="admin-catalog__modal-text">
										Are you sure you want to delete this homepage section? This
										action cannot be undone.
									</p>
								</div>
								<div className="admin-catalog__modal-actions">
									<button
										className="admin-catalog__button admin-catalog__button--cancel"
										onClick={() => {
											setShowDeleteModal(false);
											setSectionToDelete(null);
										}}
									>
										Cancel
									</button>
									<button
										className="admin-catalog__button admin-catalog__button--danger"
										onClick={() => {
											if (sectionToDelete) {
												handleDeleteHomepageSection(sectionToDelete);
											}
										}}
									>
										Delete
									</button>
								</div>
							</Dialog.Content>
						</Dialog.Portal>
					</Dialog.Root>
				</div>
			</div>
		</div>
	);
};

export default AdminCatalog;
