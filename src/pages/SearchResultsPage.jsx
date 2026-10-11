import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import ProductCard from '../components/ProductCard';
import SortBar from '../components/SortBar';

function SearchResultsPage() {
    const [searchParams] = useSearchParams();
    const term = searchParams.get("q") || "";
    const [sortOption, setSortOption] = useState("latest");
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        async function fetchProducts() {
            setIsLoading(true);
            const { data, error } = await supabase.from("products").select("*");
            if (error) {
                setLoadError(error.message);
            } else {
                setProducts(data);
            }
            setIsLoading(false);
        }
        fetchProducts();
    }, []);

    const results = term === ""
        ? []
        : products.filter((product) =>
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
                {isLoading && <p>Loading products...</p>}
                {loadError && <p>Could not load products: {loadError}</p>}
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