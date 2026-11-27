import { useEffect, useLayoutEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import Navbar from './Navbar';
import SearchBar from './SearchBar';
import Footer from './Footer';
import useIsMobile from '../hooks/useIsMobile';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { SavedProvider, useSaved } from '../context/SavedContext.jsx';

const positions = new Map();
const nav = [
    { to: '/', label: 'Home', path: 'M3 11l9-7 9 7v9h-6v-6H9v6H3z' },
    { to: '/saved-items', label: 'Saved', path: 'M20.8 5.8a5 5 0 0 0-7.1 0L12 7.5l-1.7-1.7a5 5 0 0 0-7.1 7.1l1.7 1.7L12 21l7.1-6.4 1.7-1.7a5 5 0 0 0 0-7.1z' },
    { to: '/pickup-requests', label: 'Pickups', path: 'M4 5h16v15H4zM4 10h16M8 3v4m8-4v4m-8 8 2 2 5-4' },
    { to: '/account', label: 'Account', path: 'M5 21v-2a7 7 0 0 1 14 0v2M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0z' },
];

function ScrollPosition() {
    const { key, pathname } = useLocation();
    const navigation = useNavigationType();
    const { loading } = useMarketplace();
    const ready = !loading || !['/', '/search'].includes(pathname);
    useEffect(() => {
        const old = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        return () => { window.history.scrollRestoration = old; };
    }, []);

    useLayoutEffect(() => {
        if (!ready) return;
        const y = navigation === 'POP' ? positions.get(key) ?? 0 : navigation === 'REPLACE' ? window.scrollY : 0;
        window.scrollTo(0, y);
        const update = () => {
            if (positions.size >= 100 && !positions.has(key)) positions.delete(positions.keys().next().value);
            positions.set(key, window.scrollY);
        };
        window.addEventListener('scroll', update, { passive: true });
        return () => window.removeEventListener('scroll', update);
    }, [key, navigation, ready]);
    return null;
}

function SavedNotice() {
    const { error, refreshSaved } = useSaved();
    return error ? <div className="buyer-save-notice" role="alert">{error} <button className="text-link" onClick={refreshSaved}>Refresh saved items</button></div> : null;
}

export default function Layout() {
    const isMobile = useIsMobile();
    const { pathname } = useLocation();

    return <SavedProvider>
        <div className={isMobile ? 'layout-mobile' : 'layout-desktop'}>
            <ScrollPosition />
            <header className="header-container">
                <div className="navbar-and-search-wrapper"><Navbar /><SearchBar /></div>
            </header>
            <SavedNotice />
            <Outlet />
            <Footer />
            {isMobile && <nav className="buyer-bottom-nav" aria-label="Buyer navigation">
                {nav.map(({ to, label, path }) => <NavLink key={to} to={to} end={to === '/'}
                    className={({ isActive }) => isActive || (to === '/' && pathname === '/search') ? 'current' : ''}
                    aria-current={to === '/' && pathname === '/search' ? 'page' : undefined}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
                        <path d={path} />
                    </svg>
                    {label}
                </NavLink>)}
            </nav>}
        </div>
    </SavedProvider>;
}
