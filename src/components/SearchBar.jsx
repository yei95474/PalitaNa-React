import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext.jsx';

function SearchForm({ query }) {
    const navigate = useNavigate();
    const [text, setText] = useState(query);
    function submit(event) {
        event.preventDefault();
        const term = text.trim();
        navigate(term ? '/search?q=' + encodeURIComponent(term) : '/');
    }
    return (
        <form className="search_form" role="search" onSubmit={submit}>
            <div className="search-input-wrapper">
                <input name="search" aria-label="Search for products" placeholder="Search for products" value={text} onChange={(event) => setText(event.target.value)} />
                {text && <button type="button" className="clear-search-btn" aria-label="Clear search" onClick={() => {
                    setText('');
                    if (query) navigate('/');
                }}>×</button>}
            </div>
            <button className="search_bar" type="submit" aria-label="Search">
                <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="10" cy="10" r="7" /><path d="m16 16 5 5" />
                </svg>
            </button>
        </form>
    );
}

export default function SearchBar() {
    const [params] = useSearchParams();
    const { pathname } = useLocation();
    const { cartIds } = useMarketplace();
    const query = params.get('q') || '';
    return (
        <div className="header-with-search-wrapper">
            <div className="header-with-search">
                <Link to="/"><img src="/images/Logo-NoTagline.png" alt="PalitaNa home" /></Link>
                <SearchForm key={pathname + query} query={query} />
                <Link to="/cart" className="shopping-cart-btn header-cart" aria-label={'Cart, ' + cartIds.length + ' items'}>
                    <svg aria-hidden="true" viewBox="0 0 26.6 25.6" width="24" height="24">
                        <polyline fill="none" points="2 1.7 5.5 1.7 9.6 18.3 21.2 18.3 24.6 6.1 7 6.1" strokeLinecap="round" strokeWidth="2.5" />
                        <circle cx="10.7" cy="23" r="2.2" stroke="none" /><circle cx="19.7" cy="23" r="2.2" stroke="none" />
                    </svg>
                    <span>{cartIds.length}</span>
                </Link>
            </div>
        </div>
    );
}
