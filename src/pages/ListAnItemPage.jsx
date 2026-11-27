import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, CONDITIONS, LOCATIONS, listingPath } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { saveListing } from '../lib/marketplace.js';
import { saveListingPhoto } from '../lib/listingPhoto.js';
import ListingPhotoField from '../components/ListingPhotoField.jsx';

function SelectField({ name, label, options, value }) {
    return <div className="draft-field">
        <label htmlFor={name}>{label}</label>
        <select id={name} name={name} defaultValue={value} required>
            <option value="" disabled>Choose {label.toLowerCase()}</option>
            {options.map((option) => <option key={option}>{option}</option>)}
        </select>
    </div>;
}

function ListingForm({ original }) {
    const { user } = useAuth();
    const { refresh } = useMarketplace();
    const navigate = useNavigate();
    const [busy, setBusy] = useState(false);
    const [id] = useState(() => original?.id ?? crypto.randomUUID());
    const [photo, setPhoto] = useState(null);
    const [removed, setRemoved] = useState(false);
    const [preparing, setPreparing] = useState(false);
    const stagedPhoto = useRef(null);
    const [error, setError] = useState('');

    async function submit(event) {
        event.preventDefault();
        if (busy || preparing) return;
        setError('');
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const name = values.name.trim();
        const description = values.description.trim();
        if (!name || !description) { setError('Enter an item name and description.'); return; }

        setBusy(true);
        try {
            if (photo && stagedPhoto.current?.file !== photo) {
                const url = await saveListingPhoto(user.id, photo, id);
                stagedPhoto.current = { file: photo, url };
            }
            const image = photo ? stagedPhoto.current.url : removed ? '' : original?.image ?? '';
            const saved = await saveListing(user, {
                ...values, name, description, image, price: Number(values.price),
            }, id, Boolean(original));
            refresh();
            navigate(listingPath(saved.id));
        } catch (problem) {
            setError(problem.message);
            setBusy(false);
        }
    }

    return (
        <main className="draft-panel draft-form-panel">
            <h1>{original ? 'Edit listing' : 'List an Item'}</h1>
            <p className="draft-muted">Tell buyers what you’re selling and where they can pick it up.</p>
            <form className="draft-form" onSubmit={submit}>
                <label className="draft-field">Item name<input name="name" maxLength="100" required defaultValue={original?.name} placeholder="e.g. Scientific calculator" /></label>
                <div className="draft-fields">
                    <label className="draft-field">Price (₱)<input name="price" type="number" min="0" max="10000000" step="1" required defaultValue={original?.price} /></label>
                    <SelectField label="Category" name="category" options={CATEGORIES} value={original?.category ?? ''} />
                </div>
                <div className="draft-fields">
                    <SelectField label="Condition" name="condition" options={CONDITIONS} value={original?.condition ?? ''} />
                    <SelectField label="Pickup area" name="location" options={LOCATIONS} value={original?.location ?? ''} />
                </div>
                <label className="draft-field">Description<textarea name="description" rows="4" maxLength="1600" required defaultValue={original?.description} /></label>
                <ListingPhotoField busy={busy || preparing} existing={original?.image} photo={photo}
                    removed={removed} onPreparing={setPreparing} onChange={setPhoto}
                    onRemove={() => { setRemoved(true); setPhoto(null); }} />
                <div className="draft-field"><label htmlFor="listing-status">Availability</label>
                    <select id="listing-status" name="status" defaultValue={original?.status ?? 'available'}><option value="available">Available</option><option value="sold">Sold</option>{original && <option value="archived">Archived</option>}</select>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <div className="draft-actions">
                    <button className="draft-button" type="submit" disabled={busy || preparing}>{busy ? 'Saving…' : original ? 'Save changes' : 'Post listing'}</button>
                    <Link className="text-link" to={original ? '/my-listings' : '/'}>Cancel</Link>
                </div>
            </form>
        </main>
    );
}

export default function ListAnItemPage() {
    const { user } = useAuth();
    const { products, loading, error, refresh } = useMarketplace();
    const { id } = useParams();
    if (!id) return <ListingForm key="new" />;
    if (loading) return <main className="draft-panel" role="status">Loading listing…</main>;
    if (error) return <main className="draft-panel">Could not load your listing. <button onClick={refresh} className="text-link">Try again</button></main>;
    const original = products.find((item) => item.id === id && item.user_id === user.id);
    if (!original) return <main className="draft-panel"><h1>Listing unavailable</h1><Link className="text-link" to="/my-listings">My listings</Link></main>;
    return <ListingForm key={id} original={original} />;
}
