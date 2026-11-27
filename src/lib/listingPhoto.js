import { supabase } from './supabase.js';

export const PHOTO_TYPES = 'image/jpeg,image/png,image/webp';

export async function prepareListingPhoto(file) {
    if (!PHOTO_TYPES.split(',').includes(file.type)) {
        throw new Error('Choose a JPEG, PNG, or WebP photo.');
    }
    if (file.size > 12 * 1024 * 1024) {
        throw new Error('Choose a photo smaller than 12 MB.');
    }

    const bitmap = await createImageBitmap(file).catch(() => {
        throw new Error('This photo could not be opened.');
    });
    try {
        const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.78));
        if (!blob || blob.type !== 'image/webp' || blob.size > 2 * 1024 * 1024) {
            throw new Error('This photo could not be compressed. Choose a smaller image.');
        }
        return blob;
    } finally {
        bitmap.close();
    }
}

export async function saveListingPhoto(userId, photo, listingId) {
    if (!supabase) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), { once: true });
            reader.addEventListener('error', () => reject(new Error('Could not read the photo.')), { once: true });
            reader.readAsDataURL(photo);
        });
    }

    const storage = supabase.storage.from('draft-listing-photos');
    const path = userId + '/' + listingId + '/' + crypto.randomUUID() + '.webp';
    const { error } = await storage.upload(path, photo, { contentType: photo.type });
    if (error) throw error;
    return storage.getPublicUrl(path).data.publicUrl;
}
