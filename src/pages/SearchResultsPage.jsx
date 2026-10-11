import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import PRODUCTS from '../data/products';
import ProductCard from '../components/ProductCard';
import SortBar from '../components/SortBar';

function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const term = searchParams.get("q") || "";
    const [sortOption, setSortOption] = useState("latest");

    const results = term === ""
        ? []
        : PRODUCTS.filter((product) =>
            product.name.toLowerCase().includes(term.toLowerCase())
        );

    let sortedResults = [...results];
    if (sortOption === "latest") {
        sortedResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === "low") {
        sortedResults.sort((a, b) => a.price - b.price);
    } else if (sortOption === "high") {
        sortedResults.sort((a, b) => b.price - a.price);
    }

    return (
        <main>
            <section className="main-content-container search-results-page">
                <div className="main-content-header-wrapper">
                    <section className="verified-viscan-listings-header-wrapper">
                        <h3>Search results for "{term}"</h3>
                        <span>{sortedResults.length} found</span>
                    </section>
                    <SortBar sortOption={sortOption} onSelect={setSortOption} />
                </div>
                <section className="product-listings-container">
                    <div className="product-card-grid">
                        {sortedResults.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                    {sortedResults.length === 0 && (
                        <p>No products match "{term}". Try another keyword.</p>
                    )}
                </section>
                <p><Link to="/">← Back to home</Link></p>
            </section>
        </main>
    );
}

export default SearchResultsPage;