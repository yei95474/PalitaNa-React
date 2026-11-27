export const LOCATIONS = ['Brgy. Kilim', 'Brgy. Pangasugan', 'Inside VSU', 'Brgy. Patag', 'Brgy. Gabas', 'Brgy. Utod', 'Baybay City Proper'];
export const CONDITIONS = ['Brand New (Sealed)', 'Like New', 'Good Condition', 'Pre-loved', 'Damaged'];
export const CATEGORIES = ["Men's Apparel", "Women's Apparel", 'Mobile & Gadgets', 'Gifts', 'Makeup & Fragrances', 'Hobbies & Stationery', 'Personal Care', 'Food', 'Groceries', 'Entertainment', 'Home & Living', "Men's Accessories", "Women's Accessories", 'Home Appliances', 'Toys & Collectibles', 'Pets & Grooming'];
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });
export const pesos = (amount) => currency.format(amount);
export const listingPath = (id) => '/checkout/' + id;
