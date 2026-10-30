import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext.jsx';
import { LOCATIONS, CONDITIONS } from '../constants.js';

function ListAnItemPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [condition, setCondition] = useState(CONDITIONS[0]);
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [image, setImage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (name.trim() === '') {
            setError('Item name is required.');
            return;
        }

        const priceNumber = Number(price);
        if (price === '' || !Number.isInteger(priceNumber) || priceNumber < 0) {
            setError('Price must be a whole number of pesos.');
            return;
        }

        if (image.trim() === '') {
            setError('Image link is required.');
            return;
        }

        setSubmitting(true);

        const { error: insertError } = await supabase.from('products').insert({
            name: name.trim(),
            price: priceNumber,
            condition,
            location,
            image: image.trim(),
            date: new Date().toISOString().slice(0, 10),
            popularity: 0,
            user_id: user.id,
        });

        setSubmitting(false);

        if (insertError) {
            setError(insertError.message);
            return;
        }

        navigate('/');
    };

    return (
        <section className="main-content-container list-item-page-container">
            <h2>List an Item</h2>
            <p className="list-item-subtitle">Post a listing for the Viscan community.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="list-item-name">Item Name</label>
                    <input
                        id="list-item-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Scientific Calculator"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="list-item-price">Price (₱)</label>
                    <input
                        id="list-item-price"
                        type="number"
                        min="0"
                        step="1"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 250"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="list-item-condition">Condition</label>
                    <select
                        id="list-item-condition"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                    >
                        {CONDITIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="list-item-location">Location</label>
                    <select
                        id="list-item-location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        {LOCATIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="list-item-image">Image Link</label>
                    <input
                        id="list-item-image"
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="https://..."
                    />
                </div>

                {error && <p className="list-item-error">{error}</p>}

                <button type="submit" className="list-item-submit-btn" disabled={submitting}>
                    {submitting ? 'Posting...' : 'Post Listing'}
                </button>
            </form>
        </section>
    );
}

export default ListAnItemPage;