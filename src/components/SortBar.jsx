function SortBar({ sortOption, onSelect }) {
    return (
        <section className="sort-bar-wrapper">
            <span>Sort By:</span>
            <button
                type="button"
                className={sortOption === "latest" ? "sort-option-btn sort-option-btn-selected" : "sort-option-btn"}
                onClick={() => onSelect("latest")}
            >
                Latest Listed
            </button>
            <button
                type="button"
                className={sortOption === "low" ? "sort-option-btn sort-option-btn-selected" : "sort-option-btn"}
                onClick={() => onSelect("low")}
            >
                Price: Low-High
            </button>
            <button
                type="button"
                className={sortOption === "high" ? "sort-option-btn sort-option-btn-selected" : "sort-option-btn"}
                onClick={() => onSelect("high")}
            >
                Price: High-Low
            </button>
        </section>
    );
}

export default SortBar;