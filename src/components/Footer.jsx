import { Link } from 'react-router-dom';

function Footer() {
    return (
        <footer className="footer-container">
            <div className="footer-content-wrapper">
                <div className="footer-column">
                    <nav className="footer-fieldset-wrapper">
                        <fieldset className="footer-about-us-section">
                            <legend>Palita-Na</legend>
                            <Link to="/page-under-development">About Us</Link>
                            <Link to="/page-under-development">Terms and Conditions</Link>
                            <Link to="/page-under-development">Privacy Policy</Link>
                            <Link to="/page-under-development">How it Works</Link>
                        </fieldset>
                        <fieldset className="footer-contact-us-section">
                            <legend>Contact Us</legend>
                            <Link to="/page-under-development">Facebook</Link>
                            <Link to="/page-under-development">Tiktok</Link>
                            <Link to="/page-under-development">Instagram</Link>
                            <Link to="/page-under-development">Email</Link>
                        </fieldset>
                        <fieldset className="footer-shop-section">
                            <legend>Shop</legend>
                            <Link to="/page-under-development">Categories</Link>
                            <Link to="/page-under-development">New Arrivals</Link>
                            <Link to="/page-under-development">List an Item</Link>
                        </fieldset>
                    </nav>
                    <div className="footer-tagline-with-slogan-wrapper">
                        <Link to="/"><img src="/images/PalitaNa LogoWithText.png" alt="Palita-Na-with-Tagline" /></Link>
                        <p className="footer-slogan">0% Commission • 100% In-Person Safe Trades on VSU Campus.</p>
                    </div>
                </div>
                <section className="footer-legal-section">
                    <p>© 2026 Palita-Na. All rights reserved.</p>
                    <p>Developed by 73yel</p>
                </section>
            </div>
        </footer>
    );
}

export default Footer;
