import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { loadRequests } from '../lib/marketplace.js';
import { displayPickupTime } from '../lib/campus.js';
import { CAMPUS_SPOTS, OTHER_SPOT, PICKUP_ISSUES, campusDay, campusTime, updateBuyerPickup } from '../lib/buyer.js';
import { listingPath, pesos } from '../constants.js';
import { ListingImage } from '../components/ProductCard.jsx';
import PickupChat from '../components/PickupChat.jsx';
import SellerReviewForm from '../components/SellerReviewForm.jsx';
import MeetupCard from '../components/MeetupCard.jsx';

const history = ['completed', 'declined', 'cancelled'];
const tabs = [['waiting', 'Awaiting reply'], ['scheduled', 'Scheduled'], ['history', 'History']];

function ProposalForm({ request, onAction, busy, onClose }) {
    const [error, setError] = useState('');
    const spot = request.proposal?.spot ?? request.pickup_spot ?? request.preference?.spot ?? '';
    function submit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const at = new Date(form.get('time') + '+08:00');
        const details = form.get('details').trim();
        const place = form.get('spot');
        if (!(at.getTime() > Date.now()) || (place === OTHER_SPOT && !details)) {
            setError('Choose a future time and include directions for a custom location.');
            return;
        }
        setError('');
        void onAction('propose', { spot: place, at: at.toISOString(), details });
    }

    return <form className="draft-form request-reply" onSubmit={submit}>
        <div className="draft-fields">
            <label className="draft-field">Public meeting spot<select name="spot" defaultValue={spot} required>
                <option value="" disabled>Choose a meeting spot</option>
                {CAMPUS_SPOTS.map((value) => <option key={value}>{value}</option>)}
            </select></label>
            <label className="draft-field">Meeting date and time (PHT)<input name="time" type="datetime-local" min={campusDay() + 'T00:00'} required /></label>
        </div>
        <label className="draft-field">Meeting point or directions<textarea name="details" rows="2" maxLength="1000" placeholder="e.g. At the benches beside the entrance" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="draft-actions">
            <button className="draft-button" disabled={busy}>Send meetup time</button>
            <button type="button" className="text-link" onClick={onClose}>Back to pickup</button>
        </div>
    </form>;
}

function IssueForm({ onAction, busy, onClose }) {
    return <form className="draft-form request-reply" onSubmit={(event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        void onAction('issue', { issue: values.issue, details: values.details.trim() });
    }}>
        <p className="draft-muted">This note appears in the pickup for you and the seller.</p>
        <label className="draft-field">What happened?<select name="issue" defaultValue="" required>
            <option value="" disabled>Choose an issue</option>{PICKUP_ISSUES.map((issue) => <option key={issue}>{issue}</option>)}
        </select></label>
        <label className="draft-field">Details (optional)<textarea name="details" rows="2" maxLength="1000" /></label>
        <div className="draft-actions">
            <button className="draft-button" disabled={busy}>Record issue</button>
            <button type="button" className="text-link" onClick={onClose}>Back to pickup</button>
        </div>
    </form>;
}

