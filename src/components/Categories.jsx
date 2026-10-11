const CATEGORIES = [
    "Men's Apparel",
    "Women's Apparel",
    "Mobile & Gadgets",
    "Gifts",
    "Makeup & Fragrances",
    "Hobbies & Stationery",
    "Personal Care",
    "Food",
    "Groceries",
    "Entertainment",
    "Home & Living",
    "Men's Accessories",
    "Women's Accessories",
    "Home Appliances",
    "Toys & Collectibles",
    "Pets & Grooming",
];

function Categories() {
    return (
        <section className="categories">
            <ul>
                {CATEGORIES.map((name) => (<li key={name}>{name}</li>))}
            </ul>
            <a href="#" className="view-all-categories">View All -&gt;</a>
        </section>
    );
}

export default Categories;