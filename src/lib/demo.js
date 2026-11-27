const namespace = 'palitana-draft-v1';
const photo = (id) => 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=840&q=80';

const samples = [
    ['Scientific Calculator FX-991EX', 750, 'Hobbies & Stationery', 'Inside VSU', 'Good Condition', 'https://minhajzone.com/wp-content/uploads/2026/01/Casio-Fx-991Ex-Plus-Scientific-calculator-fx-991ex-plus-calculator-calculator-6-150x267.jpg', 'Scientific calculator with slide-on cover. Bring your batteries if you want to test it at pickup.'],
    ['Wireless Over-Ear Headphones', 850, 'Mobile & Gadgets', 'Brgy. Pangasugan', 'Like New', photo('1505740420928-5e560c06d30e'), 'Padded over-ear headphones with charging cable.'],
    ['Android Phone · 64 GB', 3200, 'Mobile & Gadgets', 'Baybay City Proper', 'Good Condition', photo('1511707171634-5f897ff02aa9'), 'Unlocked phone with 64 GB storage and a clear case.'],
    ['Analog Wristwatch', 420, "Men's Accessories", 'Brgy. Kilim', 'Like New', photo('1523275335684-37898b6baf30'), 'Simple analog watch with an adjustable strap.'],
    ['Running Sneakers · Size 42', 950, "Men's Apparel", 'Inside VSU', 'Pre-loved', photo('1542291026-7eec264c27ff'), 'Lightweight running shoes with a red upper.'],
    ['Canvas Backpack · 25 L', 500, "Women's Accessories", 'Brgy. Patag', 'Good Condition', photo('1553062407-98eeb64c6a62'), 'Canvas daypack with a padded laptop sleeve.'],
    ['Literature Textbook · Vol. 2', 250, 'Hobbies & Stationery', 'Inside VSU', 'Pre-loved', photo('1544716278-ca5e3f4abd8c'), 'Paperback from a previous semester. A few pages have pencil notes.'],
    ['Mechanical Keyboard · 87 Keys', 1250, 'Mobile & Gadgets', 'Brgy. Gabas', 'Like New', photo('1587829741301-dc798b83add3'), 'Compact wired keyboard with a detachable cable.'],
];

const seed = samples.map(([name, price, category, location, condition, image, description], index) => ({
    id: 'sample-' + (index + 1), name, price, category, location, condition, image, description,
    created_at: new Date(Date.UTC(2026, 10, 24 - index)).toISOString(),
    user_id: 'demo-seller', seller_name: 'PalitaNa sample seller', status: 'available',
}));

export function readLocal(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(namespace + ':' + key)) ?? fallback;
    } catch {
        return fallback;
    }
}

export function writeLocal(key, value) {
    localStorage.setItem(namespace + ':' + key, JSON.stringify(value));
}

export const demoListings = () => readLocal('listings', seed);

async function passwordDigest(password, salt) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({
        name: 'PBKDF2', salt: encoder.encode(salt), iterations: 210000, hash: 'SHA-256',
    }, key, 256);
    return Array.from(new Uint8Array(hash)).join(',');
}

export async function demoSignIn({ email, password, fullName, username }, register) {
    const salt = crypto.randomUUID();
    const accounts = readLocal('accounts', {});
    const existing = accounts[email];
    if (!register) {
        if (!existing || existing.digest !== await passwordDigest(password, existing.salt)) {
            throw new Error('Check your email and password and try again.');
        }
        return existing.user;
    }
    if (existing) throw new Error('An account with this email already exists in this browser.');
    const user = { id: crypto.randomUUID(), email, user_metadata: { full_name: fullName, username } };
    const digest = await passwordDigest(password, salt);
    const latest = readLocal('accounts', {});
    if (latest[email]) throw new Error('An account with this email already exists in this browser.');
    writeLocal('accounts', { ...latest, [email]: { user, digest, salt } });
    return user;
}
