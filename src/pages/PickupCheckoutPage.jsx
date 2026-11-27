import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../hooks/useCart.js';
import { useAuth } from '../context/AuthContext.jsx';
import { groupBySeller, PUBLIC_SPOTS, campusDay, pickupWindow, sendBuyerRequests } from '../lib/buyer.js';
import { listingPath, pesos } from '../constants.js';
import { ListingImage } from '../components/ProductCard.jsx';

const errors = {
    unavailable: 'This item is no longer available.',
    price_changed: 'The price changed. Review the updated subtotal and try again.',
    invalid_preference: 'Choose a pickup window that is still in the future.',
};
const idPattern = /^(?:sample-\d+|[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12})$/i;

function PickupForm({ ids }) {
    const { user } = useAuth();
    const { products, loading, error: catalogError, refresh, removeItems } = useCart();
    const navigate = useNavigate();
    const submission = useRef({ ids: new Map(), busy: false });
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState({});
    const [error, setError] = useState('');
    const [saved, setSaved] = useState(0);

    const items = ids.map((id) => {
        const product = products.find((item) => item.id === id);
        return { id, product, available: product?.status === 'available' && product.user_id !== user.id };
    });
    const remaining = items.filter(({ id, available }) => available && !['sent', 'exists', 'unavailable'].includes(feedback[id]));
    const groups = groupBySeller(remaining, ({ product }) => product);
    const subtotal = remaining.reduce((total, { product }) => total + product.price, 0);

    async function submit(event) {
        event.preventDefault();
        if (submission.current.busy || !remaining.length) return;
        const data = new FormData(event.currentTarget);
        setError('');
        let input;
        try {
            input = groups.flatMap(({ id: seller, items: group }) => {
                const spot = data.get(seller + '-spot');
                const day = data.get(seller + '-day');
                const from = data.get(seller + '-from');
                const until = data.get(seller + '-until');
                const preference = spot || day || from || until ? { spot, ...pickupWindow(day, from, until) } : null;
                if (preference && !PUBLIC_SPOTS.includes(spot)) throw new Error('Choose a landmark for your preferred window.');
                return group.map(({ id, product }) => {
                    if (!submission.current.ids.has(id)) submission.current.ids.set(id, crypto.randomUUID());
                    return { id: submission.current.ids.get(id), listing_id: id, expected_price: product.price,
                        preference, note: data.get(seller + '-note').trim() };
                });
            });
        } catch (problem) {
            setError(problem.message);
            return;
        }
        submission.current.busy = true;
        setBusy(true);
        try {
            const results = await sendBuyerRequests(user, input, data.get('email').trim());
            const submitted = results.filter(({ status }) => status === 'sent' || status === 'exists');
            setFeedback((current) => ({ ...current, ...Object.fromEntries(results.map(({ listing_id, status }) => [listing_id, status])) }));
            setSaved((count) => count + submitted.length);
            if (submitted.length) {
                try { removeItems(submitted.map(({ listing_id }) => listing_id)); }
                catch { setError('Your requests were saved. Refresh your cart to update it.'); }
            }
            if (submitted.length === results.length && submitted.length) {
                navigate('/pickup-requests', { state: { sent: saved + results.filter(({ status }) => status === 'sent').length, reviewed: true }, replace: true });
                return;
            }
            if (results.some(({ status }) => status === 'price_changed')) refresh();
        } catch (problem) {
            setError(problem.message);
        } finally {
            submission.current.busy = false;
            setBusy(false);
        }
    }

    return <main className="draft-panel buyer-panel">
        <Link className="text-link" to={ids.length === 1 ? listingPath(ids[0]) : '/cart'}>{ids.length === 1 ? 'Back to listing' : 'Back to cart'}</Link>
        <h1>Review pickup request</h1>
        {catalogError && <p role="alert">Could not refresh listings. <button className="text-link" onClick={refresh}>Try again</button></p>}
        {loading && <p role="status">Checking your items.</p>}
        {!loading && !catalogError && !ids.length && <p>Your cart has no selected items. <Link className="text-link" to="/cart">Go to cart</Link></p>}
        {saved > 0 && <p className="confirmation" role="status">{saved} {saved === 1 ? 'request is' : 'requests are'} in <Link className="text-link" to="/pickup-requests">Pickups</Link>.</p>}
        {!loading && items.filter(({ id, available }) => errors[feedback[id]] || (!available && !feedback[id])).map(({ id, product }) =>
            <p key={id} className="form-error" role="status"><strong>{product?.name ?? 'Unavailable item'}:</strong> {errors[feedback[id]] ?? errors.unavailable}</p>)}
        <form className="draft-form pickup-review" onSubmit={submit} hidden={!groups.length}>
            <div className="pickup-review-items">
                {groups.map(({ id, name, items: group }) => <fieldset key={id} className="pickup-seller-form" disabled={busy}>
                    <legend>{name}</legend>
                    <ul className="draft-rows">{group.map(({ id: itemId, product }) => <li key={itemId}>
                        <ListingImage product={product} />
                        <div className="draft-row-info"><strong>{product.name}</strong><p className="draft-muted">{product.location}</p></div>
                        <strong>{pesos(product.price)}</strong>
                    </li>)}</ul>
                    <details>
                        <summary>Suggest a pickup window</summary>
                        <p className="draft-muted">Choose when and where you can meet. The seller will confirm or suggest another time.</p>
                        <div className="draft-fields">
                            <label className="draft-field">Preferred landmark<select name={id + '-spot'}>
                                <option value="">Choose a landmark</option>{PUBLIC_SPOTS.map((spot) => <option key={spot}>{spot}</option>)}
                            </select></label>
                            <label className="draft-field">Preferred date (PHT)<input type="date" name={id + '-day'} min={campusDay()} /></label>
                            <label className="draft-field">From<input type="time" name={id + '-from'} /></label>
                            <label className="draft-field">Until<input type="time" name={id + '-until'} /></label>
                        </div>
                    </details>
                    <label className="draft-field">Note for this seller (optional)<textarea name={id + '-note'} rows="2" maxLength="1000" /></label>
                </fieldset>)}
            </div>
            <aside className="pickup-review-summary">
                <h2>Request summary</h2>
                <p className="buyer-subtotal"><span>Items ({remaining.length})</span><strong>{pesos(subtotal)}</strong></p>
                <p><strong>Pay seller in person</strong></p>
                <p className="draft-muted">Check the item at the meetup before paying. The seller will reply in Pickups.</p>
                <label className="draft-field">Contact email
                    <input name="email" type="email" autoComplete="email" defaultValue={user.email} maxLength="254" required disabled={busy} />
                </label>
                <button type="submit" className="draft-button" disabled={busy || loading || !!catalogError}>{busy ? 'Sending…' : 'Send pickup request'}</button>
            </aside>
        </form>
        {error && <p role="alert" className="form-error">{error}</p>}
    </main>;
}

export default function PickupCheckoutPage() {
    const [params] = useSearchParams();
    const { available } = useCart();
    const ids = [...new Set(params.has('item') ? params.getAll('item').filter((id) => idPattern.test(id)) : available.map(({ id }) => id))].slice(0, 50);
    return <PickupForm key={ids.join(',')} ids={ids} />;
}
