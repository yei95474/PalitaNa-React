import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

export default function LoginPage() {
    const { user, loading, authenticate, recovery, finishRecovery } = useAuth();
    const { state } = useLocation();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const mode = params.get('mode') || 'login';
    const [visible, setVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const signUp = mode === 'signup';
    const forgot = mode === 'forgot' && supabase;
    const from = typeof state?.from === 'string' ? state.from : '';
    const pathname = from.split('?')[0];
    const destination = ['/', '/search', '/list-an-item', '/my-listings', '/checkout', '/pickup-requests', '/saved-items', '/account', '/wanted', '/cart'].includes(pathname) ||
        /^\/(?:my-listings\/[\w-]+\/edit|checkout\/[\w-]+|seller\/[\w-]+)$/.test(pathname) ? from : '/';
    const resume = typeof state?.save === 'string' ? { save: state.save } : null;

    if (loading) return <main className="draft-panel" role="status">Checking your account…</main>;
    if (user && !recovery) return <Navigate to={destination} state={resume} replace />;

    function switchMode(nextMode) {
        setError('');
        setNotice('');
        setParams(nextMode === 'login' ? {} : { mode: nextMode }, { replace: true, state });
    }

    async function submit(event) {
        event.preventDefault();
        if (busy) return;
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const email = data.email?.trim().toLowerCase();
        const fullName = data.fullName?.trim();
        setBusy(true);
        setError('');
        setNotice('');
        try {
            if (recovery) {
                if (data.password !== data.confirmPassword) throw new Error('Passwords do not match.');
                const result = await supabase.auth.updateUser({ password: data.password });
                if (result.error) throw result.error;
                finishRecovery();
                return;
            }
            if (forgot) {
                const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/login' });
                if (result.error) throw result.error;
                setNotice('If an account exists for this email, you’ll receive a reset link.');
                return;
            }
            if (signUp && (data.password !== data.confirmPassword || !fullName)) {
                throw new Error(!fullName ? 'Enter your full name.' : 'Passwords do not match.');
            }
            const signedIn = await authenticate({ email, fullName, username: data.username, password: data.password }, signUp);
            if (signedIn) navigate(destination, { replace: true, state: resume });
            else setNotice('Check your email for a confirmation link, then sign in.');
        } catch (problem) {
            setError(problem.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="draft-panel draft-form-panel auth-panel">
            {!recovery && !forgot && <div className="auth-tabs">
                <button type="button" className={'auth-tab' + (!signUp ? ' auth-tab-active' : '')} aria-pressed={!signUp} onClick={() => switchMode('login')}>Log In</button>
                <button type="button" className={'auth-tab' + (signUp ? ' auth-tab-active' : '')} aria-pressed={signUp} onClick={() => switchMode('signup')}>Sign Up</button>
            </div>}
            <h1>{recovery ? 'Set a new password' : forgot ? 'Reset your password' : signUp ? 'Create an Account' : 'Welcome Back'}</h1>
            {!supabase && <p className="draft-muted">Demo accounts and listings are saved in this browser. Use a sample email and password.</p>}
            <form className="draft-form" key={String(recovery) + mode} onSubmit={submit}>
                {signUp && !recovery && <label className="draft-field">Full name<input name="fullName" autoComplete="name" maxLength="100" required /></label>}
                {!recovery && <label className="draft-field">Email<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>}
                {signUp && !recovery && <label className="draft-field">Username<input name="username" autoComplete="username" pattern="[a-zA-Z0-9_]{3,30}" title="3–30 letters, numbers or underscores" required /></label>}
                {!forgot && <>
                    <label className="draft-field">{recovery ? 'New password' : 'Password'}
                        <input name="password" type={visible ? 'text' : 'password'} autoComplete={signUp || recovery ? 'new-password' : 'current-password'} minLength={signUp || recovery ? 8 : undefined} maxLength="128" required />
                    </label>
                    {(signUp || recovery) && <label className="draft-field">Confirm password
                        <input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength="8" maxLength="128" required />
                    </label>}
                    <label className="draft-checkbox"><input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Show password</label>
                </>}
                {signUp && !recovery && <div className="draft-checkbox">
                    <input type="checkbox" id="terms" required /><label htmlFor="terms">I agree to the <Link className="text-link" to="/terms" target="_blank">Terms</Link> and <Link className="text-link" to="/privacy" target="_blank">Privacy Policy</Link>.</label>
                </div>}
                {error && <p role="alert" className="form-error">{error}</p>}
                {notice && <p role="status">{notice}</p>}
                <button type="submit" className="draft-button auth-primary" disabled={busy}>
                    {busy ? 'Please wait…' : recovery ? 'Save password' : forgot ? 'Send reset link' : signUp ? 'Create Account' : 'Sign In'}
                </button>
                {supabase && !recovery && !signUp && <button type="button" className="text-link" onClick={() => switchMode(forgot ? 'login' : 'forgot')}>{forgot ? 'Back to sign in' : 'Forgot password?'}</button>}
            </form>
        </main>
    );
}
