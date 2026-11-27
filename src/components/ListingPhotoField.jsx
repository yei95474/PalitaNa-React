import { useEffect, useRef, useState } from 'react';
import { PHOTO_TYPES, prepareListingPhoto } from '../lib/listingPhoto.js';

function PhotoPreview({ photo }) {
    const imageRef = useRef(null);

    useEffect(() => {
        const nextUrl = URL.createObjectURL(photo);
        imageRef.current.src = nextUrl;
        return () => URL.revokeObjectURL(nextUrl);
    }, [photo]);

    return <img ref={imageRef} alt="New listing photo preview" />;
}

export default function ListingPhotoField({ busy, existing, photo, onChange, removed, onRemove, onPreparing }) {
    const [error, setError] = useState('');

    async function select(event) {
        const chosen = event.currentTarget.files[0];
        event.currentTarget.value = '';
        if (!chosen) return;
        setError('');
        onPreparing(true);
        try {
            onChange(await prepareListingPhoto(chosen));
        } catch (problem) {
            setError(problem.message);
        } finally {
            onPreparing(false);
        }
    }

    return (
        <div className="draft-field listing-photo-field">
            <label htmlFor="listing-photo">Listing photo (optional)</label>
            {photo ? <PhotoPreview photo={photo} /> : existing && !removed && <img src={existing} alt="Current listing photo" />}
            <input id="listing-photo" type="file" accept={PHOTO_TYPES} onChange={select} disabled={busy} />
            <p className="draft-muted">JPEG, PNG, or WebP, up to 12 MB.</p>
            {error && <p role="alert" className="form-error">{error}</p>}
            {(photo || (existing && !removed)) && <button type="button" className="text-link" onClick={onRemove} disabled={busy}>Remove photo</button>}
        </div>
    );
}
