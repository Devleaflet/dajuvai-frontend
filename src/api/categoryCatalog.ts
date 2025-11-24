import axios from "axios";

export const fetchCategoryCatalog = async () => {
	try {
		//"🌐 Fetching categories from /api/home/category/section...");
		const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
		const response = await axios.get(`${apiBaseUrl}/api/home/category/section`);
		//"📦 Raw API response:", response.data);

		// Handle the response structure based on API documentation
		if (response.data && response.data.success && response.data.data) {
			
			return response.data.data;
		} else {
			console.warn("⚠️ Unexpected response structure:", response.data);
			return response.data.data || response.data || [];
		}
	} catch (error: any) {
		console.error("❌ Failed to fetch categories:", error.message);
		throw new Error(`Failed to fetch categories: ${error.message}`);
	}
};
