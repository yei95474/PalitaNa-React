/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { loadSaved, setSaved } from '../lib/campus.js';

const SavedContext = createContext(null);

function SavedSession({ user, children }) {
    const [result, setResult] = useState({ ids: [], loading: Boolean(user), error: '' });
    const [pending, setPending] = useState([]);
    const [attempt, setAttempt] = useState(0);
    const latestResume = useRef('');
    const inFlight = useRef(new Set());
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        let active = true;
        loadSaved(user).then(
            (ids) => active && setResult({ ids, loading: false, error: '' }),
            () => active && setResult({ ids: [], loading: false, error: 'Could not load saved items.' }),
        );
        return () => { active = false; };
    }, [user, attempt]);

    async function save(id, saved) {
        if (!user || inFlight.current.has(id)) return;
        inFlight.current.add(id);
        setPending((ids) => [...ids, id]);
        try {
            await setSaved(user, id, saved);
            setResult((current) => ({ ...current, ids: saved ? [...new Set([...current.ids, id])] : current.ids.filter((value) => value !== id), error: '' }));
        } catch (problem) {
            setResult((current) => ({ ...current, error: problem.message }));
        } finally {
            inFlight.current.delete(id);
            setPending((ids) => ids.filter((value) => value !== id));
        }
    }

    useEffect(() => {
        const id = location.state?.save;
        if (!user || result.loading || typeof id !== 'string' || latestResume.current === location.key) return;
        latestResume.current = location.key;
        if (!result.ids.includes(id)) void save(id, true);
        navigate(location.pathname + location.search, { replace: true, state: null, preventScrollReset: true });
    });

    return <SavedContext.Provider value={{ ...result, pending, save, refreshSaved: () => setAttempt((count) => count + 1) }}>
        {children}
    </SavedContext.Provider>;
}

export function SavedProvider({ children }) {
    const { user } = useAuth();
    return <SavedSession key={user?.id ?? 'guest'} user={user}>{children}</SavedSession>;
}

export const useSaved = () => useContext(SavedContext);
