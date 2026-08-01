import { useCallback, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "daju-scroll-positions-v1";
// How long a restore keeps retrying while async content is still filling in
// (skeletons swapping for real cards, images settling). The loop is cheap and
// self-terminating: it stops the moment the target is reachable, the deadline
// passes, or the visitor scrolls.
const RESTORE_DEADLINE_MS = 1200;

const readPositions = (): Record<string, number> => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
};

// Scrolls to `target`, re-applying the offset each frame while the page is
// still growing so a saved deep position isn't lost to a briefly-short page.
// Returns a cleanup that cancels the loop.
const restoreScroll = (target: number): (() => void) => {
  if (target <= 0) {
    window.scrollTo(0, 0);
    return () => {};
  }

  let cancelled = false;
  let applied = -1;
  const deadline = performance.now() + RESTORE_DEADLINE_MS;

  const cleanup = () => {
    cancelled = true;
  };

  const step = () => {
    if (cancelled) return;
    if (performance.now() > deadline) {
      cleanup();
      return;
    }
    // A real user scroll moves the page off the offset we applied — the
    // visitor has taken over, so hand control back.
    if (applied !== -1 && window.scrollY !== applied) {
      cleanup();
      return;
    }
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const landing = Math.min(target, maxScroll);
    if (landing !== applied) {
      applied = landing;
      window.scrollTo(0, landing);
    }
    if (landing >= target) {
      cleanup();
      return;
    }
    requestAnimationFrame(step);
  };

  // The first attempt is synchronous so the restored offset paints on the very
  // first frame instead of flashing the page top; the loop only continues if
  // the page was not yet tall enough for the saved offset.
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  applied = Math.min(target, maxScroll);
  window.scrollTo(0, applied);
  if (applied < target) requestAnimationFrame(step);

  return cleanup;
};

// Owns every cross-page scroll (the same responsibilities as react-router's
// <ScrollRestoration>, implemented for the app's <BrowserRouter>):
//   - PUSH (link click, submit, redirect): start at the top.
//   - POP (back/forward): restore the offset saved for that history entry,
//     falling back to the top when nothing was recorded.
//   - Same-path PUSH/REPLACE (pagination, search params, filters): keep the
//     viewport and carry its offset onto the new history entry.
// Offsets are keyed by react-router's location key, recorded continuously via a
// requestAnimationFrame-throttled scroll listener, and persisted to
// sessionStorage so they survive reloads.
const ScrollManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const currentKeyRef = useRef(location.key);
  const pathnameRef = useRef(location.pathname);
  const positionsRef = useRef<Record<string, number>>(readPositions());

  const persist = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positionsRef.current));
    } catch {
      // Storage unavailable (private mode / quota) — best-effort only.
    }
  }, []);

  // Take over from the browser's native scroll restoration so every jump is
  // ours to make.
  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Record the current page's offset as the visitor scrolls.
  useLayoutEffect(() => {
    let frame: number | null = null;
    const onScroll = () => {
      // Scroll-locked modals fix the body and zero window.scrollY; their
      // offsets are handled by the lock itself, so ignore them here.
      if (document.body.style.position === "fixed") return;
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        positionsRef.current[currentKeyRef.current] = window.scrollY;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  // Persist positions when the tab is hidden or reloaded.
  useLayoutEffect(() => {
    window.addEventListener("pagehide", persist);
    return () => window.removeEventListener("pagehide", persist);
  }, [persist]);

  // React to navigation. Runs before paint so a restored offset shows on the
  // first frame instead of flashing the page top.
  useLayoutEffect(() => {
    if (currentKeyRef.current === location.key) return;

    const previousKey = currentKeyRef.current;
    const isSamePage = pathnameRef.current === location.pathname;
    currentKeyRef.current = location.key;

    // The outgoing page's offset is whatever the scroll listener last recorded
    // for `previousKey`. Reading window.scrollY here would be wrong: by the
    // time this layout effect runs the new route's DOM is already committed, so
    // scrollY is clamped to the new page's height and would corrupt the saved
    // position (React Router's own <ScrollRestoration> relies on its scroll
    // listener the same way and never overwrites here).

    if (isSamePage) {
      // Query/hash state updates are not page navigation. Catalog filters,
      // search, sorting, pagination, tabs, and other same-route controls may
      // use either PUSH or REPLACE; both preserve the current viewport.
      // Carry the prior entry's saved offset to the new entry and retry while
      // asynchronous content settles.
      const offset = positionsRef.current[previousKey] ?? window.scrollY;
      pathnameRef.current = location.pathname;
      positionsRef.current[location.key] = offset;
      persist();
      return restoreScroll(offset);
    } else {
      pathnameRef.current = location.pathname;
      if (navigationType === "POP") {
        const saved = positionsRef.current[location.key];
        if (typeof saved === "number") {
          persist();
          return restoreScroll(saved);
        }
        window.scrollTo(0, 0);
      } else {
        // PUSH, or a REPLACE that changed pages — fresh content, top of page.
        window.scrollTo(0, 0);
      }
    }
    persist();
  }, [location.key, location.pathname, navigationType, persist]);

  return null;
};

export default ScrollManager;
