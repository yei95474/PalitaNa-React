import { Link } from 'react-router-dom';

function ProductCard({ product }) {
    return (
        <Link to={`/checkout/${product.id}`} className="product-card">
            <div className="product-card-image">
                <img src={product.image} alt={product.name} />
            </div>
            <h4 className="product-card-name">{product.name}</h4>
            <div className="product-price-and-condition-wrapper">
                <p className="product-card-price">₱{product.price.toLocaleString()}</p>
                <p className="product-card-condition">{product.condition}</p>
            </div>
        </Link>
    );
}

export default ProductCard;