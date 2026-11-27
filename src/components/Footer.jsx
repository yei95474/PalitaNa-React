import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer-container">
            <div className="footer-content-wrapper">
                <div className="footer-column">
                    <nav className="footer-fieldset-wrapper" aria-label="Footer">
                        <fieldset>
                            <legend>PalitaNa</legend>
                            <Link to="/about">About us</Link>
                            <Link to="/how-it-works">How it works</Link>
                        </fieldset>
                        <fieldset>
                            <legend>Marketplace</legend>
                            <Link to="/">Browse listings</Link>
                            <Link to="/list-an-item">List an item</Link>
                        </fieldset>
                        <fieldset>
                            <legend>Information</legend>
                            <Link to="/terms">Terms</Link>
                            <Link to="/privacy">Privacy</Link>
                        </fieldset>
                    </nav>
                    <div className="footer-tagline-with-slogan-wrapper">
                        <Link to="/"><img src="/images/PalitaNa LogoWithText.png" alt="PalitaNa home" /></Link>
                        <p className="footer-slogan">0% commission · In-person trades around VSU.</p>
                    </div>
                </div>
                <div className="footer-legal-section"><p>© 2026 PalitaNa</p><p>Developed by 73yel</p></div>
            </div>
        </footer>
    );
}
