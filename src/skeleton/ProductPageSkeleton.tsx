import '../Styles/ProductPageSkeleton.css';

const ProductPageSkeleton = () => {
  return (
    <div className="product-page-skeleton-wrapper">
      <div className="product-page">
        <div className="product-page__container">
          <div className="product-page__content">
            <div className="product-gallery">
              <div className="product-gallery__images">
                <div className="product-gallery__main-image skeleton">
                  <div className="skeleton__image"></div>
                </div>
                <div className="product-gallery__thumbnails">
                  {[1, 2, 3, 4].map((index) => (
                    <div key={index} className="product-gallery__thumbnail skeleton">
                      <div className="skeleton__image"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="product-info">
                <div className="product-info__badges">
                  <div className="skeleton skeleton__badge"></div>
                  <div className="skeleton skeleton__badge"></div>
                </div>
                <div className="skeleton skeleton__brand"></div>
                <div className="skeleton skeleton__title"></div>
                <div className="skeleton skeleton__description"></div>
                <div className="product-rating">
                  <div className="skeleton skeleton__rating"></div>
                </div>
                <div className="product-price">
                  <div className="skeleton skeleton__price"></div>
                  <div className="skeleton skeleton__original-price"></div>
                  <div className="skeleton skeleton__savings"></div>
                </div>
                <div className="product-storage">
                  <div className="skeleton skeleton__label"></div>
                  <div className="skeleton skeleton__storage-value"></div>
                </div>
                <div className="product-options">
                  <div className="product-options__group">
                    <div className="skeleton skeleton__label"></div>
                    <div className="product-options__colors">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="skeleton skeleton__color"></div>
                      ))}
                    </div>
                  </div>
                  <div className="product-options__group">
                    <div className="skeleton skeleton__label"></div>
                    <div className="product-options__memory">
                      {[1, 2, 3].map((index) => (
                        <div key={index} className="skeleton skeleton__memory"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="product-quantity">
                  <div className="skeleton skeleton__label"></div>
                  <div className="skeleton skeleton__quantity"></div>
                  <div className="skeleton skeleton__stock"></div>
                </div>
                <div className="product-actions">
                  <div className="skeleton skeleton__button"></div>
                  <div className="skeleton skeleton__button"></div>
                </div>
                <div className="seller-info">
                  <div className="skeleton skeleton__seller-title"></div>
                  <div className="seller-info__identity">
                    <div className="skeleton skeleton__seller-icon"></div>
                    <div className="skeleton skeleton__seller-name"></div>
                  </div>
                  <div className="seller-info__details">
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="skeleton skeleton__seller-detail"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="product-page__reviews">
        <div className="skeleton skeleton__reviews-title"></div>
        <div className="skeleton skeleton__reviews-content"></div>
      </div>
    </div>
  );
};

export default ProductPageSkeleton; 