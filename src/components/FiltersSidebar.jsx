import useIsMobile from '../hooks/useIsMobile';

const LOCATIONS = ["Brgy. Kilim", "Brgy. Pangasugan", "Inside VSU", "Brgy. Patag", "Brgy. Gabas", "Brgy. Utod", "Baybay City Proper"];
const CONDITIONS = ["Brand New (Sealed)", "Like New", "Good Condition", "Pre-loved", "Damaged"];

function FiltersSidebar({ selectedLocations, selectedConditions, onToggleLocation, onToggleCondition, onClearAll, minPrice, maxPrice, onMinPriceChange, onMaxPriceChange, onApplyPrice }) {
    const isMobile = useIsMobile();

    return (
        <aside className="refine-finds-container">
            <section className="refine-finds-container-wrapper">
                <div className="refine-finds-header-wrapper">
                    <div className="svg-and-header-wrapper">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 13.5V9H7.5V10.5H13.5V12H7.5V13.5H6ZM0 12V10.5H4.5V12H0ZM3 9V7.5H0V6H3V4.5H4.5V9H3ZM6 7.5V6H13.5V7.5H6ZM9 4.5V0H10.5V1.5H13.5V3H10.5V4.5H9ZM0 3V1.5H7.5V3H0Z" fill="#00652C" />
                        </svg>
                        <h3>Refine Finds</h3>
                    </div>
                    <button type="button" className="clear-filters-btn" onClick={onClearAll}>Clear All</button>
                </div>
                <details className="refine-finds-details" open={!isMobile}>
                    <summary>Filter Options</summary>
                    <form>
                    <fieldset className="refine-finds-location-fieldset">
                        <legend>LOCATION</legend>
                        {LOCATIONS.map((name) => (
                            <label key={name}>
                                <input
                                    type="checkbox"
                                    checked={selectedLocations.includes(name)}
                                    onChange={() => onToggleLocation(name)}
                                />
                                {name}
                            </label>
                        ))}
                    </fieldset>

                    <fieldset className="refine-finds-pricerange-fieldset">
                        <legend>PRICE RANGE (₱)</legend>
                        <div className="refine-finds-pricerange-fieldset-input-wrapper">
                            <input
                                type="number"
                                placeholder="min"
                                value={minPrice}
                                onChange={(e) => onMinPriceChange(e.target.value)}
                            />
                            <span>-</span>
                            <input
                                type="number"
                                placeholder="max"
                                value={maxPrice}
                                onChange={(e) => onMaxPriceChange(e.target.value)}
                            />
                        </div>
                        <div className="refine-finds-pricerange-fieldset-applyfilter-wrapper">
                            <button type="button" className="apply-filter-btn" onClick={onApplyPrice}>Apply Filter</button>
                        </div>
                    </fieldset>

                    <fieldset className="refine-finds-itemcondition-fieldset">
                        <legend>ITEM CONDITION</legend>
                        {CONDITIONS.map((name) => (
                            <label key={name}>
                                <input
                                    type="checkbox"
                                    checked={selectedConditions.includes(name)}
                                    onChange={() => onToggleCondition(name)}
                                />
                                {name}
                            </label>
                        ))}
                    </fieldset>
                    </form>
                </details>
            </section>
        </aside>
    );
}



export default FiltersSidebar;
