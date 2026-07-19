import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

const Portal: React.FC<PortalProps> = ({
  children,
  containerId = "cart-portal-root",
}) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let el = document.getElementById(containerId);
    let created = false;

    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      document.body.appendChild(el);
      created = true;
    }

    setContainer(el);

    return () => {
      if (created && el && el.childNodes.length === 0) {
        el.remove();
      }
    };
  }, [containerId]);

  if (!container) return null;
  return createPortal(children, container);
};

export default Portal;
