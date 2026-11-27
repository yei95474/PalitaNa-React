import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import SellerAvailability from '../components/SellerAvailability.jsx';

export default function AccountPage() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function leave() {
        setBusy(true);
        setError('');
        try {
            await signOut();
            navigate('/', { replace: true });
        } catch (problem) {
            setError(problem.message);
            setBusy(false);
        }
    }

    return <main className="draft-panel buyer-panel">
        <h1>Your account</h1>
        <p className="draft-muted">{user.user_metadata?.full_name || user.email}</p>
        <div className="account-links">
            <Link to="/saved-items">Saved items</Link>
            <Link to="/pickup-requests">Pickups</Link>
            <Link to="/wanted">Campus Wanted Board</Link>
            <Link to="/my-listings">My listings</Link>
            <Link to="/list-an-item">List an item</Link>
        </div>
        <SellerAvailability user={user} />
        {error && <p role="alert" className="form-error">{error}</p>}
        <button className="draft-button secondary" onClick={leave} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>
    </main>;
}
