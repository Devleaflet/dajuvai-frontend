import { useEffect } from "react";

let activeLockCount = 0;
let restoreBodyStyles: (() => void) | null = null;

// Freeze page scrolling without losing the current position. A shared counter
// makes nested and independently rendered modals safe: closing one modal cannot
// unlock the page while another modal is still visible.
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (activeLockCount === 0) {
      const scrollY = window.scrollY;
      const contentWidth = document.documentElement.clientWidth;
      const previous = {
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
      };

      // Do not overwrite a fixed body owned by another integration.
      if (previous.position !== "fixed") {
        document.body.style.position = "fixed";
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = "0";
        document.body.style.right = "0";
        document.body.style.width = `${contentWidth}px`;
        restoreBodyStyles = () => {
          document.body.style.position = previous.position;
          document.body.style.top = previous.top;
          document.body.style.left = previous.left;
          document.body.style.right = previous.right;
          document.body.style.width = previous.width;
          if (previous.position === "" && previous.top === "") {
            window.scrollTo(0, scrollY);
          }
        };
      } else {
        restoreBodyStyles = null;
      }
    }

    activeLockCount += 1;
    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      if (activeLockCount === 0) {
        restoreBodyStyles?.();
        restoreBodyStyles = null;
      }
    };
  }, [active]);
}
