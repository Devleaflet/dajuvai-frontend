import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ForceScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollTopAll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById("root");
      if (root) root.scrollTop = 0;
    };

    scrollTopAll();
    requestAnimationFrame(scrollTopAll);
    const t1 = setTimeout(scrollTopAll, 0);
    const t2 = setTimeout(scrollTopAll, 120);

    if (document.readyState !== "complete") {
      const handleLoad = () => scrollTopAll();
      window.addEventListener("load", handleLoad, { once: true });
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  return null;
};

export default ForceScrollToTop;