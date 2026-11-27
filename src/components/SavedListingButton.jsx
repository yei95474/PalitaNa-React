import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSaved } from '../context/SavedContext.jsx';

export default function SavedListingButton({ id, name, compact = false }) {
    const { user } = useAuth();
    const { ids, loading, pending, save } = useSaved();
    const { pathname, search } = useLocation();
    const saved = ids.includes(id);
    const className = compact ? 'card-save' : 'draft-button secondary';
    const label = (saved ? 'Unsave ' : 'Save ') + name;
    const content = compact ? <span aria-hidden="true">{saved ? '♥' : '♡'}</span> : saved ? 'Saved' : 'Save item';

    return user ? <button className={className} type="button" aria-label={label} aria-pressed={saved}
        disabled={loading || pending.includes(id)} onClick={() => save(id, !saved)}>{content}</button>
        : <Link className={className} aria-label={label} to="/login" state={{ from: pathname + search, save: id }}>{content}</Link>;
}
