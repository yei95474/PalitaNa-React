import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ListingImage } from '../components/ProductCard.jsx';
import SavedListingButton from '../components/SavedListingButton.jsx';
import { loadSellerReviews } from '../lib/campus.js';
import { pickupCheckoutPath } from '../lib/buyer.js';
import { pesos } from '../constants.js';

function SellerSummary({ product }) {
    const [summary, setSummary] = useState('Loading seller reviews…');

    useEffect(() => {
        let active = true;
        loadSellerReviews(product.user_id).then((rows) => {
            if (!active) return;
            if (!rows.length) { setSummary('No pickup reviews yet'); return; }
            const average = (rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toFixed(1);
            setSummary('★ ' + average + ' · ' + rows.length + (rows.length === 1 ? ' pickup review' : ' pickup reviews'));
        }, () => active && setSummary('View seller reviews'));
        return () => { active = false; };
    }, [product.user_id]);

    return <Link className="listing-seller-summary" to={'/seller/' + product.user_id}>
        <strong>{product.seller_name}</strong><span>{summary}</span><span aria-hidden="true">›</span>
    </Link>;
}

export default function ListingDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const { products, cartIds, addItem, loading, error, refresh } = useMarketplace();
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();
    const product = products.find((item) => item.id === id);
    const owner = product && product.user_id === user?.id;

    if (loading) return <main className="draft-panel" role="status">Loading listing.</main>;
    if (error) return <main className="draft-panel">Could not load the listing. <button onClick={refresh} className="text-link">Try again</button></main>;
    if (!product || (product.status === 'archived' && !owner)) return <main className="draft-panel"><h1>Listing unavailable</h1><Link className="text-link" to="/">Browse listings</Link></main>;

    function add() {
        try {
            addItem(id);
            setFeedback({ id, error: '', text: 'Added to your cart.' });
        } catch (problem) {
            setFeedback({ id, error: problem.message });
        }
    }

    return <main className="draft-panel detail-panel buyer-panel">
        <Link className="text-link" to="/">Browse listings</Link>
        <div className="product-wrapper">
            <ListingImage product={product} />
            <div className="product-info-wrapper">
                <p className="listing-location">{product.category}</p>
                <h1>{product.name}</h1>
                <p className="detail-price">{pesos(product.price)}</p>
                <dl className="detail-facts">
                    <div><dt>Condition</dt><dd>{product.condition}</dd></div>
                    <div><dt>Pickup area</dt><dd>{product.location}</dd></div>
                    <div><dt>Availability</dt><dd className={'listing-availability ' + product.status}>{product.status === 'available' ? 'Available' : product.status === 'sold' ? 'Sold' : 'Archived'}</dd></div>
                </dl>
                <SellerSummary key={product.user_id} product={product} />
                <p className="listing-description">{product.description}</p>
                {owner ? <Link className="draft-button secondary" to={'/my-listings/' + id + '/edit'}>Edit listing</Link>
                    : product.status === 'available' && <>
                        <SavedListingButton id={id} name={product.name} />
                        <div className="listing-actions">
                            {cartIds.includes(id) ? <Link className="draft-button secondary" to="/cart">View cart</Link>
                                : <button type="button" className="draft-button secondary" onClick={add}>Add to cart</button>}
                            <button type="button" className="draft-button" onClick={() => navigate(pickupCheckoutPath([id]))}>Request pickup</button>
                        </div>
                    </>}
                {feedback?.id === id && (feedback.error ? <p className="form-error" role="alert">{feedback.error}</p> : <p role="status">{feedback.text}</p>)}
            </div>
        </div>
    </main>;
}
