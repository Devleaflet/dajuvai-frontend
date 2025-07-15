export interface Review {
  id: number;
  userId: number;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerifiedPurchase?: boolean;
  colorFamily?: string;
  helpfulCount?: number;
  images?: string[];
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    averageRating: number;
    reviews: Review[];
  };
} 