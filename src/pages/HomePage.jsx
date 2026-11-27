import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Categories from '../components/Categories.jsx';
import FiltersSidebar from '../components/FiltersSidebar.jsx';
import ProductCard from '../components/ProductCard.jsx';
import SortBar from '../components/SortBar.jsx';
import useIsMobile from '../hooks/useIsMobile.js';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { campusDay, PUBLIC_SPOTS, pickupWindow } from '../lib/buyer.js';
import { loadAvailability } from '../lib/campusMatching.js';

const PAGE_SIZE = 16;
const QUICK_AREAS = ['Inside VSU', 'Brgy. Pangasugan', 'Brgy. Kilim'];

function CampusWindow({ params, onApply }) {
    const [error, setError] = useState('');
    return <details className="browse-window" open={params.has('spot') || undefined}>
        <summary>Between Classes <span>Find a pickup window</span></summary>
        <form className="draft-form" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const date = form.get('date');
            const start = form.get('start');
            const end = form.get('end');
            try {
                pickupWindow(date, start, end);
                setError('');
                onApply({ spot: form.get('spot'), date, start, end });
            } catch (problem) { setError(problem.message); }
        }}>
            <div className="window-fields">
                <label className="draft-field">Landmark<select name="spot" defaultValue={params.get('spot') ?? ''} required>
                    <option value="" disabled>Choose a landmark</option>{PUBLIC_SPOTS.map((spot) => <option key={spot}>{spot}</option>)}
                </select></label>
                <label className="draft-field">Date (PHT)<input name="date" type="date" defaultValue={params.get('date') ?? ''} min={campusDay()} required /></label>
                <label className="draft-field">From<input name="start" type="time" defaultValue={params.get('start') ?? ''} required /></label>
                <label className="draft-field">Until<input name="end" type="time" defaultValue={params.get('end') ?? ''} required /></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="draft-actions">
                <button className="draft-button">Find available listings</button>
                {params.has('spot') && <button type="button" className="draft-button secondary" onClick={() => onApply({ spot: '', date: '', start: '', end: '' })}>Clear window</button>}
            </div>
        </form>
    </details>;
}

function matchWindow(params, now) {
    const spot = params.get('spot');
    if (!PUBLIC_SPOTS.includes(spot)) return null;
    try { return { spot, ...pickupWindow(params.get('date'), params.get('start'), params.get('end'), now) }; }
    catch { return null; }
}