function RequestCard({ request, listing, catalogReady, user, now, onReply }) {
    const [panel, setPanel] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const inFlight = useRef(false);
    const isBuyer = request.buyer_id === user.id;
    const active = ['pending', 'accepted'].includes(request.status);
    const accepted = request.status === 'accepted';
    const past = accepted && (!request.pickup_at || Date.parse(request.pickup_at) <= now);
    const proposal = request.proposal;
    const ownProposal = proposal?.by === user.id;
    const canPropose = active && (!isBuyer || accepted || proposal);
    const status = { pending: proposal && !ownProposal ? 'Review meetup time' : isBuyer ? 'Awaiting seller reply' : 'Awaiting reply',
        accepted: request.pickup_issue?.issue === 'Missed meetup' ? 'Missed meetup' : request.pickup_at ? 'Scheduled' : 'Accepted',
        completed: 'Received', declined: 'Declined', cancelled: 'Canceled' }[request.status];

    async function action(name, details) {
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        setError('');
        try {
            const updated = await updateBuyerPickup(user, request, name, details);
            setPanel('');
            onReply(updated, request.status);
        } catch (problem) { setError(problem.message); }
        finally { inFlight.current = false; setBusy(false); }
    }

    const seller = request.seller_name ?? listing?.seller_name;
    const image = request.item_image || listing?.image;
    const showNote = (value, label) => value && <p className="listing-description"><strong>{label}</strong> {value}</p>;
    const toggle = (value) => setPanel((current) => current === value ? '' : value);

    return <li className="request-card buyer-request-card">
        <div className="pickup-listing">
            <ListingImage product={{ name: request.item_name, image }} alt="" />
            <div>
                <h3>{listing ? <Link to={listingPath(request.listing_id)}>{request.item_name}</Link> : request.item_name}</h3>
                <p className="draft-muted">{pesos(request.item_price)} · {request.location}</p>
                {isBuyer && <Link className="text-link" to={'/seller/' + request.seller_id}>{seller || 'Seller storefront'}</Link>}
                {!isBuyer && <a className="text-link" href={'mailto:' + encodeURIComponent(request.buyer_email)}>Contact buyer by email</a>}
            </div>
            <span className={'request-status ' + request.status}>{status}</span>
        </div>
        {active && request.listing_id && catalogReady && (!listing || listing.status !== 'available') && <p className="draft-muted">Listing is sold or unavailable for new requests.</p>}
        {request.preference && !accepted && active && <p className="pickup-preference"><strong>Preferred meetup</strong> · {request.preference.spot} · {displayPickupTime(request.preference.from)} to {campusTime(request.preference.until)} PHT</p>}
        {showNote(request.note, 'Buyer note')}
        {accepted && request.pickup_at && <MeetupCard request={request} now={now} isBuyer={isBuyer} onMessage={() => toggle('chat')} onSuggest={() => toggle('propose')} />}
        {!active && request.pickup_at && <p className="draft-muted">Meetup: {request.pickup_spot} · {displayPickupTime(request.pickup_at)}</p>}
        {active && proposal && <div className="pickup-proposal">
            <h4>{ownProposal ? isBuyer ? 'Waiting for seller to confirm' : 'Waiting for buyer to confirm' : 'Review the proposed meetup'}</h4>
            <p>{proposal.spot} · {displayPickupTime(proposal.at)}</p>
            {showNote(proposal.details, 'Directions')}
            {accepted && <p className="draft-muted">The confirmed meetup above is still in place.</p>}
            <div className="draft-actions">
                {!ownProposal && Date.parse(proposal.at) > now && <button className="draft-button" disabled={busy} onClick={() => action('confirm')}>Confirm meetup</button>}
                <button className="text-link" disabled={busy} onClick={() => action('dismiss')}>{ownProposal ? 'Withdraw proposal' : 'Decline proposed time'}</button>
            </div>
        </div>}
        {request.pickup_issue && showNote([request.pickup_issue.issue, request.pickup_issue.details].filter(Boolean).join(' · '), 'Pickup issue')}
        {panel === 'propose' && <ProposalForm request={request} busy={busy} onAction={action} onClose={() => setPanel('')} />}
        {panel === 'issue' && <IssueForm busy={busy} onAction={action} onClose={() => setPanel('')} />}
        {(panel === 'complete' || panel === 'cancel' || panel === 'decline') && <div className="request-reply">
            <p>{panel === 'complete' ? 'Confirm after you’ve received and checked the item.' : panel === 'cancel' ? 'Cancel this pickup?' : 'Decline this pickup request?'}</p>
            <div className="draft-actions">
                <button className="draft-button" disabled={busy} onClick={() => action(panel)}>
                    {panel === 'complete' ? 'Confirm item received' : panel === 'cancel' ? 'Confirm cancellation' : 'Confirm decline'}
                </button>
                <button className="text-link" onClick={() => setPanel('')}>Go back</button>
            </div>
        </div>}
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="draft-actions pickup-card-actions">
            {canPropose && (!accepted || !request.pickup_at) && <button type="button" className="draft-button secondary" onClick={() => toggle('propose')}>
                {proposal ? 'Suggest another time' : 'Propose a meetup'}
            </button>}
            {active && <button className="text-link" type="button" onClick={() => toggle(isBuyer || accepted ? 'cancel' : 'decline')}>
                {isBuyer || accepted ? 'Cancel pickup' : 'Decline request'}
            </button>}
            {isBuyer && past && <>
                <button className="draft-button" type="button" onClick={() => toggle('complete')}>Mark as received</button>
                <button className="text-link" type="button" onClick={() => toggle('issue')}>Report a pickup issue</button>
            </>}
            <button className="text-link" type="button" aria-expanded={panel === 'chat'} onClick={() => toggle('chat')}>
                {panel === 'chat' ? 'Hide chat' : 'Pickup chat'}
            </button>
            {isBuyer && request.status === 'completed' && <button className="text-link" type="button" aria-expanded={panel === 'review'}
                onClick={() => toggle('review')}>Review this trade</button>}
        </div>
        {panel === 'chat' && <PickupChat request={request} user={user} />}
        {panel === 'review' && <SellerReviewForm request={request} user={user} />}
        <details className="pickup-timeline"><summary>Pickup timeline</summary>
            <ol><li><time dateTime={request.created_at}>{displayPickupTime(request.created_at)}</time> · Request sent</li>
                {(request.meetup_events ?? []).map((event, index) => <li key={index}>
                    <time dateTime={event.at}>{displayPickupTime(event.at)}</time> · {event.label}
                    {event.spot && <span> · {event.spot} · {displayPickupTime(event.time)}</span>}
                </li>)}
            </ol>
        </details>
    </li>;
}

