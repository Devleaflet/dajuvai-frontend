import { useEffect } from "react";

// Freezes the page's scroll while `active` is true without losing the window's
// scroll position. The body is pulled out of the document flow
// (`position: fixed`) and shifted up by the current scroll offset, which keeps
// the page visually frozen exactly where it was — the technique already used
// by the cart drawer, side menus, and every modal in the app.
//
// A fixed body stops overflowing the document, so the viewport's vertical
// scrollbar disappears for the duration of the lock. Without compensation that
// frees its gutter and every `width: 100%` container re-lays-out by the
// scrollbar's width (the Shop grid, for example, suddenly fits an extra
// column). Pinning the body to the content width it had *before* the scrollbar
// vanished (`document.documentElement.clientWidth`) keeps the layout
// pixel-identical while locked — the same gutter compensation MUI's modal
// applies as padding-right. On unlock the styles are removed and the window is
// scrolled back to the captured offset.
//
// Nested locks are supported — only the outermost lock restores the position.
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    // A parent lock (e.g. the cart drawer) has already frozen the page.
    if (document.body.style.position === "fixed") return;

    const scrollY = window.scrollY;
    // Capture the content width while the scrollbar is still present — once the
    // body is fixed the scrollbar vanishes and clientWidth reports the full
    // viewport, which would defeat the gutter compensation below.
    const contentWidth = document.documentElement.clientWidth;
    const previous = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = `${contentWidth}px`;

    return () => {
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.left = previous.left;
      document.body.style.right = previous.right;
      document.body.style.width = previous.width;
      if (previous.position === "" && previous.top === "") {
        window.scrollTo(0, scrollY);
      }
    };
  }, [active]);
}
