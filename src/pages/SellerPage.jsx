import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { loadSellerReviews } from '../lib/campus.js';

function Storefront({ sellerId }) {
    const { products, loading, error, refresh } = useMarketplace();
    const [reviews, setReviews] = useState({ loading: true, rows: [], error: '' });
    const [retry, setRetry] = useState(0);
    const listings = products.filter((item) => item.user_id === sellerId && item.status === 'available');
    const name = listings[0]?.seller_name ?? 'Seller storefront';

    useEffect(() => {
        let active = true;
        loadSellerReviews(sellerId).then(
            (rows) => active && setReviews({ loading: false, rows, error: '' }),
            () => active && setReviews({ loading: false, rows: [], error: 'Could not load seller reviews.' }),
        );
        return () => { active = false; };
    }, [sellerId, retry]);

    const summary = reviews.rows.length
        ? (reviews.rows.reduce((sum, row) => sum + row.rating, 0) / reviews.rows.length).toFixed(1) + ' / 5'
        : '';

    return <main className="draft-panel">
        <Link className="text-link" to="/">← Campus listings</Link>
        <h1>{name}</h1>
        {summary && <p className="seller-rating">{summary} · {reviews.rows.length} verified {reviews.rows.length === 1 ? 'pickup review' : 'pickup reviews'}</p>}
        <section className="request-group">
            <h2>Available listings</h2>
            {loading ? <p role="status">Loading listings…</p>
                : error ? <p role="alert">Could not load listings. <button className="text-link" onClick={refresh}>Try again</button></p>
                    : listings.length ? <div className="product-card-grid">{listings.map((item) => <ProductCard key={item.id} product={item} />)}</div>
                        : <p className="draft-muted">No items available from this seller.</p>}
        </section>
        <section className="request-group">
            <h2>Reviews from completed pickups</h2>
            {reviews.loading ? <p role="status">Loading reviews…</p> : reviews.error
                ? <p role="alert">{reviews.error} <button className="text-link" onClick={() => setRetry((value) => value + 1)}>Try again</button></p>
                : reviews.rows.length ? <ul className="request-list">{reviews.rows.map((review) => <li className="request-card" key={review.request_id}>
                    <strong>{review.rating} / 5</strong>
                    {review.body && <p className="listing-description">{review.body}</p>}
                </li>)}</ul> : <p className="draft-muted">No verified reviews yet.</p>}
        </section>
    </main>;
}

export default function SellerPage() {
    const { sellerId } = useParams();
    if (!/^(?:demo-seller|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(sellerId)) {
        return <main className="draft-panel"><h1>Storefront unavailable</h1><Link className="text-link" to="/">Browse listings</Link></main>;
    }
    return <Storefront key={sellerId} sellerId={sellerId} />;
}
