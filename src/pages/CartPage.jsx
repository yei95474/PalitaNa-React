import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../hooks/useCart.js';
import { ListingImage } from '../components/ProductCard.jsx';
import { listingPath, pesos } from '../constants.js';
import { groupBySeller, pickupCheckoutPath } from '../lib/buyer.js';

export default function CartPage() {
    const { entries, available, loading, error, refresh, removeItems } = useCart();
    const [excluded, setExcluded] = useState([]);
    const [removeError, setRemoveError] = useState('');
    const selected = available.filter(({ id }) => !excluded.includes(id));
    const subtotal = selected.reduce((sum, entry) => sum + entry.product.price, 0);

    function remove(id) {
        setRemoveError('');
        try {
            removeItems([id]);
            setExcluded((ids) => ids.filter((value) => value !== id));
        } catch (problem) {
            setRemoveError(problem.message);
        }
    }

    return <main className="draft-panel buyer-panel">
        <h1>Your cart</h1>
        {loading ? <p role="status">Loading items.</p> : error ? <p role="alert">Could not load your cart. <button className="text-link" onClick={refresh}>Try again</button></p>
            : !entries.length ? <p className="draft-muted">Your cart is empty.</p> : <>
                {groupBySeller(entries, ({ product }) => product).map(({ id, name, items }) => <section className="cart-seller" key={id}>
                    <h2>{id ? <Link className="text-link" to={'/seller/' + id}>{name}</Link> : name}</h2>
                    <ul className="draft-rows">{items.map(({ id, product, available: canBuy }) => <li key={id}>
                        <input type="checkbox" className="cart-select" disabled={!canBuy} checked={canBuy && !excluded.includes(id)}
                            aria-label={'Select ' + (product?.name ?? 'unavailable item')}
                            onChange={(event) => {
                                const checked = event.target.checked;
                                setExcluded((ids) => checked ? ids.filter((value) => value !== id) : [...ids, id]);
                            }} />
                        {product && <ListingImage product={product} />}
                        <div className="draft-row-info">
                            {product ? <Link to={listingPath(id)}>{product.name}</Link> : <strong>Unavailable listing</strong>}
                            <p className="draft-muted">{canBuy ? product.location + ' · ' + pesos(product.price)
                                : product?.status === 'sold' ? 'Sold' : product?.status === 'available' ? 'Your own listing' : 'Unavailable for pickup'}</p>
                        </div>
                        <button className="text-link" aria-label={'Remove ' + (product?.name ?? 'unavailable listing')} onClick={() => remove(id)}>Remove</button>
                    </li>)}</ul>
                </section>)}
                {removeError && <p role="alert" className="form-error">{removeError}</p>}
                <div className="buyer-checkout-bar">
                    <div><span className="draft-muted">Selected ({selected.length})</span><strong>{pesos(subtotal)}</strong></div>
                    {selected.length > 0 && selected.length <= 50 ? <Link className="draft-button" to={pickupCheckoutPath(selected.map(({ id }) => id))}>Review pickup</Link>
                        : <button className="draft-button" disabled>Review pickup</button>}
                </div>
                {selected.length > 50 && <p role="status">Select up to 50 items per pickup request.</p>}
            </>}
        <Link className="text-link" to="/">Continue browsing</Link>
    </main>;
}
