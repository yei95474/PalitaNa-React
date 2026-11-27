import { useEffect, useRef, useState } from 'react';
import { displayPickupTime, loadMessages, sendMessage } from '../lib/campus.js';

export default function PickupChat({ request, user }) {
    const [result, setResult] = useState({ rows: [], loading: true, error: '' });
    const [limit, setLimit] = useState(25);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const fetchVersion = useRef(0);
    const canSend = ['pending', 'accepted'].includes(request.status);

    useEffect(() => {
        let active = true;
        async function refresh() {
            const version = ++fetchVersion.current;
            try {
                const rows = await loadMessages(user, request.id, limit);
                if (active && version === fetchVersion.current) setResult({ rows, loading: false, error: '' });
            } catch {
                if (active && version === fetchVersion.current) setResult((state) => ({
                    ...state, loading: false, error: 'Could not refresh chat. It will retry automatically.',
                }));
            }
        }
        refresh();
        const timer = setInterval(() => { if (!document.hidden) refresh(); }, 7000);
        return () => { active = false; clearInterval(timer); };
    }, [user, request.id, limit]);

    async function submit(event) {
        event.preventDefault();
        if (busy || !message.trim()) return;
        setBusy(true);
        setError('');
        try {
            const row = await sendMessage(user, request.id, message.trim());
            fetchVersion.current++;
            setResult((current) => ({ ...current, loading: false, rows: [...current.rows.filter((item) => item.id !== row.id), row] }));
            setMessage('');
        } catch (problem) {
            setError(problem.message);
        } finally {
            setBusy(false);
        }
    }

    return <div className="pickup-chat">
        {result.loading && <p role="status">Loading chat…</p>}
        {result.error && <p role="alert" className="form-error">{result.error}</p>}
        {result.rows.length >= limit && <button className="text-link" onClick={() => setLimit((value) => value + 25)}>Load older messages</button>}
        {result.rows.length ? <ol className="pickup-messages" aria-label="Conversation">
            {result.rows.map((row) => <li className={row.sender_id === user.id ? 'own-message' : ''} key={row.id}>
                <strong>{row.sender_id === user.id ? 'You' : request.seller_id === user.id ? 'Buyer' : 'Seller'}</strong>
                <span>{displayPickupTime(row.created_at)}</span>
                <p className="listing-description">{row.body}</p>
            </li>)}
        </ol> : !result.loading && <p className="draft-muted">No messages yet.</p>}
        {canSend ? <form className="draft-form" onSubmit={submit}>
            <label className="draft-field">Message<textarea rows="2" required maxLength="1000" value={message} onChange={(event) => setMessage(event.target.value)} /></label>
            {error && <p role="alert" className="form-error">{error}</p>}
            <button className="draft-button" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
        </form> : <p className="draft-muted">This conversation is closed.</p>}
    </div>;
}
