import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar-container">
            <ul className="navbar-left">
                <li className="navbar-mobile-hide"><Link to="/page-under-development">ABOUT</Link></li>
                <li className="navbar-mobile-hide"><Link to="/page-under-development">LIST AN ITEM</Link></li>
                <li className="navbar-mobile-only"><Link to="/">HOME</Link></li>
            </ul>
            <ul className="navbar-right">
                <li className="navbar-mobile-hide"><Link to="/page-under-development">FEEDBACK</Link></li>
                <li className="navbar-mobile-hide"><Link to="/page-under-development">NOTIFICATIONS</Link></li>
                <li className="navbar-mobile-only"><Link to="/page-under-development">ABOUT</Link></li>
                <li><Link to="/login">LOGIN | SIGN-UP</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
