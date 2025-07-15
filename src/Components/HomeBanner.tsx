import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";
import "../Styles/HomeBanner.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Banner {
  id: number;
  name: string;
  type: string;
  status: string;
  image: string;
  startDate?: string;
  endDate?: string;
}

const HomeBanner: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch banners");
      }

      const data = await response.json();
      console.log("Raw banner data:", data);
      // Filter only active hero banners
      const activeBanners = data.data.filter(
        (banner: Banner) =>
          banner.status === "ACTIVE" &&
          banner.type === "HERO" &&
          (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
          (!banner.endDate || new Date(banner.endDate) >= new Date())
      );
      console.log("Filtered active banners:", activeBanners);
      setBanners(activeBanners);
    } catch (err) {
      setError("Failed to load banners");
      console.error("Error fetching banners:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const handleBannerClick = (e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();

    console.log("HomeBanner clicked!");
    const currentBanner = banners[currentIndex];
    console.log("Current banner:", currentBanner);
    console.log("Current index:", currentIndex);
    console.log("Total banners:", banners.length);

    if (currentBanner && currentBanner.name) {
      // Navigate to shop page with banner name as search parameter
      const searchQuery = encodeURIComponent(currentBanner.name);
      console.log("Navigating to:", `/shop?search=${searchQuery}`);
      navigate(`/shop?search=${searchQuery}`);
    } else {
      console.log("No banner name found or banner is null");
      // Fallback: navigate to shop without search
      navigate("/shop");
    }
  };

  const handleNavButtonClick = (
    e: React.MouseEvent,
    action: "prev" | "next"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (action === "prev") {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  const handleIndicatorClick = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  if (loading) {
    return (
      <div className="home-banner">
        <div className="home-banner__container">
          <div className="home-banner__content">
            <div className="home-banner__skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || banners.length === 0) {
    return null;
  }

  return (
    <div className="home-banner">
      <div className="home-banner__container">
        <div
          className="home-banner__content"
          onClick={handleBannerClick}
          style={{ cursor: "pointer" }}
        >
          {banners.length > 1 && (
            <>
              <button
                className="home-banner__nav-button home-banner__nav-button--prev"
                onClick={(e) => handleNavButtonClick(e, "prev")}
                aria-label="Previous banner"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="home-banner__nav-button home-banner__nav-button--next"
                onClick={(e) => handleNavButtonClick(e, "next")}
                aria-label="Next banner"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
          <img
            src={banners[currentIndex].image}
            alt={banners[currentIndex].name}
            className="home-banner__image"
            style={{ cursor: "pointer", width: "100%", height: "auto" }}
          />
          {banners.length > 1 && (
            <div className="home-banner__indicators">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`home-banner__indicator ${
                    index === currentIndex ? "active" : ""
                  }`}
                  onClick={(e) => handleIndicatorClick(e, index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default HomeBanner;
