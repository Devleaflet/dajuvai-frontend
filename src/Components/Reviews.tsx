import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Star, StarHalf, ArrowUpDown, Check, MoreVertical, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import '../Styles/Reviews.css';
import { Review } from '../types/review';

interface ReviewsProps {
  productId: number;
  initialReviews: Review[];
  initialAverageRating: number;
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  onReviewUpdate: () => Promise<void>;
  onPageChange: (page: number) => void;
}

const Reviews: React.FC<ReviewsProps> = ({
  productId,
  initialReviews,
  initialAverageRating,
  totalReviews,
  currentPage,
  totalPages,
  onReviewUpdate,
  onPageChange,
}) => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [averageRating, setAverageRating] = useState<number>(initialAverageRating);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'date'>('relevance');
  const [filterBy, setFilterBy] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    setReviews(initialReviews);
    setAverageRating(initialAverageRating);
  }, [initialReviews, initialAverageRating]);

  // Calculate rating distribution dynamically
  const calculateRatingDistribution = useCallback(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      // Round rating to nearest integer to handle decimals (e.g., 4.5 -> 5)
      const roundedRating = Math.round(review.rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating as keyof typeof distribution]++;
      }
    });

const total = totalReviews || 1;
    return {
      5: { count: distribution[5], percentage: (distribution[5] / total) * 100 },
      4: { count: distribution[4], percentage: (distribution[4] / total) * 100 },
      3: { count: distribution[3], percentage: (distribution[3] / total) * 100 },
      2: { count: distribution[2], percentage: (distribution[2] / total) * 100 },
      1: { count: distribution[1], percentage: (distribution[1] / total) * 100 },
    };
  }, [reviews]);

  const ratingDistribution = calculateRatingDistribution();

  const renderStars = useCallback((rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className={`star star--filled star--${size}`} />
      );
    }
    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className={`star star--filled star--${size}`} />);
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className={`star star--empty star--${size}`} />);
    }
    return stars;
  }, []);

  const handleSubmitReview = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !token) {
        toast.error('Please login to leave a review', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
          },
        });
        return;
      }

      if (!newReview.comment.trim()) {
        toast.error('Please write a review comment', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
          },
        });
        return;
      }

      setIsSubmitting(true);
      const loadingToast = toast.loading('Submitting your review...', {
        position: 'top-center',
      });

      try {
        const response = await fetch(`${API_BASE_URL}/api/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId,
            rating: newReview.rating,
            comment: newReview.comment,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.dismiss(loadingToast);
          if (response.status === 401) {
            toast.error('Your session has expired. Please login again.', {
              duration: 4000,
              position: 'top-center',
              style: {
                background: '#FEE2E2',
                color: '#991B1B',
                border: '1px solid #FCA5A5',
              },
            });
            return;
          }
          throw new Error(data.message || 'Failed to submit review');
        }

        toast.dismiss(loadingToast);
        toast.success('Thank you for your review!', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#DCFCE7',
            color: '#166534',
            border: '1px solid #86EFAC',
          },
          icon: '👏',
        });

        // Add the new review to local state immediately with correct username
        const newReviewData: Review = {
          id: data.reviewId || Date.now(), // Use backend ID or fallback
          userId: user.id,
          userName: user.username || user.email.split('@')[0],
          rating: newReview.rating,
          comment: newReview.comment,
          createdAt: new Date().toISOString(),
          isVerifiedPurchase: false,
          helpfulCount: 0
        };

        setReviews(prevReviews => [newReviewData, ...prevReviews]);
        
        // Update average rating
        const totalRating = [...reviews, newReviewData].reduce((sum, review) => sum + review.rating, 0);
        const newAverageRating = totalRating / (reviews.length + 1);
        setAverageRating(newAverageRating);

        setNewReview({ rating: 5, comment: '' });
        setIsWritingReview(false);
        
        
        // Still call onReviewUpdate to sync with backend
        await onReviewUpdate();
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error instanceof Error ? error.message : 'Failed to submit review', {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5',
          },
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, token, newReview, productId, onReviewUpdate]
  );

  const handleSortChange = useCallback((newSortBy: 'relevance' | 'rating' | 'date') => {
    setSortBy(newSortBy);
    onPageChange(1)

    toast.success(`Sorted by ${newSortBy}`, {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#DCFCE7',
        color: '#166534',
        border: '1px solid #86EFAC',
      },
    });
  }, [onPageChange]);

  const handleFilterChange = useCallback((newFilter: 'all' | '5' | '4' | '3' | '2' | '1') => {
    setFilterBy(newFilter);
    onPageChange(1)
    toast.success(`Filtered by ${newFilter === 'all' ? 'all stars' : `${newFilter} star`}`, {
      duration: 2000,
      position: 'top-center',
      style: {
        background: '#DCFCE7',
        color: '#166534',
        border: '1px solid #86EFAC',
      },
    });
  }, [onPageChange]);

  const getTimeAgo = useCallback((dateString: string) => {
    const now = new Date();
    const reviewDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - reviewDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  }, []);
  // Generate pagination numbers
const generatePaginationNumbers = useCallback(() => {
  const pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show smart pagination
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
  }
  
  return pages;
}, [currentPage, totalPages]);

  // Filter and sort reviews
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews;

    if (filterBy !== 'all') {
      const filterValue = parseInt(filterBy);
      filtered = reviews.filter((review) => Math.round(review.rating) === filterValue);
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'relevance':
        default:
          // Default to date sorting since we removed helpful count
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [reviews, sortBy, filterBy]);

  return (
    <div className="reviews-container">
      <style>{`
        .reviews-container {
          margin: 0 auto;
          padding: 1rem;
          border-radius: 5px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .rating-summary {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .rating-overview {
          flex-shrink: 0;
        }

        .rating-number {
          font-size: 3rem;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
          line-height: 1;
        }

        .rating-number .rating-suffix {
          font-size: 1.5rem;
          color: #666;
          font-weight: normal;
        }

        .star {
          width: 1rem;
          height: 1rem;
          transition: all 0.2s ease;
        }

        .star--sm {
          width: 0.75rem;
          height: 0.75rem;
        }

        .star--md {
          width: 1rem;
          height: 1rem;
        }

        .star--lg {
          width: 1.5rem;
          height: 1.5rem;
        }

        .star--filled {
          fill: #fbbf24;
          color: #fbbf24;
        }

        .star--empty {
          color: #d1d5db;
        }

        .stars-container {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .rating-count {
          font-size: 0.875rem;
          color: #666;
        }

        .rating-breakdown {
          flex: 1;
          max-width: 400px;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .rating-stars {
          display: flex;
          align-items: center;
          gap: 0.125rem;
          width: 3rem;
        }

        .rating-bar {
          flex: 1;
          background: #e5e7eb;
          border-radius: 9999px;
          height: 0.5rem;
          overflow: hidden;
        }

        .rating-bar-fill {
          background: #fbbf24;
          height: 100%;
          transition: width 0.3s ease;
        }

        .rating-count-small {
          font-size: 0.875rem;
          color: #666;
          width: 1.5rem;
          text-align: right;
        }

        .controls-section {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .controls-wrapper {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .control-icon {
          width: 1rem;
          height: 1rem;
          color: #6b7280;
        }

        .control-label {
          font-size: 0.875rem;
          color: #666;
        }

        .control-select {
          font-size: 0.875rem;
          color: #2563eb;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
        }

        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .review-item {
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 1.5rem;
        }

        .review-item:last-child {
          border-bottom: none;
        }

        .review-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .review-rating-time {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .review-time {
          text-align: right;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .review-more {
          color: #9ca3af;
          padding: 0.25rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .review-more:hover {
          color: #6b7280;
        }

        .review-more-icon {
          width: 1rem;
          height: 1rem;
        }

        .review-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .user-name {
          font-weight: 500;
          color: #1a1a1a;
        }

        .verified-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #059669;
          font-size: 0.75rem;
        }

        .verified-icon {
          width: 0.75rem;
          height: 0.75rem;
        }

        .review-content {
          color: #374151;
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .review-images {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .review-image {
          width: 4rem;
          height: 4rem;
          object-fit: cover;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
        }

        .review-color {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.75rem;
        }

        .review-color .color-label {
          font-weight: 500;
        }

        .review-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .helpful-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.875rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .helpful-button:hover {
          color: #374151;
        }

        .helpful-icon {
          width: 1rem;
          height: 1rem;
        }

        .load-more {
          text-align: center;
          margin-top: 2rem;
        }

        .load-more-button {
          padding: 0.5rem 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          color: #374151;
          background: white;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .review-form {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 1rem;
          padding: 2rem;
          margin-bottom: 2rem;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #334155;
          font-size: 1rem;
        }

        .star-rating-input {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .star-button {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 0.5rem;
        }

        .star-button:hover {
          transform: scale(1.15);
          background-color: rgba(251, 191, 36, 0.1);
        }

        .star-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .review-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          resize: vertical;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
          transition: all 0.2s ease;
          background-color: white;
        }

        .review-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .review-textarea::placeholder {
          color: #94a3b8;
        }

        .submit-button {
          background: linear-gradient(135deg, #f97316 0%, #f97316 100%);
          color: white;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          border: none;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(59, 130, 246, 0.3);
        }

        .submit-button:active {
          transform: translateY(0);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
          .pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem 0;
}

.pagination-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.pagination-button--active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.pagination-button--active:hover {
  background-color: #2563eb;
}

.pagination-ellipsis {
  padding: 0.5rem;
  color: #9ca3af;
}

.pagination-info {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

        @media (min-width: 1024px) {
          .rating-summary {
            flex-direction: row;
            gap: 4rem;
          }

          .controls-section {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (min-width: 640px) {
          .controls-section {
            flex-direction: row;
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .rating-number {
            font-size: 2.5rem;
          }

          .rating-breakdown {
            max-width: none;
          }
        }
      `}</style>

      {/* Rating Summary Section */}
      <div className="rating-summary">
        <div className="rating-overview">
          <div className="rating-number">
            {averageRating.toFixed(1)}
            <span className="rating-suffix">/5</span>
          </div>
          <div className="stars-container">
            {renderStars(averageRating, "lg")}
          </div>
            <div className="rating-count">{totalReviews} Ratings</div>
        </div>

        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="rating-row">
              <div className="rating-stars">{renderStars(rating, "sm")}</div>
              <div className="rating-bar">
                <div
                  className="rating-bar-fill"
                  style={{
                    width: `${
                      ratingDistribution[
                        rating as keyof typeof ratingDistribution
                      ].percentage
                    }%`,
                  }}
                ></div>
              </div>
              <div className="rating-count-small">
                {
                  ratingDistribution[rating as keyof typeof ratingDistribution]
                    .count
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <h3 className="section-title">Product Reviews</h3>
        <div className="controls-wrapper">
          <div className="control-group">
            <ArrowUpDown className="control-icon" />
            <span className="control-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                handleSortChange(
                  e.target.value as "relevance" | "rating" | "date"
                )
              }
              className="control-select"
            >
              <option value="relevance">Relevance</option>
              <option value="date">Newest</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>
          <div className="control-group">
            <span className="control-label">Filter:</span>
            <select
              value={filterBy}
              onChange={(e) =>
                handleFilterChange(
                  e.target.value as "all" | "5" | "4" | "3" | "2" | "1"
                )
              }
              className="control-select"
            >
              <option value="all">All star</option>
              <option value="5">5 star</option>
              <option value="4">4 star</option>
              <option value="3">3 star</option>
              <option value="2">2 star</option>
              <option value="1">1 star</option>
            </select>
          </div>
        </div>
      </div>

      {/* Review Form */}
      {user && (
        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="form-group">
            <label className="form-label">Your Rating:</label>
            <div className="star-rating-input">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating })}
                  className="star-button"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`star ${
                      rating <= newReview.rating
                        ? "star--filled"
                        : "star--empty"
                    } star--md`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Show username information */}
          <div className="form-group">
            <div className="review-user">
              <span className="user-name">
                {isWritingReview
                  ? "Anonymous"
                  : user.username || user.email.split("@")[0]}
              </span>
            </div>
          </div>

          <textarea
            value={newReview.comment}
            onChange={(e) => {
              setNewReview({ ...newReview, comment: e.target.value });
              if (!isWritingReview && e.target.value.trim()) {
                setIsWritingReview(true);
              } else if (isWritingReview && !e.target.value.trim()) {
                setIsWritingReview(false);
              }
            }}
            onFocus={() => {
              if (newReview.comment.trim()) {
                setIsWritingReview(true);
              }
            }}
            placeholder="Write your review..."
            className="review-textarea"
            rows={3}
            required
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="reviews-list">
        {filteredAndSortedReviews.length === 0 ? (
          <p>No reviews match the selected filter.</p>
        ) : (
          filteredAndSortedReviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="review-rating-time">
                  <div className="stars-container">
                    {renderStars(review.rating)}
                  </div>
                  <div className="review-time">
                    {getTimeAgo(review.createdAt)}
                  </div>
                </div>
                <button className="review-more">
                  <MoreVertical className="review-more-icon" />
                </button>
              </div>

              <div className="review-user">
                <span className="user-name">
                  {review.userName || "Anonymous"}
                </span>
                {review.isVerifiedPurchase && (
                  <div className="verified-badge">
                    <Check className="verified-icon" />
                    <span>Verified Purchase</span>
                  </div>
                )}
              </div>

              <p className="review-content">{review.comment}</p>

              {review.images && review.images.length > 0 && (
                <div className="review-images">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="review-image"
                    />
                  ))}
                </div>
              )}

              {review.colorFamily && (
                <div className="review-color">
                  <span className="color-label">Color Family:</span>{" "}
                  {review.colorFamily}
                </div>
              )}

              {/* Removed helpful/like feature as requested */}
            </div>
          ))
        )}
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          {/* Previous Button */}
          <button
            className="pagination-button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
          </button>

          {/* Page Numbers */}
          {generatePaginationNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="pagination-ellipsis">...</div>
              ) : (
                <button
                  className={`pagination-button ${
                    currentPage === page ? 'pagination-button--active' : ''
                  }`}
                  onClick={() => onPageChange(page as number)}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next Button */}
          <button
            className="pagination-button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}

      {/* Pagination Info */}
      {totalPages > 1 && (
        <div className="pagination-info">
          Showing page {currentPage} of {totalPages} ({totalReviews} total reviews)
        </div>
      )}
    </div>
    
  );
};

export default memo(Reviews);