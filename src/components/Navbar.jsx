import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
    const { user } = useAuth();
    return <nav className="navbar-container buyer-top-nav" aria-label="Main navigation">
        <ul className="navbar-left">
            <li><Link to="/">Campus market</Link></li>
            <li><Link to="/wanted">Wanted board</Link></li>
        </ul>
        <ul className="navbar-right">
            <li><Link to="/list-an-item">List an item</Link></li>
            {user ? <>
                <li><Link to="/saved-items">Saved</Link></li>
                <li><Link to="/pickup-requests">Pickups</Link></li>
                <li><Link to="/account">Account</Link></li>
            </> : <li><Link to="/login">Log in / Sign up</Link></li>}
        </ul>
    </nav>;
}
