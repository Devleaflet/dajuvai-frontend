"use client"

import React, { useRef, useState, useEffect } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import keyboard from "../assets/keyboard.png"
import "../Styles/CategorySlider.css"
import { useCategory } from "../context/Category"
import { fetchCategory } from "../api/category"
import { useQuery } from "@tanstack/react-query"
import type { Category } from "../context/Category"

const CategorySlider: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [showPrev, setShowPrev] = useState<boolean>(false)
  const [showNext, setShowNext] = useState<boolean>(true)
  const [isDesktop, setIsDesktop] = useState<boolean>(window.innerWidth >= 768)
  const [isCategoriesReady, setIsCategoriesReady] = useState(false)

  // Drag functionality state
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [dragDistance, setDragDistance] = useState(0)

  const categoryContext = useCategory()
  const updateCategoriesWithSubcategories = categoryContext?.updateCategoriesWithSubcategories
  const categories = categoryContext?.categories || []
  const navigate = useNavigate()
  const location = useLocation()

  // Optimize category fetching with React Query
  const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["cat"],
    queryFn: fetchCategory,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Preload images for better performance
  useEffect(() => {
    if (categories) {
      categories.forEach((maincategory) => {
        maincategory.items.forEach((item) => {
          if (item.image) {
            const img = new Image()
            img.src = item.image
          }
        })
      })
    }
  }, [categories])

  useEffect(() => {
    if (updateCategoriesWithSubcategories && categoryData) {
      updateCategoriesWithSubcategories(categoryData).then(() => {
        setIsCategoriesReady(true)
      })
    }
  }, [categoryData, updateCategoriesWithSubcategories])

  // Show loading state if either fetching or processing categories
  const showLoading = isCategoryLoading || !isCategoriesReady

  // Prefetch categories on component mount
  useEffect(() => {
    const prefetchCategories = async () => {
      try {
        await fetchCategory()
      } catch (error) {
        console.error("Error prefetching categories:", error)
      }
    }
    prefetchCategories()
  }, [])

  // Enhanced category click handler to force navigation refresh
  const handleCategoryClick = (mainCategoryId: string, itemId: string) => {
    // Prevent navigation if user was dragging
    if (Math.abs(dragDistance) > 5) {
      return
    }

    const newUrl = `/shop?categoryId=${mainCategoryId}&subcategoryId=${itemId}`

    // If already on shop page, dispatch a custom event to update filters
    if (location.pathname === "/shop") {
      // Update the URL first
      navigate(newUrl, { replace: true })

      // Then dispatch a custom event that the shop page will listen to
      const event = new CustomEvent("shopFiltersChanged", {
        detail: {
          categoryId: Number(mainCategoryId),
          subcategoryId: Number(itemId),
        },
      })

      // Dispatch the event after a small delay to ensure URL is updated
      setTimeout(() => {
        window.dispatchEvent(event)
      }, 10)
    } else {
      // Normal navigation when coming from other pages
      navigate(newUrl)
    }
  }

  const scroll = (direction: "left" | "right"): void => {
    const slider = sliderRef.current
    if (!slider) return

    const scrollAmount =
      direction === "left" ? slider.scrollLeft - slider.offsetWidth : slider.scrollLeft + slider.offsetWidth

    slider.scrollTo({
      left: scrollAmount,
      behavior: "smooth",
    })
  }

  const checkScroll = () => {
    const slider = sliderRef.current
    if (!slider) return

    setShowPrev(slider.scrollLeft > 0)
    setShowNext(slider.scrollLeft < slider.scrollWidth - slider.clientWidth - 10)
  }

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const slider = sliderRef.current
    if (!slider) return

    setIsDragging(true)
    setStartX(e.pageX - slider.offsetLeft)
    setScrollLeft(slider.scrollLeft)
    setDragDistance(0)
    slider.style.cursor = 'grabbing'
    slider.style.userSelect = 'none'
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    
    e.preventDefault()
    const slider = sliderRef.current
    if (!slider) return

    const x = e.pageX - slider.offsetLeft
    const walk = (x - startX) * 2 // Multiply by 2 for faster scrolling
    const newScrollLeft = scrollLeft - walk
    
    setDragDistance(Math.abs(walk))
    slider.scrollLeft = newScrollLeft
  }

  const handleMouseUp = () => {
    const slider = sliderRef.current
    if (!slider) return

    setIsDragging(false)
    slider.style.cursor = 'grab'
    slider.style.userSelect = ''
    
    // Reset drag distance after a short delay
    setTimeout(() => setDragDistance(0), 100)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp()
    }
  }

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    const slider = sliderRef.current
    if (!slider) return

    setIsDragging(true)
    setStartX(e.touches[0].pageX - slider.offsetLeft)
    setScrollLeft(slider.scrollLeft)
    setDragDistance(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    const slider = sliderRef.current
    if (!slider) return

    const x = e.touches[0].pageX - slider.offsetLeft
    const walk = (x - startX) * 1.5
    const newScrollLeft = scrollLeft - walk
    
    setDragDistance(Math.abs(walk))
    slider.scrollLeft = newScrollLeft
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    // Reset drag distance after a short delay
    setTimeout(() => setDragDistance(0), 100)
  }

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Skeleton loading component with consistent sizing
  const CategorySkeleton = () => (
    <div className="top-category__card top-category__card--skeleton">
      <div className="top-category__image-container">
        <div className="top-category__image-skeleton skeleton"></div>
      </div>
      <div className="top-category__name-skeleton skeleton-text"></div>
    </div>
  )

  return (
    <div className="top-category">
      {/* Show arrows only on desktop and when not loading */}
      {isDesktop && showPrev && !showLoading && (
        <button className="top-category__nav top-category__nav--prev" onClick={() => scroll("left")}>
          <ArrowLeft size={40} />
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
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {showLoading
          ? // Show skeleton loading state with consistent count
            Array.from({ length: 8 }).map((_, index) => <CategorySkeleton key={`skeleton-${index}`} />)
          : categories.map((maincategory: Category) => (
              <React.Fragment key={maincategory.id}>
                {maincategory.items.map((item) => (
                  <div
                    key={item.id}
                    className="top-category__card"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleCategoryClick(maincategory.id, item.id)}
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
                ))}
              </React.Fragment>
            ))}
      </div>

      {isDesktop && showNext && !showLoading && (
        <button className="top-category__nav top-category__nav--next" onClick={() => scroll("right")}>
          <ArrowRight size={40} />
        </button>
      )}
    </div>
  )
}

export default CategorySlider