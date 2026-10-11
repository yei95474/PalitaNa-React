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
                        <svg height="19" viewBox="0 0 19 19" width="19" className="search-icon" fill="currentColor">
                            <g fillRule="evenodd" stroke="none" strokeWidth="1">
                                <g transform="translate(-1016 -32)">
                                    <g>
                                        <g transform="translate(405 21)">
                                            <g transform="translate(611 11)">
                                                <path
                                                    d="m8 16c4.418278 0 8-3.581722 8-8s-3.581722-8-8-8-8-3.581722-8 8-3.581722 8 8 8zm0-2c-3.3137085 0-6-2.6862915-6-6s2.6862915-6 6-6 6-2.6862915 6 6 6z">
                                                </path>
                                                <path
                                                    d="m12.2972351 13.7114222 4.9799555 4.919354c.3929077.3881263 1.0260608.3842503 1.4141871-.0086574.3881263-.3929076.3842503-1.0260607-.0086574-1.414187l-4.9799554-4.919354c-.3929077-.3881263-1.0260608-.3842503-1.4141871.0086573-.3881263.3929077-.3842503 1.0260608.0086573 1.414187z">
                                                </path>
                                            </g>
                                        </g>
                                    </g>
                                </g>
                            </g>
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