function Requests({ user }) {
    const { state } = useLocation();
    const [params, setParams] = useSearchParams();
    const filter = tabs.some(([value]) => value === params.get('view')) ? params.get('view') : 'waiting';
    const role = params.get('role') === 'seller' ? 'seller' : 'buyer';
    const { products, loading: catalogLoading, error: catalogError } = useMarketplace();
    const [result, setResult] = useState({ rows: [], loading: true, error: '' });
    const [attempt, setAttempt] = useState(0);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        let active = true;
        let revision = 0;
        function refresh() {
            const check = ++revision;
            loadRequests(user).then(
                (rows) => {
                    if (active && revision === check) {
                        setNow(Date.now());
                        setResult({ rows, loading: false, error: '' });
                    }
                },
                () => active && revision === check && setResult((current) => ({ ...current, loading: false, error: 'Could not load your pickups.' })),
            );
        }
        refresh();
        const timer = setInterval(() => { if (!document.hidden) refresh(); }, 30000);
        window.addEventListener('focus', refresh);
        return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
    }, [user, attempt]);

    function go(view, nextRole = role) {
        setParams({ ...(view !== 'waiting' && { view }), ...(nextRole === 'seller' && { role: 'seller' }) }, { replace: true, state: null });
    }

    function onReply(updated, previous) {
        setResult((current) => ({ ...current, rows: current.rows.map((row) => row.id === updated.id ? updated : row) }));
        setAttempt((count) => count + 1);
        if (history.includes(updated.status)) go('history');
        else if (updated.status === 'accepted' && previous !== 'accepted') go('scheduled');
    }

    const owned = result.rows.filter((row) => (role === 'buyer' ? row.buyer_id : row.seller_id) === user.id);
    const inView = (row, view) => view === 'scheduled' ? row.status === 'accepted' : view === 'history' ? history.includes(row.status) : row.status === 'pending';
    const visible = owned.filter((row) => inView(row, filter));
    if (filter === 'scheduled') visible.sort((a, b) => {
        const left = Date.parse(a.pickup_at) || 0;
        const right = Date.parse(b.pickup_at) || 0;
        return Number(right > now) - Number(left > now) || (left > now ? left - right : right - left);
    });

    return <main className="draft-panel buyer-panel">
        <div className="draft-heading">
            <h1>Pickups</h1>
            <button className="draft-button secondary" disabled={result.loading} onClick={() => setAttempt((current) => current + 1)}>Refresh</button>
        </div>
        {state?.reviewed && <p className="confirmation" role="status">{state.sent ? state.sent + (state.sent === 1 ? ' pickup request sent.' : ' pickup requests sent.') : 'Your existing requests are shown below.'}</p>}
        <div className="pickup-role" role="group" aria-label="Pickup role">
            <button type="button" aria-pressed={role === 'buyer'} onClick={() => go('waiting', 'buyer')}>Buying</button>
            <button type="button" aria-pressed={role === 'seller'} onClick={() => go('waiting', 'seller')}>Selling</button>
        </div>
        <nav className="pickup-tabs" aria-label="Pickup views">
            {tabs.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => go(value)}>
                {label} <span>{owned.filter((row) => inView(row, value)).length}</span>
            </button>)}
        </nav>
        {result.loading ? <p role="status">Loading pickups.</p> : <>
            {result.error && <p role="alert">{result.error} Try refreshing.</p>}
            {visible.length ? <ul className="request-list">
                {visible.map((request) => <RequestCard key={request.id} request={request} now={now} user={user} onReply={onReply}
                    listing={products.find(({ id }) => id === request.listing_id)} catalogReady={!catalogLoading && !catalogError} />)}
            </ul> : <div className="pickup-empty">
                <h2>{filter === 'waiting' ? 'Nothing awaiting a reply' : filter === 'scheduled' ? 'No scheduled meetups' : 'No pickup history yet'}</h2>
                <Link className="text-link" to={role === 'buyer' ? '/' : '/my-listings'}>{role === 'buyer' ? 'Browse campus listings' : 'Manage your listings'}</Link>
            </div>}
        </>}
    </main>;
}

export default function PickupRequestsPage() {
    const { user } = useAuth();
    return <Requests key={user.id} user={user} />;
}
