import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="navbar-container">
            <ul className="navbar-left">
                <li><Link to="/page-under-development">ABOUT</Link></li>
                <li><Link to="/page-under-development">LIST AN ITEM</Link></li>
            </ul>
            <ul className="navbar-right">
                <li><Link to="/page-under-development">FEEDBACK</Link></li>
                <li><Link to="/page-under-development">NOTIFICATIONS</Link></li>
                <li>LOGIN | SIGN-UP</li>
            </ul>
        </nav>
    );
}

export default Navbar;
