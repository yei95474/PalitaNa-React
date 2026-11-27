import { Link } from 'react-router-dom';
import { listingPath, pesos } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import SavedListingButton from './SavedListingButton.jsx';
import { campusShortDay, campusTime } from '../lib/buyer.js';

export function ListingImage({ product, ...props }) {
    return <img src={product.image || '/images/listing-placeholder.png'} alt={product.name}
        onError={(event) => {
            const image = event.currentTarget;
            if (!image.src.endsWith('/images/listing-placeholder.png')) image.src = '/images/listing-placeholder.png';
        }} {...props} />;
}

export default function ProductCard({ product, window }) {
    const { user } = useAuth();
    return <article className="buyer-listing">
        <Link to={listingPath(product.id)} className="product-card">
            <div className="product-card-image"><ListingImage product={product} alt="" loading="lazy" /></div>
            <div className="buyer-card-copy">
                <p className="product-card-price">{pesos(product.price)}</p>
                <h4 className="product-card-name">{product.name}</h4>
                <p className="product-card-condition">{product.condition}</p>
                <p className="listing-location">{product.location}</p>
                {window && <p className="availability-line">Seller available {campusShortDay(window.from)}, {campusTime(window.from)}–{campusTime(window.until)}</p>}
            </div>
        </Link>
        {product.status === 'available' && product.user_id !== user?.id && <SavedListingButton id={product.id} name={product.name} compact />}
    </article>;
}
