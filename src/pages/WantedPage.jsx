import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { closeWanted, createWanted, loadWanted, replyToWanted } from '../lib/campusMatching.js';
import { LOCATIONS, listingPath, pesos } from '../constants.js';
import { campusDay } from '../lib/buyer.js';

function WantedForm({ user, initial, onChange }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form));
        const item = values.item.trim();
        if (!item) { setError('Enter the item you are looking for.'); return; }
        setError('');
        setBusy(true);
        try {
            await createWanted(user, { ...values, item, budget: Number(values.budget) });
            form.reset();
            onChange('Wanted item posted.');
        } catch (problem) { setError(problem.message); }
        finally { setBusy(false); }
    }

    return <form className="draft-form" onSubmit={submit}>
        <label className="draft-field">What do you need?<input name="item" defaultValue={initial} maxLength="100" required /></label>
        <div className="draft-fields">
            <label className="draft-field">Budget (₱)<input type="number" name="budget" min="0" max="10000000" step="1" required /></label>
            <label className="draft-field">Needed by (PHT)<input type="date" name="needed_by" min={campusDay()} required /></label>
        </div>
        <label className="draft-field">Pickup area<select name="area" defaultValue="" required>
            <option value="" disabled>Choose an area</option>{LOCATIONS.map((area) => <option key={area}>{area}</option>)}
        </select></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="draft-button" disabled={busy}>{busy ? 'Posting…' : 'Post wanted item'}</button>
    </form>;
}

function WantedCard({ post, user, listed, offers, onChange }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const author = user?.id === post.buyer_id;
    const offered = new Set(offers.map(({ listing_id }) => listing_id));
    const choices = listed.filter((item) => !offered.has(item.id));

    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const listingId = event.currentTarget.elements.listing.value;
        await action(() => replyToWanted(user, post.id, listingId), 'Listing sent privately to the buyer.');
    }

    async function action(run, notice) {
        setError('');
        setBusy(true);
        try { await run(); onChange(notice); }
        catch (problem) { setError(problem.message); }
        finally { setBusy(false); }
    }

    return <li className="request-card">
        <h3>{post.item}</h3>
        <p className="draft-muted">Up to {pesos(post.budget)} · {post.area} · Needed by {post.needed_by}</p>
        {author && <div className="wanted-replies">
            <h4>Seller replies</h4>
            {offers.length ? offers.map(({ listing_id }) => {
                const item = listed.find((listing) => listing.id === listing_id && listing.status === 'available');
                return <p key={listing_id}>{item ? <Link className="text-link" to={listingPath(item.id)}>{item.name} · {pesos(item.price)}</Link>
                    : <span className="draft-muted">A suggested listing is unavailable.</span>}</p>;
            }) : <p className="draft-muted">Replies will appear here.</p>}
            <button className="draft-button secondary" disabled={busy} onClick={() => action(() => closeWanted(user, post.id), 'Wanted post closed.')}>Close request</button>
        </div>}
        {!author && user && choices.length > 0 && <form className="draft-form" onSubmit={submit}>
            <label className="draft-field">Reply with your listing<select name="listing" defaultValue="" required>
                <option value="" disabled>Choose a listing</option>{choices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select></label>
            <button className="draft-button secondary" disabled={busy}>Send listing</button>
        </form>}
        {!author && user && offers.length > 0 && <p className="confirmation">You’ve sent {offers.length === 1 ? 'a listing' : offers.length + ' listings'}.</p>}
        {error && <p role="alert" className="form-error">{error}</p>}
    </li>;
}

function WantedBoard({ user }) {
    const { products } = useMarketplace();
    const location = useLocation();
    const [params] = useSearchParams();
    const initial = (params.get('q') || '').slice(0, 100);
    const [state, setState] = useState({ posts: [], replies: [], error: '', loading: true });
    const [revision, setRevision] = useState(0);
    const [notice, setNotice] = useState('');
    const myListings = products.filter((item) => item.user_id === user?.id && item.status === 'available');

    useEffect(() => {
        let active = true;
        loadWanted(user).then((data) => active && setState({ ...data, error: '', loading: false }),
            () => active && setState({ posts: [], replies: [], error: 'Could not load wanted items.', loading: false }));
        return () => { active = false; };
    }, [user, revision]);

    function update(message) {
        setNotice(message);
        setRevision((count) => count + 1);
    }

    return <main className="draft-panel buyer-panel">
        <h1>Campus Wanted Board</h1>
        <p className="draft-muted">Ask for an item and get replies with listings from campus sellers.</p>
        {user ? <WantedForm key={initial} user={user} initial={initial} onChange={update} />
            : <Link className="draft-button" to="/login" state={{ from: location.pathname + location.search }}>Sign in to post or reply</Link>}
        {notice && <p className="confirmation" role="status">{notice}</p>}
        <section className="request-group">
            <h2>Open wanted posts</h2>
            {state.loading ? <p role="status">Loading wanted items.</p> : state.error ?
                <p role="alert">{state.error} <button className="text-link" onClick={() => setRevision((count) => count + 1)}>Try again</button></p>
                : state.posts.length ? <ul className="request-list">{state.posts.map((post) => <WantedCard key={post.id} post={post} user={user}
                    listed={post.buyer_id === user?.id ? products : myListings}
                    offers={state.replies.filter((row) => row.post_id === post.id)} onChange={update} />)}</ul>
                    : <p className="draft-muted">No open wanted posts yet.</p>}
        </section>
    </main>;
}

export default function WantedPage() {
    const { user } = useAuth();
    return <WantedBoard key={user?.id ?? 'guest'} user={user} />;
}
