// CategorySlider.tsx
"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../Styles/CategorySlider.css";
import { mapToNavCategories } from "../context/Category";
import { fetchPlacementCategories, PLACEMENTS } from "../api/placements";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "../context/Category";
import { cloudinaryUrl } from "../utils/cloudinaryImage";

const SKELETON_COUNT = 10;
const CLICK_THRESHOLD = 4;

// ─── Skeletons ────────────────────────────────────────────────────────────────
const CategorySkeleton: React.FC = React.memo(() => (
  <div className="cs-card cs-card--skeleton" aria-hidden="true">
    <div className="cs-image-wrap">
      <div className="cs-skeleton cs-skeleton--circle" />
    </div>
    <div className="cs-skeleton cs-skeleton--text" />
  </div>
));
CategorySkeleton.displayName = "CategorySkeleton";

// ─── Image ────────────────────────────────────────────────────────────────────
const CategoryImage: React.FC<{ src?: string; name: string }> = React.memo(
  ({ src, name }) => {
    const [error, setError] = useState(false);
    if (!src || error) {
      return (
        <div className="cs-image-fallback" role="img" aria-label={name}>
          <span>{name?.charAt(0)?.toUpperCase() ?? "?"}</span>
        </div>
      );
    }
    return (
      <img
        src={cloudinaryUrl(src, "thumbnail")}
        alt={name}
        className="cs-image"
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setError(true)}
      />
    );
  },
);
CategoryImage.displayName = "CategoryImage";

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CategoryCardProps {
  item: { id: string; name: string; image?: string };
  mainCategoryId: string;
  onClick: (mainCategoryId: string, itemId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = React.memo(
  ({ item, mainCategoryId, onClick }) => (
    <button
      className="cs-card"
      onClick={() => onClick(mainCategoryId, item.id)}
      data-main-category-id={mainCategoryId}
      data-item-id={item.id}
      type="button"
      aria-label={`Browse ${item.name}`}
    >
      <div className="cs-image-wrap">
        <CategoryImage src={item.image} name={item.name} />
      </div>
      <span className="cs-name">{item.name}</span>
    </button>
  ),
);
CategoryCard.displayName = "CategoryCard";

// ─── Slider ───────────────────────────────────────────────────────────────────
const CategorySlider: React.FC = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Nav button visibility
  const [navState, setNavState] = useState({ showPrev: false, showNext: true });
  const navRafRef = useRef<number>(0);

  // Desktop flag (nav buttons only on desktop)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // ── Drag state (all mutable, never triggers re-render) ────────────────────
  const drag = useRef({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false, // true once pointer moves past threshold
    suppressClick: false, // suppress card onClick after a real drag
  });

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: categoryData, isLoading } = useQuery({
    queryKey: ["placement", PLACEMENTS.CATEGORY_GRID],
    queryFn: () => fetchPlacementCategories(PLACEMENTS.CATEGORY_GRID),
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  useEffect(() => {
    if (categoryData) setCategories(mapToNavCategories(categoryData));
  }, [categoryData]);

  const showLoading = isLoading || categories.length === 0;

  const flatItems = useMemo(
    () =>
      categories.flatMap((cat) =>
        cat.items.map((item) => ({
          ...item,
          id: String(item.id),
          mainCategoryId: String(cat.id),
        })),
      ),
    [categories],
  );

  // ── Nav state ─────────────────────────────────────────────────────────────
  const updateNav = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 1;
    setNavState({
      showPrev: overflow && scrollLeft > 1,
      showNext: overflow && scrollLeft < scrollWidth - clientWidth - 1,
    });
  }, []);

  const scheduleNav = useCallback(() => {
    cancelAnimationFrame(navRafRef.current);
    navRafRef.current = requestAnimationFrame(updateNav);
  }, [updateNav]);

  // ── Resize observer ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const ro = new ResizeObserver(scheduleNav);
    ro.observe(el);
    scheduleNav();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(navRafRef.current);
    };
  }, [scheduleNav, flatItems.length]);

  // ── Scroll listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener("scroll", scheduleNav, { passive: true });
    return () => el.removeEventListener("scroll", scheduleNav);
  }, [scheduleNav]);

  // ── Media query ───────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // ── Arrow scroll ──────────────────────────────────────────────────────────
  const arrowScroll = useCallback((dir: "left" | "right") => {
    const el = sliderRef.current;
    if (!el) return;

    // Read card width from DOM once
    const card = el.querySelector<HTMLElement>(
      ".cs-card:not(.cs-card--skeleton)",
    );
    if (!card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap || "0");
    const step = card.offsetWidth + gap;
    const visible = Math.max(1, Math.floor(el.clientWidth / step));
    const jump = step * Math.max(1, visible - 1);
    const max = el.scrollWidth - el.clientWidth;
    const target = Math.max(
      0,
      Math.min(max, el.scrollLeft + (dir === "right" ? jump : -jump)),
    );

    el.scrollTo({ left: target, behavior: "smooth" });
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToCategory = useCallback(
    (mainCategoryId: string, itemId: string) => {
      const categoryId = Number(mainCategoryId);
      const subcategoryId = Number(itemId);

      if (!Number.isFinite(categoryId) || !Number.isFinite(subcategoryId)) {
        return;
      }

      const params = new URLSearchParams({
        categoryId: String(categoryId),
        subcategoryId: String(subcategoryId),
      });
      const url = `/shop?${params.toString()}`;

      if (location.pathname === "/shop") {
        // Update React Router's location and notify the already-mounted shop
        // page immediately, matching the mega-menu filtering behaviour.
        navigate(url);
        window.dispatchEvent(
          new CustomEvent("shopFiltersChanged", {
            detail: { categoryId, subcategoryId },
          }),
        );
        return;
      }

      navigate(url);
    },
    [location.pathname, navigate],
  );

  const handleCardClick = useCallback(
    (mainCategoryId: string, itemId: string) => {
      if (drag.current.suppressClick) return;
      goToCategory(mainCategoryId, itemId);
    },
    [goToCategory],
  );

  // ── Pointer handlers ──────────────────────────────────────────────────────
  // Strategy: on desktop (mouse/trackpad) we manually scroll so we get the
  // grab-and-drag feel. On touch devices we do NOTHING — we let the browser's
  // native touch scroll handle everything (it's already perfect).
  //
  // This means:
  //   - Touch: 100% native, zero JS interference, OS-level momentum & bounce
  //   - Mouse/trackpad drag: JS-driven, direct 1:1 tracking
  //   - Click vs drag: suppressed by moved flag

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only handle mouse/pen; leave touch to native scroll
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;

    const el = sliderRef.current;
    if (!el) return;

    drag.current = {
      active: true,
      startX: e.clientX,
      startScrollLeft: el.scrollLeft,
      moved: false,
      suppressClick: false,
    };

    // Do not capture yet. Capturing on pointerdown redirects pointerup away
    // from the card button and can prevent an ordinary click from firing.
    // Capture only after movement proves this is a drag.
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const d = drag.current;
    if (!d.active) return;

    const el = sliderRef.current;
    if (!el) return;

    const dx = e.clientX - d.startX;

    if (!d.moved && Math.abs(dx) > CLICK_THRESHOLD) {
      d.moved = true;
      d.suppressClick = true;

      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* Pointer may already have been released. */
      }

      el.classList.add("cs-slider--dragging");
      e.preventDefault();
    }

    if (d.moved) {
      // Direct assignment — no rAF needed here because this IS inside the
      // browser's input handling pipeline and the compositor will pick it up
      // at the next frame automatically. Adding rAF introduces a frame of lag.
      const max = el.scrollWidth - el.clientWidth;
      el.scrollLeft = Math.max(0, Math.min(max, d.startScrollLeft - dx));
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const d = drag.current;
    if (!d.active) return;

    const el = sliderRef.current;
    if (!el) return;

    d.active = false;
    d.suppressClick = d.moved;
    el.classList.remove("cs-slider--dragging");

    if (el.hasPointerCapture(e.pointerId)) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* Pointer capture may already be gone. */
      }
    }

    if (d.moved) {
      // Snap to nearest card after drag release
      const card = el.querySelector<HTMLElement>(
        ".cs-card:not(.cs-card--skeleton)",
      );
      if (card) {
        const gap = parseFloat(getComputedStyle(el).columnGap || "0");
        const step = card.offsetWidth + gap;
        const max = el.scrollWidth - el.clientWidth;
        const snapped = Math.max(
          0,
          Math.min(max, Math.round(el.scrollLeft / step) * step),
        );
        el.scrollTo({ left: snapped, behavior: "smooth" });
      }
    }

    // Allow clicks again after a brief window so the pointerup→click
    // sequence from a genuine tap doesn't get swallowed.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        d.suppressClick = false;
      });
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="cs-wrapper" aria-label="Category navigation">
      {isDesktop && navState.showPrev && (
        <button
          className="cs-nav cs-nav--prev"
          onClick={() => arrowScroll("left")}
          aria-label="Scroll categories left"
          type="button"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
      )}
      {isDesktop && navState.showNext && (
        <button
          className="cs-nav cs-nav--next"
          onClick={() => arrowScroll("right")}
          aria-label="Scroll categories right"
          type="button"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      )}

      <div
        className="cs-slider"
        ref={sliderRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {showLoading ? (
          Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <CategorySkeleton key={i} />
          ))
        ) : flatItems.length === 0 ? (
          <div className="cs-empty">No categories available</div>
        ) : (
          flatItems.map((item) => (
            <CategoryCard
              key={item.id}
              item={item}
              mainCategoryId={item.mainCategoryId}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default CategorySlider;
