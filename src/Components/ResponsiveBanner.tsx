import type React from "react";
import "../Styles/ResponsiveBanner.css";
import { cloudinaryUrl } from "../utils/cloudinaryImage";

export type ResponsiveBannerProps = {
  type: "hero" | "section";
  desktopImageUrl: string;
  mobileImageUrl?: string | null;
  altText: string;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
};

const ResponsiveBanner: React.FC<ResponsiveBannerProps> = ({
  type,
  desktopImageUrl,
  mobileImageUrl,
  altText,
  priority = false,
  className = "",
  onClick,
  onError,
}) => {
  const picture = (
    <picture>
      {mobileImageUrl && (
        <source
          media="(max-width: 767px)"
          srcSet={cloudinaryUrl(mobileImageUrl, "detail")}
        />
      )}
      <img
        src={cloudinaryUrl(desktopImageUrl, "banner")}
        alt={altText}
        className="responsive-banner__image"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        onError={onError}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      />
    </picture>
  );

  const wrapperClassName =
    `responsive-banner responsive-banner--${type} ${className}`.trim();

  if (!onClick) {
    return <div className={wrapperClassName}>{picture}</div>;
  }

  return (
    <div
      className={`${wrapperClassName} responsive-banner--clickable`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={altText}
    >
      {picture}
    </div>
  );
};

export default ResponsiveBanner;
