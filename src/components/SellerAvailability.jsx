import { useEffect, useState } from 'react';
import { campusDay, campusTime, pickupWindow, PUBLIC_SPOTS } from '../lib/buyer.js';
import { displayPickupTime } from '../lib/campus.js';
import { loadAvailability, publishAvailability } from '../lib/campusMatching.js';

export default function SellerAvailability({ user }) {
    const [state, setState] = useState({ window: null, error: '', loading: true, busy: false, notice: '' });

    useEffect(() => {
        let active = true;
        loadAvailability().then((rows) => active && setState((current) => ({
            ...current, window: rows.find(({ seller_id }) => seller_id === user.id) ?? null, loading: false,
        })), () => active && setState((current) => ({ ...current, loading: false, error: 'Could not load your pickup availability.' })));
        return () => { active = false; };
    }, [user.id]);

    async function save(form) {
        setState((current) => ({ ...current, error: '', notice: '', busy: true }));
        try {
            const window = form ? { spot: form.get('spot'), ...pickupWindow(form.get('day'), form.get('from'), form.get('until')) } : null;
            await publishAvailability(user, window);
            setState({ window, loading: false, busy: false, error: '', notice: window ? 'Pickup window published.' : 'Pickup window removed.' });
        } catch (problem) {
            setState((current) => ({ ...current, busy: false, error: problem.message }));
        }
    }

    return <section className="account-availability">
        <h2>Between Classes availability</h2>
        <p className="draft-muted">Publish your next available window for buyers to find your current listings.</p>
        {state.loading && <p role="status">Loading availability.</p>}
        {state.window && <p><strong>{state.window.spot}</strong> · {displayPickupTime(state.window.from)} to {campusTime(state.window.until)} PHT</p>}
        <form className="draft-form" onSubmit={(event) => { event.preventDefault(); void save(new FormData(event.currentTarget)); }}>
            <div className="draft-fields">
                <label className="draft-field">Public landmark<select name="spot" defaultValue="" required>
                    <option value="" disabled>Choose a landmark</option>{PUBLIC_SPOTS.map((spot) => <option key={spot}>{spot}</option>)}
                </select></label>
                <label className="draft-field">Date (PHT)<input type="date" name="day" min={campusDay()} required /></label>
                <label className="draft-field">From<input type="time" name="from" required /></label>
                <label className="draft-field">Until<input type="time" name="until" required /></label>
            </div>
            {state.error && <p className="form-error" role="alert">{state.error}</p>}
            {state.notice && <p className="confirmation" role="status">{state.notice}</p>}
            <div className="draft-actions">
                <button className="draft-button" disabled={state.busy || state.loading}>Publish window</button>
                {state.window && <button className="draft-button secondary" type="button" disabled={state.busy} onClick={() => save(null)}>Remove window</button>}
            </div>
        </form>
    </section>;
}
