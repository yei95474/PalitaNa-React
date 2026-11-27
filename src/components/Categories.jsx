import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CATEGORIES } from '../constants.js';

export default function Categories({ selected }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <nav className={'categories' + (expanded ? ' categories-expanded' : '')} aria-label="Categories">
            <ul id="market-categories">
                {CATEGORIES.map((name) => (
                    <li key={name}>
                        <Link aria-current={selected === name ? 'page' : undefined}
                            to={selected === name ? '/' : '/search?category=' + encodeURIComponent(name)}>{name}</Link>
                    </li>
                ))}
            </ul>
            <button type="button" className="view-all-categories" aria-expanded={expanded}
                aria-controls="market-categories" onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Show less ↑' : 'View all →'}
            </button>
        </nav>
    );
}
