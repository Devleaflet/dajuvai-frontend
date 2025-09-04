"use client";

import React, { useRef, useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import keyboard from "../assets/keyboard.png";
import "../Styles/CategorySlider.css";
import { useCategory } from "../context/Category";
import { fetchCategory } from "../api/category";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "../context/Category";

const CategorySlider: React.FC = () => {
	const sliderRef = useRef<HTMLDivElement | null>(null);
	const [showPrev, setShowPrev] = useState<boolean>(false);
	const [showNext, setShowNext] = useState<boolean>(true);
	const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768);
	const [isCategoriesReady, setIsCategoriesReady] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);
	const [dragDistance, setDragDistance] = useState(0);

	const categoryContext = useCategory();
	const updateCategoriesWithSubcategories =
		categoryContext?.updateCategoriesWithSubcategories;
	const categories = categoryContext?.categories || [];
	const navigate = useNavigate();
	const location = useLocation();

	const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
		queryKey: ["cat"],
		queryFn: fetchCategory,
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	useEffect(() => {
		if (categories) {
			categories.forEach((maincategory) => {
				maincategory.items.forEach((item) => {
					if (item.image) {
						const img = new Image();
						img.src = item.image;
					}
				});
			});
		}
	}, [categories]);

	useEffect(() => {
		console.log("🔄 CategorySlider: categoryData changed:", categoryData);
		console.log(
			"🔄 CategorySlider: updateCategoriesWithSubcategories available:",
			!!updateCategoriesWithSubcategories
		);
		if (updateCategoriesWithSubcategories && categoryData) {
			console.log("📊 CategorySlider: Processing category data...");
			updateCategoriesWithSubcategories(categoryData).then(() => {
				console.log("✅ CategorySlider: Categories ready!");
				setIsCategoriesReady(true);
			});
		}
	}, [categoryData, updateCategoriesWithSubcategories]);

	const showLoading = isCategoryLoading || !isCategoriesReady;

	console.log("🎯 CategorySlider render state:", {
		isCategoryLoading,
		isCategoriesReady,
		showLoading,
		categoriesCount: categories.length,
		totalSubcategories: categories.reduce(
			(total, cat) => total + cat.items.length,
			0
		),
	});

	useEffect(() => {
		const prefetchCategories = async () => {
			try {
				await fetchCategory();
			} catch (error) {
				console.error("Error prefetching categories:", error);
			}
		};
		prefetchCategories();
	}, []);

	useEffect(() => {
		if (!showLoading && categories.length > 0) {
			setTimeout(() => {
				checkScroll();
			}, 100);
		}
	}, [showLoading, categories.length]);

	const handleCategoryClick = (mainCategoryId: string, itemId: string) => {
		if (Math.abs(dragDistance) > 5) {
			return;
		}

		const newUrl = `/shop?categoryId=${mainCategoryId}&subcategoryId=${itemId}`;

		if (location.pathname === "/shop") {
			navigate(newUrl, { replace: true });

			const event = new CustomEvent("shopFiltersChanged", {
				detail: {
					categoryId: Number(mainCategoryId),
					subcategoryId: Number(itemId),
				},
			});

			setTimeout(() => {
				window.dispatchEvent(event);
			}, 10);
		} else {
			navigate(newUrl);
		}
	};

	const scroll = (direction: "left" | "right"): void => {
		const slider = sliderRef.current;
		if (!slider) return;

		const scrollAmount =
			direction === "left"
				? slider.scrollLeft - slider.offsetWidth
				: slider.scrollLeft + slider.offsetWidth;

		slider.scrollTo({
			left: scrollAmount,
			behavior: "smooth",
		});
	};

	const checkScroll = () => {
		const slider = sliderRef.current;
		if (!slider) return;

		setShowPrev(slider.scrollLeft > 0);
		setShowNext(
			slider.scrollLeft < slider.scrollWidth - slider.clientWidth - 10
		);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		const slider = sliderRef.current;
		if (!slider) return;

		setIsDragging(true);
		setStartX(e.pageX - slider.offsetLeft);
		setScrollLeft(slider.scrollLeft);
		setDragDistance(0);
		slider.style.cursor = "grabbing";
		slider.style.userSelect = "none";
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;

		e.preventDefault();
		const slider = sliderRef.current;
		if (!slider) return;

		const x = e.pageX - slider.offsetLeft;
		const walk = (x - startX) * 2;
		const newScrollLeft = scrollLeft - walk;

		setDragDistance(Math.abs(walk));
		slider.scrollLeft = newScrollLeft;
	};

	const handleMouseUp = () => {
		const slider = sliderRef.current;
		if (!slider) return;

		setIsDragging(false);
		slider.style.cursor = "grab";
		slider.style.userSelect = "";

		setTimeout(() => setDragDistance(0), 100);
	};

	const handleMouseLeave = () => {
		if (isDragging) {
			handleMouseUp();
		}
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		const slider = sliderRef.current;
		if (!slider) return;

		setIsDragging(true);
		setStartX(e.touches[0].pageX - slider.offsetLeft);
		setScrollLeft(slider.scrollLeft);
		setDragDistance(0);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (!isDragging) return;

		const slider = sliderRef.current;
		if (!slider) return;

		const x = e.touches[0].pageX - slider.offsetLeft;
		const walk = (x - startX) * 1.5;
		const newScrollLeft = scrollLeft - walk;

		setDragDistance(Math.abs(walk));
		slider.scrollLeft = newScrollLeft;
	};

	const handleTouchEnd = () => {
		setIsDragging(false);

		setTimeout(() => setDragDistance(0), 100);
	};

	useEffect(() => {
		const handleResize = () => {
			setIsDesktop(window.innerWidth >= 768);
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const CategorySkeleton = () => (
		<div className="top-category__card top-category__card--skeleton">
			<div className="top-category__image-container">
				<div className="top-category__image-skeleton skeleton"></div>
			</div>
			<div className="top-category__name-skeleton skeleton-text"></div>
		</div>
	);

	return (
		<div className="top-category">
			{isDesktop && showPrev && (
				<button
					className="top-category__nav top-category__nav--prev"
					onClick={() => scroll("left")}
				>
					<ArrowLeft />
				</button>
			)}
			{isDesktop && showNext && (
				<button
					className="top-category__nav top-category__nav--next"
					onClick={() => scroll("right")}
				>
					<ArrowRight />
				</button>
			)}

			<div
				className="top-category__slider-container"
				ref={sliderRef}
				onScroll={checkScroll}
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleMouseUp}
				onMouseLeave={handleMouseLeave}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleTouchEnd}
				style={{ cursor: isDragging ? "grabbing" : "grab" }}
			>
				{showLoading ? (
					Array.from({ length: 8 }).map((_, index) => (
						<CategorySkeleton key={`skeleton-${index}`} />
					))
				) : categories.length === 0 ? (
					<div
						style={{
							padding: "2rem",
							textAlign: "center",
							color: "#666",
						}}
					>
						No categories available
					</div>
				) : (
					categories.map((maincategory: Category) => (
						<React.Fragment key={maincategory.id}>
							{maincategory.items.map((item) => {
								console.log(
									"🏷️ Rendering subcategory:",
									item.name,
									"from category:",
									maincategory.name
								);
								return (
									<div
										key={item.id}
										className="top-category__card"
										style={{ cursor: "pointer" }}
										onClick={() =>
											handleCategoryClick(maincategory.id, item.id)
										}
									>
										<div className="top-category__image-container">
											<img
												src={item.image || keyboard}
												alt={item.name}
												className="top-category__image"
												loading="lazy"
												decoding="async"
												width="200"
												height="200"
												draggable={false}
											/>
										</div>
										<p className="top-category__name">{item.name}</p>
									</div>
								);
							})}
						</React.Fragment>
					))
				)}
			</div>
		</div>
	);
};

export default CategorySlider;
