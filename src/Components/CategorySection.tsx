import React, { useEffect, useState, useRef, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import "../Styles/CategorySection.css"
import { useCategory } from "../context/Category"
import { fetchCategory } from "../api/category"
import { useQuery } from "@tanstack/react-query"
import type { Category } from "../context/Category"

interface CategorySectionProps {
  maxItemsToShow?: number
  showViewAll?: boolean
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  maxItemsToShow = 6, 
  showViewAll = true 
}) => {
  const [isCategoriesReady, setIsCategoriesReady] = useState(false)
  
  const categoryContext = useCategory()
  const updateCategoriesWithSubcategories = categoryContext?.updateCategoriesWithSubcategories
  const categories = categoryContext?.categories || []
  const navigate = useNavigate()
  const location = useLocation()

  // Carousel state and refs
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [isDragging, setIsDragging] = useState<{ [key: string]: boolean }>({})
  const [startX, setStartX] = useState<{ [key: string]: number }>({})
  const [scrollLeft, setScrollLeft] = useState<{ [key: string]: number }>({})

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

  // Carousel drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, categoryId: string) => {
    const carousel = carouselRefs.current[categoryId]
    if (!carousel) return

    setIsDragging(prev => ({ ...prev, [categoryId]: true }))
    setStartX(prev => ({ ...prev, [categoryId]: e.pageX - carousel.offsetLeft }))
    setScrollLeft(prev => ({ ...prev, [categoryId]: carousel.scrollLeft }))
    carousel.style.cursor = 'grabbing'
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent, categoryId: string) => {
    if (!isDragging[categoryId]) return

    e.preventDefault()
    const carousel = carouselRefs.current[categoryId]
    if (!carousel) return

    const x = e.pageX - carousel.offsetLeft
    const walk = (x - startX[categoryId]) * 2 // Scroll speed multiplier
    carousel.scrollLeft = scrollLeft[categoryId] - walk
  }, [isDragging, startX, scrollLeft])

  const handleMouseUp = useCallback((categoryId: string) => {
    setIsDragging(prev => ({ ...prev, [categoryId]: false }))
    const carousel = carouselRefs.current[categoryId]
    if (carousel) {
      carousel.style.cursor = 'grab'
    }
  }, [])

  const handleMouseLeave = useCallback((categoryId: string) => {
    setIsDragging(prev => ({ ...prev, [categoryId]: false }))
    const carousel = carouselRefs.current[categoryId]
    if (carousel) {
      carousel.style.cursor = 'grab'
    }
  }, [])

  // Prevent click when dragging
  const handleItemClick = useCallback((mainCategoryId: string, itemId: string, e: React.MouseEvent) => {
    if (isDragging[mainCategoryId]) {
      e.preventDefault()
      return
    }
    handleCategoryClick(mainCategoryId, itemId)
  }, [isDragging])

  // Enhanced category click handler to force navigation refresh
  const handleCategoryClick = (mainCategoryId: string, itemId: string) => {
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

  const handleViewAllClick = (categoryId: string) => {
    const newUrl = `/shop?categoryId=${categoryId}`
    navigate(newUrl)
  }

  // Navigation arrows
  const scrollCarousel = (categoryId: string, direction: 'left' | 'right') => {
    const carousel = carouselRefs.current[categoryId]
    if (!carousel) return

    const scrollAmount = 300 // Adjust scroll distance
    const newScrollLeft = direction === 'left' 
      ? carousel.scrollLeft - scrollAmount 
      : carousel.scrollLeft + scrollAmount

    carousel.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  // Skeleton loading component
  const SubcategorySkeleton = () => (
    <div className="category-section__subcategory-item category-section__subcategory-item--skeleton">
      <div className="category-section__subcategory-image-container">
        <div className="category-section__subcategory-image-skeleton skeleton"></div>
      </div>
      <div className="category-section__subcategory-name-skeleton skeleton-text"></div>
    </div>
  )

  if (showLoading) {
    return (
      <div className="category-section">
        {/* Skeleton for category sections */}
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div key={`section-skeleton-${sectionIndex}`} className="category-section__category">
            <div className="category-section__header">
              <div className="category-section__title-skeleton skeleton-text"></div>
              <div className="category-section__view-all-skeleton skeleton-text"></div>
            </div>
            <div className="category-section__carousel-container">
              <div className="category-section__subcategories category-section__subcategories--carousel">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SubcategorySkeleton key={`sub-skeleton-${sectionIndex}-${index}`} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="category-section">
      {/* Category sections with subcategories */}
      {categories.map((maincategory: Category) => (
        <div key={`section-${maincategory.id}`} className="category-section__category">
          <div className="category-section__header">
            <h2 className="category-section__title">{maincategory.name}</h2>
            {/* {showViewAll && (
              <button
                className="category-section__view-all"
                onClick={() => handleViewAllClick(maincategory.id)}
              >
                View All
              </button>
            )} */}
          </div>
          
          <div className="category-section__carousel-container">
            {/* Navigation arrows */}
            <button 
              className="category-section__nav-arrow category-section__nav-arrow--left"
              onClick={() => scrollCarousel(maincategory.id, 'left')}
              aria-label="Scroll left"
            >
              &#8249;
            </button>
            
            <div
              ref={el => carouselRefs.current[maincategory.id] = el}
              className="category-section__subcategories category-section__subcategories--carousel"
              onMouseDown={(e) => handleMouseDown(e, maincategory.id)}
              onMouseMove={(e) => handleMouseMove(e, maincategory.id)}
              onMouseUp={() => handleMouseUp(maincategory.id)}
              onMouseLeave={() => handleMouseLeave(maincategory.id)}
            >
              {maincategory.items.map((item) => (
                <div style={{
                  display:"flex",
                  flexDirection:"column",
                  gap:"10px",
                  justifyContent:"center",
                  alignItems:"center",
                  maxWidth:"280px"
                }}
>
                <div
                  key={`sub-${maincategory.id}-${item.id}`}
                  className="category-section__subcategory-item"
                  onClick={(e) => handleItemClick(maincategory.id, item.id, e)}
                >
                  <div className="category-section__subcategory-image-container">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="category-section__subcategory-image"
                      loading="lazy"
                      decoding="async"
                      draggable={false} // Prevent image dragging
                    />
                  </div>
                </div>
                  <p className="category-section__subcategory-name">{item.name}</p>
              </div>
              ))}
            </div>

            <button 
              className="category-section__nav-arrow category-section__nav-arrow--right"
              onClick={() => scrollCarousel(maincategory.id, 'right')}
              aria-label="Scroll right"
            >
              &#8250;
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CategorySection