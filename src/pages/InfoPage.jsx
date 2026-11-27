import { Link } from 'react-router-dom';

const pages = {
    about: ['About PalitaNa', 'PalitaNa is a free marketplace for students, faculty, staff, and neighbors around Visayas State University. It helps the community browse, buy, and sell items nearby.'],
    'how-it-works': ['How it works', 'Find an item, add it to your cart, and send a pickup request. The seller can reply with a suggested meeting place and time. Inspect the item and pay the seller directly when you meet.', 'To sell, sign in and post an item. Use My Listings to update the details or mark the item sold once the trade is complete.'],
    terms: ['Marketplace terms', 'Post accurate listings for items you are allowed to sell. A pickup request starts a conversation. Confirm pickup details with the seller and agree on payment directly.'],
    privacy: ['Privacy', 'Listing details, pickup area, and the seller’s display name are public on the marketplace. Buyers and the relevant sellers can access their pickup requests, including the buyer’s contact email and any notes or replies.', 'In demo mode, accounts, listings, and requests stay in the current browser.'],
};

export default function InfoPage({ page }) {
    const content = pages[page];
    return <main className="draft-panel draft-form-panel">
        <h1>{content?.[0] ?? 'Page not found'}</h1>
        {content?.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <Link to="/" className="text-link">← Browse listings</Link>
    </main>;
}
