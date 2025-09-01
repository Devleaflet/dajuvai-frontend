// components/SpecialOffers.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import '../Styles/SpecialOffers.css';
import OffersSkeleton from '../skeleton/OffersSkeleton';
import { API_BASE_URL } from '../config';

interface Offer {
  id: number;
  name: string;
  desktopImage: string;
  mobileImage?: string;
  discount?: string; // Optional, as API doesn't provide discount
  color: string; // We'll assign colors manually
  status?: string;
  startDate?: string;
  endDate?: string;
}

const fetchSpecialDeals = async (): Promise<Offer[]> => {
  const response = await fetch(`${API_BASE_URL}/api/banners`);
  if (!response.ok) {
    throw new Error(`Failed to fetch banners: ${response.statusText}`);
  }
  const data = await response.json();
  // Filter for active SPECIAL_DEALS banners that are not expired and map to Offer interface
  const colors = ['#FFF3EA', '#F4F2ED', '#131313', '#FCE9E4', '#E2FFE2', '#E0F2FF'];
  return data.data
    .filter((banner: Offer & { type: string; status: string; startDate?: string; endDate?: string }) =>
      banner.type === 'SPECIAL_DEALS' &&
      banner.status === 'ACTIVE' &&
      (!banner.startDate || new Date(banner.startDate) <= new Date()) &&
      (!banner.endDate || new Date(banner.endDate) >= new Date())
    )
    .map((banner: Offer, index: number) => ({
      ...banner,
      discount: banner.discount || 'SPECIAL OFFER', // Fallback discount text
      color: colors[index % colors.length], // Cycle through colors
    }));
};

const SpecialOffers: React.FC = () => {
  const { data: offers = [], isLoading, error } = useQuery<Offer[], Error>({
    queryKey: ['specialDeals'],
    queryFn: fetchSpecialDeals,
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    retry: (failureCount, error) => {
      if (error.message.includes('404') || error.message.includes('400')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  if (isLoading) return <OffersSkeleton />;
  if (error) return <div className="special-offers-error">Error loading offers: {error.message}</div>;
  if (offers.length === 0) return (
    <div className="special-offers-fallback">
      <p className="text-gray-600 text-center text-sm">
        🎉 Stay tuned! Exciting special offers will be available soon.
      </p>
    </div>
  );


  return (
    <div className="special-offers-container">
      <div className="special-offers-header">
        <h2>SPECIAL OFFERS</h2>
        <p>Find everything to make their special day unforgettable.</p>
      </div>

      <div className="offers-grid">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="offer-card"
            style={{ backgroundColor: offer.color }}
          >
            <img
              src={offer.desktopImage}
              alt={`${offer.name} offer`}
              className="offer-image"
              loading="lazy"
            />
            <div className="offer-details">
              <p className="discount-text">{offer.discount}</p>
              <p className="brand-text">{offer.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialOffers;