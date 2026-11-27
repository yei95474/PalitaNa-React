/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { readLocal, writeLocal } from '../lib/demo.js';
import { loadListings } from '../lib/marketplace.js';
import { useAuth } from './AuthContext.jsx';

const MarketplaceContext = createContext(null);

export function MarketplaceProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [catalog, setCatalog] = useState({ products: [], error: '', loading: true });
    const [cartIds, setCartIds] = useState(() => readLocal('cart', []));
    const [refreshCount, setRefreshCount] = useState(0);

    useEffect(() => {
        if (authLoading) return;
        let current = true;
        loadListings().then(
            (products) => current && setCatalog({ products, loading: false, error: '' }),
            (error) => current && setCatalog({ products: [], loading: false, error: error.message }),
        );
        return () => { current = false; };
    }, [refreshCount, user?.id, authLoading]);

    function refresh() {
        setCatalog((previous) => ({ ...previous, error: '', loading: true }));
        setRefreshCount((count) => count + 1);
    }

    function saveCart(ids) {
        writeLocal('cart', ids);
        setCartIds(ids);
    }

    function addItem(id) {
        if (!cartIds.includes(id)) saveCart([...cartIds, id]);
    }

    return <MarketplaceContext.Provider value={{
        ...catalog, refresh, cartIds, addItem,
        removeItems: (ids) => saveCart(cartIds.filter((id) => !ids.includes(id))),
    }}>{children}</MarketplaceContext.Provider>;
}

export const useMarketplace = () => useContext(MarketplaceContext);
