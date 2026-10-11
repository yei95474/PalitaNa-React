import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

function CheckoutPage() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        async function fetchProduct() {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("products")
                .select("*")
                .eq("id", id)
                .maybeSingle();
            if (error) {
                setLoadError(error.message);
            } else {
                setProduct(data);
            }
            setIsLoading(false);
        }
        fetchProduct();
    }, [id]);

    if (isLoading) {
        return <main><p>Loading product...</p></main>;
    }

    if (loadError) {
        return (
            <main>
                <p>Could not load product: {loadError}</p>
                <Link to="/">Go back home</Link>
            </main>
        );
    }

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