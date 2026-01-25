import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        if (window.gtag) {
            window.gtag("config", "G-EVPF0RSQ4L", {
                page_path: location.pathname + location.search,
            });
        }
    }, [location]);
}