function Browse({ term, category, params, setParams }) {
    const { products, loading, error, refresh } = useMarketplace();
    const [priceInput, setPriceInput] = useState(null);
    const [priceError, setPriceError] = useState('');
    const [availability, setAvailability] = useState(() => ({ rows: [], loading: true, error: '', checkedAt: Date.now() }));
    const [availabilityRetry, setAvailabilityRetry] = useState(0);
    const filtersDialog = useRef(null);
    const isMobile = useIsMobile();
    const locations = params.getAll('area');
    const conditions = params.getAll('condition');
    const price = { min: params.get('min') ?? '', max: params.get('max') ?? '' };
    const sort = params.get('sort') || 'latest';
    const page = Number(params.get('page')) || 1;
    const school = params.get('collection') === 'school';
    const preferred = matchWindow(params, availability.checkedAt);

    useEffect(() => {
        let active = true;
        loadAvailability().then(
            (rows) => active && setAvailability({ rows, loading: false, error: '', checkedAt: Date.now() }),
            () => active && setAvailability({ rows: [], loading: false, error: 'Could not load seller availability.', checkedAt: Date.now() }),
        );
        return () => { active = false; };
    }, [availabilityRetry]);

    function change(changes, replace = true) {
        const next = new URLSearchParams(params);
        if (!('page' in changes)) next.delete('page');
        for (const [key, value] of Object.entries(changes)) {
            next.delete(key);
            for (const item of Array.isArray(value) ? value : [value]) if (item) next.append(key, item);
        }
        setParams(next, { replace });
    }

    function toggle(key, values, value) {
        change({ [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] });
    }

    const pendingPrice = priceInput ?? price;
    function applyPrice() {
        const { min, max } = pendingPrice;
        if (Number(min) < 0 || Number(max) < 0 || (max !== '' && Number(min) > Number(max))) {
            setPriceError('Enter a valid minimum and maximum price.');
            return;
        }
        setPriceError('');
        setPriceInput(null);
        change({ min, max });
    }

    const search = term.toLowerCase();
    const activeWindows = availability.rows.filter(({ until }) => Date.parse(until) > availability.checkedAt);
    const windows = new Map(activeWindows.map((entry) => [entry.seller_id, entry]));
    const matchingSellers = preferred && new Set(activeWindows.filter((entry) =>
        entry.spot === preferred.spot && Date.parse(entry.from) < Date.parse(preferred.until) &&
        Date.parse(entry.until) > Math.max(availability.checkedAt, Date.parse(preferred.from)),
    ).map(({ seller_id }) => seller_id));
    const results = products.filter((item) =>
        item.status === 'available' &&
        (!category || item.category === category) &&
        (!school || item.category === 'Hobbies & Stationery' || /textbook|calculator|backpack|desk lamp|notebook/i.test(item.name)) &&
        (!search || [item.name, item.description, item.category, item.location].some((value) => value?.toLowerCase().includes(search))) &&
        (!locations.length || locations.includes(item.location)) &&
        (!conditions.length || conditions.includes(item.condition)) &&
        (price.min === '' || item.price >= Number(price.min)) &&
        (price.max === '' || item.price <= Number(price.max)) &&
        (!matchingSellers || matchingSellers.has(item.user_id)),
    ).sort((a, b) => {
        if (sort === 'low') return a.price - b.price;
        if (sort === 'high') return b.price - a.price;
        return b.created_at.localeCompare(a.created_at);
    });

    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    const current = Math.max(1, Math.min(page, totalPages));
    const start = (current - 1) * PAGE_SIZE;
    const visible = results.slice(start, start + PAGE_SIZE);
    const title = term ? 'Results for “' + term + '”' : category || (school ? 'School Essentials' : 'Campus listings');
    const waiting = loading || (preferred && availability.loading);
    const unavailable = error || (preferred && availability.error);
    const filters = <FiltersSidebar selectedLocations={locations} selectedConditions={conditions}
        onToggleLocation={(value) => toggle('area', locations, value)}
        onToggleCondition={(value) => toggle('condition', conditions, value)}
        onClearAll={() => { setPriceInput(null); setPriceError(''); change({ area: [], condition: [], min: '', max: '', collection: '' }); }}
        minPrice={pendingPrice.min} maxPrice={pendingPrice.max}
        onMinPriceChange={(min) => setPriceInput({ ...pendingPrice, min })}
        onMaxPriceChange={(max) => setPriceInput({ ...pendingPrice, max })}
        onApplyPrice={applyPrice} priceError={priceError} />;

    return <>
        <section className="campus-discovery" aria-labelledby="campus-market-heading">
            <div className="campus-discovery-main">
                <div><h1 id="campus-market-heading">Shop around VSU</h1>
                    <p>Find items nearby and meet your seller on campus.</p></div>
                <Link className="campus-wanted-link" to="/wanted">Campus Wanted Board <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="campus-chips" aria-label="Quick filters">
                {QUICK_AREAS.map((area) => <button type="button" className="campus-chip" key={area}
                    aria-pressed={locations.includes(area)} onClick={() => toggle('area', locations, area)}>{area}</button>)}
                <button type="button" className="campus-chip" aria-pressed={price.max === '300'} onClick={() => {
                    setPriceInput(null); change({ max: price.max === '300' ? '' : '300', min: '' });
                }}>Under ₱300</button>
                <button type="button" className="campus-chip" aria-pressed={school} onClick={() => change({ collection: school ? '' : 'school' })}>School Essentials</button>
            </div>
            <CampusWindow key={[params.get('spot'), params.get('date'), params.get('start'), params.get('end')].join('|')} params={params} onApply={change} />
        </section>
        <Categories selected={category} />
        <div className="content-wrapper buyer-browse">
            {!isMobile && filters}
            <main>
                <section className="main-content-container">
                    <div className="main-content-header-wrapper">
                        <div className="verified-viscan-listings-header-wrapper">
                            <h3>{title}</h3>
                            {!waiting && !unavailable && <span>{results.length} campus finds</span>}
                        </div>
                        <div className="buyer-sort">
                            {isMobile ? <>
                                <button type="button" className="draft-button secondary" onClick={() => filtersDialog.current?.showModal()}>Filters</button>
                                <select className="buyer-sort-select" value={sort} aria-label="Sort listings"
                                    onChange={(event) => change({ sort: event.target.value === 'latest' ? '' : event.target.value })}>
                                    <option value="latest">Latest listed</option>
                                    <option value="low">Lowest price</option>
                                    <option value="high">Highest price</option>
                                </select>
                            </> : <SortBar sortOption={sort} onSelect={(value) => change({ sort: value === 'latest' ? '' : value })} />}
                        </div>
                    </div>
                    {isMobile && <dialog ref={filtersDialog} className="filters-sheet" aria-label="Listing filters">
                        {filters}
                        <div className="sheet-actions"><button type="button" className="draft-button" onClick={() => filtersDialog.current?.close()}>Show results</button></div>
                    </dialog>}
                    {(term || category) && <Link className="text-link" to="/">Browse all listings</Link>}
                    {waiting && <p role="status" className="market-state">Loading listings.</p>}
                    {!waiting && unavailable && <p role="alert" className="market-state">
                        {error ? 'Could not load listings.' : availability.error}{' '}
                        <button type="button" className="text-link" onClick={() => error ? refresh() : setAvailabilityRetry((count) => count + 1)}>Try again</button>
                    </p>}
                    {!waiting && !unavailable && !results.length && <div className="market-state">
                        <p>{preferred ? 'No listings match this pickup window.' : 'No listings match your search or filters.'}</p>
                        <Link className="draft-button secondary" to={'/wanted' + (term ? '?q=' + encodeURIComponent(term) : '')}>Post a wanted item</Link>
                    </div>}
                    {!waiting && !unavailable && results.length > 0 && <>
                        <div className="product-listings-container">
                            <div className="product-card-grid">{visible.map((product) => <ProductCard key={product.id} product={product} window={windows.get(product.user_id)} />)}</div>
                        </div>
                        <div className="showing-page-and-pagination-wrapper">
                            <p>Showing {start + 1}–{start + visible.length} of {results.length}</p>
                            {totalPages > 1 && <nav className="pagination" aria-label="Listing pages">
                                <button type="button" className="pagination-btn" disabled={current <= 1} onClick={() => change({ page: current - 1 }, false)}>Prev</button>
                                <span>Page {current} of {totalPages}</span>
                                <button type="button" className="pagination-btn" disabled={current >= totalPages} onClick={() => change({ page: current + 1 }, false)}>Next</button>
                            </nav>}
                        </div>
                    </>}
                </section>
            </main>
        </div>
    </>;
}

export default function HomePage() {
    const [params, setParams] = useSearchParams();
    const term = params.get('q')?.trim() ?? '';
    const category = params.get('category') ?? '';
    return <Browse key={JSON.stringify([term, category])} term={term} category={category} params={params} setParams={setParams} />;
}
