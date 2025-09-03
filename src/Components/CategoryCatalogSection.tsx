import React, { useEffect, useState } from "react";
import { fetchCategoryCatalog } from "../api/categoryCatalog";

interface Subcategory {
	id: number;
	name: string;
	image: string;
}

interface Category {
	category: {
		id: number;
		name: string;
		image: string;
		subcategories: Subcategory[];
	};
}

const CategoryCatalogSection: React.FC = () => {
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadCategories = async () => {
			try {
				console.log("Fetching category catalog...");
				const data = await fetchCategoryCatalog();
				console.log("Raw data from fetchCategoryCatalog:", data);
				// Ensure data is an array and transform if needed
				const processedCategories = Array.isArray(data) ? data : [];
				setCategories(processedCategories);
				console.log("Processed categories state:", processedCategories);
				console.log(
					"Subcategories",
					processedCategories.flatMap((cat) => cat.category.subcategories)
				);
			} catch (err) {
				console.error("Error fetching category catalog:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
			} finally {
				console.log("Loading state set to false");
				setLoading(false);
			}
		};
		loadCategories();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<div>
			{categories.map((category) => (
				<div key={category.category.id}>
					<h2>{category.category.name}</h2>
					<img
						src={category.category.image}
						alt={category.category.name}
						style={{ maxWidth: "200px" }}
						onError={(e) => console.log("Category image failed to load:", e)}
					/>
					<div>
						{category?.category.subcategories ? (
							category.category.subcategories.map((item) => {
								console.log("Rendering subcategory:", item);
								return (
									<div key={item.id}>
										<img
											src={item.image}
											alt={item.name}
											style={{ maxWidth: "200px" }}
											onError={(e) =>
												console.log(
													"Subcategory image failed to load:",
													e,
													item.name
												)
											}
										/>
										<p>{item.name}</p>
									</div>
								);
							})
						) : (
							<p>No subcategories available</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
};

export default CategoryCatalogSection;
