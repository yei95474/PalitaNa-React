import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function useCart() {
    const catalog = useMarketplace();
    const { user } = useAuth();
    const entries = catalog.cartIds.map((id) => {
        const product = catalog.products.find((item) => item.id === id);
        return { id, product, available: product?.status === 'available' && product.user_id !== user?.id };
    });
    const available = entries.filter((entry) => entry.available);
    const total = available.reduce((sum, entry) => sum + entry.product.price, 0);
    return { ...catalog, entries, available, total };
}
