import  { useState, useEffect, useCallback } from "react";
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

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [searchParams] = useSearchParams();

  // Handle search parameter from URL (e.g., from banner clicks)
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam) {
      const decodedSearch = decodeURIComponent(searchParam);
      console.log('🏠 Home page received search parameter:', decodedSearch);
      
      // Set the search query in the Navbar by dispatching a custom event
      window.dispatchEvent(new CustomEvent('setNavbarSearch', {
        detail: { searchQuery: decodedSearch }
      }));
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

  // Memoized function to check if all images are loaded
  const checkImagesLoaded = useCallback(() => {
    const images = document.querySelectorAll('img');
    const allLoaded = Array.from(images).every(img => img.complete);
    if (allLoaded) {
      setImagesLoaded(true);
    }
  }, []);

  // Track when all content is loaded
  useEffect(() => {
    // Initial check
    checkImagesLoaded();

    // Set up image load listeners
    const images = document.querySelectorAll('img');
    const imageLoadPromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve; // Resolve even on error to not block loading
      });
    });

    // Wait for all images to load
    Promise.all(imageLoadPromises).then(() => {
      setImagesLoaded(true);
    });

    // Cleanup function
    return () => {
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [checkImagesLoaded]);

  // Handle final loading state
  useEffect(() => {
    if (imagesLoaded && !isCategoryLoading) {
      // Use requestAnimationFrame for smooth transition
      requestAnimationFrame(() => {
        setIsLoading(false);
      });
    }
  }, [imagesLoaded, isCategoryLoading]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Navbar />
      <HeroSlider />
      <CategorySlider />
      <HomepageSections />
      <SpecialOffers />
      <Footer />
    </>
  );
};

export default Home;
