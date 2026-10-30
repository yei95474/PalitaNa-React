import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

function SearchBar() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const q = searchParams.get("q") || "";
    const [text, setText] = useState(q);

    const handleSearch = (e) => {
        e.preventDefault();
        const term = text.trim();
        if (term === "") return;
        navigate(`/search?q=${encodeURIComponent(term)}`);
    };

    return (
        <div className="header-with-search-wrapper">
            <section className="header-with-search">
                <Link to="/"><img src="/images/Logo-NoTagline.png" alt="PalitaNa Logo-NoTagline" /></Link>
                <form className="search_form" onSubmit={handleSearch}>
                    <div className="search-input-wrapper">
                        <input name="search" placeholder="Search for products" value={text} onChange={(e) => setText(e.target.value)} />
                        {text !== "" && (
                            <button type="button" className="clear-search-btn" onClick={() => setText("")}>
                                ✕
                            </button>
                        )}
                    </div>
                    {/* Search Button */}
                    <button className="search_bar" type="submit">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="search-icon">
                            <circle cx="10" cy="10" r="7" />
                            <line x1="16.5" y1="16.5" x2="21" y2="21" />
                        </svg>
                    </button>
                </form>
                {/* Shopping Cart */}
                <form>
                    <button className="shopping-cart-btn">
                        <svg viewBox="0 0 26.6 25.6" width="24" height="24">
                            <title>Shopping Cart Icon</title>
                            <polyline fill="none" points="2 1.7 5.5 1.7 9.6 18.3 21.2 18.3 24.6 6.1 7 6.1"
                                strokeLinecap="round" strokeMiterlimit="10"
                                strokeWidth="2.5">
                            </polyline>
                            <circle cx="10.7" cy="23" r="2.2" stroke="none"></circle>
                            <circle cx="19.7" cy="23" r="2.2" stroke="none"></circle>
                        </svg>
                    </button>
                </form>
            </section>
        </div>
    );
}

export default SearchBar;