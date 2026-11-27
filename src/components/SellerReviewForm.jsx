import { useEffect, useState } from 'react';
import { loadRequestReview, submitReview } from '../lib/campus.js';

export default function SellerReviewForm({ request, user }) {
    const [state, setState] = useState({ loading: true, existing: null, error: '' });
    const [attempt, setAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        loadRequestReview(request.id).then(
            (existing) => active && setState({ loading: false, existing, error: '' }),
            () => active && setState({ loading: false, existing: null, error: 'Could not check for an existing review.' }),
        );
        return () => { active = false; };
    }, [request.id, attempt]);

    async function submit(event) {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        setSaving(true);
        setError('');
        try {
            const existing = await submitReview(user, request, Number(values.get('rating')), values.get('review').trim());
            setState({ loading: false, existing, error: '' });
        } catch (problem) {
            setError(problem.message);
            if (problem.code === '23505') setAttempt((current) => current + 1);
        } finally {
            setSaving(false);
        }
    }

    if (state.loading) return <p role="status">Checking reviews…</p>;
    if (state.error) return <p role="alert">{state.error} <button className="text-link" onClick={() => setAttempt((current) => current + 1)}>Try again</button></p>;
    if (state.existing) return <p className="confirmation">Review posted · {state.existing.rating} / 5</p>;
    return <form className="draft-form" onSubmit={submit}>
        <label className="draft-field">Rating
            <select name="rating" defaultValue="" required>
                <option value="" disabled>Choose a rating</option>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
            </select>
        </label>
        <label className="draft-field">Public review (optional)<textarea name="review" rows="2" maxLength="500"
            placeholder="How well did the item match the listing? How did the meetup go?" /></label>
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="draft-button" disabled={saving} type="submit">{saving ? 'Posting…' : 'Post review'}</button>
    </form>;
}
