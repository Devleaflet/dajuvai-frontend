import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../Components/Navbar";
import CategorySlider from "../Components/CategorySlider";
import HomepageSections from "../Components/HomepageSections";
import Footer from "../Components/Footer";
import HeroSlider from "../Components/HeroSlider";
import PageLoader from "../Components/PageLoader";
import { useQuery } from "@tanstack/react-query";
import { fetchCategory } from "../api/category";
import SpecialOffers from "../Components/SpecialOffers";
import CategoryCatalogSection from "../Components/CategoryCatalogSection";

const Home = () => {
	const [searchParams] = useSearchParams();

	// Handle search parameter from URL (e.g., from banner clicks)
	useEffect(() => {
		const searchParam = searchParams.get("search");
		if (searchParam) {
			const decodedSearch = decodeURIComponent(searchParam);
			//("🏠 Home page received search parameter:", decodedSearch);

			// Set the search query in the Navbar by dispatching a custom event
			window.dispatchEvent(
				new CustomEvent("setNavbarSearch", {
					detail: { searchQuery: decodedSearch },
				})
			);
		}
	}, [searchParams]);

	// Optimize category fetching with React Query
	const { isLoading: isCategoryLoading } = useQuery({
		queryKey: ["cat"],
		queryFn: fetchCategory,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 30 * 60 * 1000, // 30 minutes
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	if (isCategoryLoading) {
		return <PageLoader />;
	}

	return (
		<div style={{ zIndex: "0" }}>
			<Navbar />
			<HeroSlider />
			<CategorySlider />
			<HomepageSections />
			<SpecialOffers />
			{/* <CategorySection maxItemsToShow={8} /> */}
			<CategoryCatalogSection />
			<Footer />
		</div>
	);
};

export default Home;
