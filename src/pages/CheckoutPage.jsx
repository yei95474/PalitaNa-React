import { useParams, Link } from 'react-router-dom';
import PRODUCTS from '../data/products';

function CheckoutPage() {
    const { id } = useParams();
    const product = PRODUCTS.find((p) => p.id === Number(id));

    if (!product) {
        return (
            <main>
                <p>Product not found.</p>
                <Link to="/">Go back home</Link>
            </main>
        );
    }

    return (
        <main>
            <div className="main-content-container">
                <div className="product-wrapper">
                    <img src={product.image} alt={product.name} />

                    <div className="product-info-wrapper">
                        <h2>{product.name}</h2>
                        <h1>₱{product.price.toLocaleString()}</h1>
                        <p>{product.condition}</p>
                        <div className="product-btn-wrapper">
                            <button type="button" className="checkout-btn">Buy</button>
                            <button type="button" className="add-to-cart-btn">Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default CheckoutPage;