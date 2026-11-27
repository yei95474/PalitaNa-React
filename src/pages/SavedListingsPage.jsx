import { Link } from 'react-router-dom';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { useSaved } from '../context/SavedContext.jsx';
import { ListingImage } from '../components/ProductCard.jsx';
import { listingPath, pesos } from '../constants.js';

export default function SavedListingsPage() {
    const { products, loading: catalogLoading, error: catalogError, refresh } = useMarketplace();
    const { ids, pending, loading, save } = useSaved();

    return <main className="draft-panel buyer-panel">
        <h1>Saved items</h1>
        {(loading || catalogLoading) && <p role="status">Loading saved items.</p>}
        {catalogError && <p role="alert">Could not load the listings. <button className="text-link" onClick={refresh}>Refresh listings</button></p>}
        {!loading && !catalogLoading && !catalogError && (ids.length ? <ul className="draft-rows">
            {ids.map((id) => {
                const item = products.find((product) => product.id === id);
                const query = item ? new URLSearchParams({ category: item.category, area: item.location }) : null;
                return <li key={id}>
                    {item && <ListingImage product={item} />}
                    <div className="draft-row-info">
                        {item ? <><Link className="text-link" to={listingPath(id)}>{item.name}</Link>
                            <p>{pesos(item.price)} · {item.location}</p>
                            {item.status !== 'available' && <><span className="request-status">{item.status === 'sold' ? 'Sold' : 'Unavailable'}</span>{' '}
                                <Link className="text-link" to={'/search?' + query}>Find similar items</Link></>}</>
                            : <p>This listing is no longer available. <Link className="text-link" to="/search">Browse similar listings</Link></p>}
                    </div>
                    <button className="draft-button secondary" aria-label={'Remove ' + (item?.name ?? 'unavailable listing')}
                        disabled={pending.includes(id)} onClick={() => save(id, false)}>Remove</button>
                </li>;
            })}
        </ul> : <p className="draft-muted">Tap the heart on a listing to save it here.</p>)}
        <Link className="text-link" to="/">Browse campus listings</Link>
    </main>;
}
