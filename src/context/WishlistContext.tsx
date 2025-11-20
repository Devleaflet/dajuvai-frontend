import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWishlist } from '../api/wishlist';
import { useAuth } from './AuthContext';

interface WishlistContextType {
    wishlist: any[];
    wishlistMap: Map<number, any>; 
    loading: boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, token } = useAuth();
    const [wishlist, setWishlist] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshWishlist = async () => {
        if (!isAuthenticated || !token) {
            setWishlist([]);
            return;
        }
        setLoading(true);
        try {
            const items = await getWishlist(token);
            setWishlist(items);
        } catch (err) {
            console.warn('Failed to load wishlist', err);
            setWishlist([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshWishlist();
    }, [isAuthenticated, token]);

    // auto-refresh every 30s or on focus
    useEffect(() => {
        if (!isAuthenticated) return;
        const interval = setInterval(refreshWishlist, 30_000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const wishlistMap = new Map();
    wishlist.forEach(item => {
        const key = item.variantId ? `${item.productId}_${item.variantId}` : item.productId;
        wishlistMap.set(key, item);
    });

    return (
        <WishlistContext.Provider value={{ wishlist, wishlistMap, loading, refreshWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) throw new Error('useWishlist must be used within WishlistProvider');
    return context;
};