import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { listingPath, pesos } from '../constants.js';
import { ListingImage } from '../components/ProductCard.jsx';

export default function MyListingsPage() {
    const { user } = useAuth();
    const { products, loading, error, refresh } = useMarketplace();
    const listings = products.filter((item) => item.user_id === user.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return (
        <main className="draft-panel">
            <div className="draft-heading"><h1>My listings</h1><Link className="draft-button" to="/list-an-item">List an item</Link></div>
            {loading ? <p role="status">Loading your listings…</p> : error ? <p role="alert">Could not load your listings. <button onClick={refresh} className="text-link">Try again</button></p>
                : !listings.length ? <p className="draft-muted">You haven’t posted any listings yet.</p> : <ul className="draft-rows">
                    {listings.map((item) => <li key={item.id}>
                        <ListingImage product={item} />
                        <div className="draft-row-info"><Link className="text-link" to={listingPath(item.id)}>{item.name}</Link>
                            <p className="draft-muted">{pesos(item.price)} · {{ available: 'Available', sold: 'Sold', archived: 'Archived' }[item.status]}</p>
                        </div>
                        <Link className="draft-button secondary" to={'/my-listings/' + item.id + '/edit'}>Edit<span className="visually-hidden"> {item.name}</span></Link>
                    </li>)}
                </ul>}
        </main>
    );
}
