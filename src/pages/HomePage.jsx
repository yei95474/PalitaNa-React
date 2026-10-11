import Categories from '../components/Categories.jsx';
import FiltersSidebar from '../components/FiltersSidebar.jsx';
import ProductCard from '../components/ProductCard';
import SortBar from '../components/SortBar';
import PRODUCTS from '../data/products';
import { useState } from 'react';

const PAGE_SIZE = 16;

function toggleInList(list, value) {
    return list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
}

function HomePage() {
    const [sortOption, setSortOption] = useState("latest");
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [appliedPrice, setAppliedPrice] = useState({ min: "", max: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const handleToggleLocation = (location) => {
        setSelectedLocations(toggleInList(selectedLocations, location));
    };

    const handleToggleCondition = (condition) => {
        setSelectedConditions(toggleInList(selectedConditions, condition));
    };

    const handleApplyPrice = () => {
        setAppliedPrice({ min: minPrice, max: maxPrice });
    };

    const handleClearAll = () => {
        setSelectedLocations([]);
        setSelectedConditions([]);
        setMinPrice("");
        setMaxPrice("");
        setAppliedPrice({ min: "", max: "" });
    };

    const filteredProducts = PRODUCTS.filter((product) => {
        const matchesLocation =
            selectedLocations.length === 0 || selectedLocations.includes(product.location);
        const matchesCondition =
            selectedConditions.length === 0 || selectedConditions.includes(product.condition);
        const matchesMin = appliedPrice.min === "" || product.price >= Number(appliedPrice.min);
        const matchesMax = appliedPrice.max === "" || product.price <= Number(appliedPrice.max);
        return matchesLocation && matchesCondition && matchesMin && matchesMax;
    });

    let sortedProducts = [...filteredProducts];
    if (sortOption === "latest") {
        sortedProducts.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === "low") {
        sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortOption === "high") {
        sortedProducts.sort((a, b) => b.price - a.price);
    }

    const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * PAGE_SIZE;
    const pageProducts = sortedProducts.slice(startIndex, startIndex + PAGE_SIZE);

    return (
        <>
            <Categories />
            <div className="content-wrapper">
                <FiltersSidebar
                    selectedLocations={selectedLocations}
                    selectedConditions={selectedConditions}
                    onToggleLocation={handleToggleLocation}
                    onToggleCondition={handleToggleCondition}
                    onClearAll={handleClearAll}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onMinPriceChange={setMinPrice}
                    onMaxPriceChange={setMaxPrice}
                    onApplyPrice={handleApplyPrice}
                />
                <main>
                    <section className="main-content-container">
                        <div className="main-content-header-wrapper">
                            <section className="verified-viscan-listings-header-wrapper">
                                <h3>Verified Viscan Listings</h3>
                                <span>Show Campus n Campus Finds</span>
                            </section>
                            <SortBar sortOption={sortOption} onSelect={setSortOption} />
                        </div>

                        <section className="product-listings-container">
                            <div className="product-card-grid">
                                {pageProducts.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            {sortedProducts.length === 0 && (
                                <p>No products match your filters.</p>
                            )}
                        </section>

                        <section className="showing-page-and-pagination-wrapper">
                            <div className="showing-page">
                                <p>
                                    Showing {sortedProducts.length === 0 ? 0 : startIndex + 1}-{startIndex + pageProducts.length} of {sortedProducts.length} results
                                </p>
                            </div>
                            <div className="pagination">
                                <button
                                    type="button"
                                    className="pagination-btn"
                                    disabled={safePage === 1}
                                    onClick={() => setCurrentPage(safePage - 1)}
                                >
                                    Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                    <button
                                        key={number}
                                        type="button"
                                        className={number === safePage ? "pagination-btn pagination-btn-selected" : "pagination-btn"}
                                        onClick={() => setCurrentPage(number)}
                                    >
                                        {number}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="pagination-btn"
                                    disabled={safePage === totalPages}
                                    onClick={() => setCurrentPage(safePage + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </section>
                    </section>
                </main>
            </div>
        </>
    );
}

export default HomePage;
