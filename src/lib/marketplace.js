import { supabase } from './supabase.js';
import { demoListings, readLocal, writeLocal } from './demo.js';

async function unwrap(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function loadListings() {
    if (!supabase) return demoListings();
    const listings = [];
    for (let offset = 0; ; offset += 500) {
        const batch = await unwrap(supabase.from('draft_listings').select('*').order('id').range(offset, offset + 499));
        listings.push(...batch);
        if (batch.length < 500) return listings;
    }
}

export async function saveListing(user, values, id, editing) {
    const payload = { ...values, user_id: user.id, seller_name: user.user_metadata?.full_name || 'PalitaNa seller' };
    if (supabase) {
        const table = supabase.from('draft_listings');
        if (editing) return unwrap(table.update(payload).eq('id', id).select().single());
        const { data, error } = await table.insert({ ...payload, id }).select().single();
        if (!error) return data;
        if (error.code === '23505') {
            const existing = await unwrap(table.select('*').eq('id', id).eq('user_id', user.id).maybeSingle());
            if (existing && Object.entries(payload).every(([key, value]) => existing[key] === value)) return existing;
        }
        throw error;
    }
    const listings = demoListings();
    const original = listings.find((item) => item.id === id && item.user_id === user.id);
    if (editing && !original) throw new Error('This listing is no longer available to edit.');
    const listing = {
        ...original, ...payload, id,
        created_at: original?.created_at ?? new Date().toISOString(),
    };
    writeLocal('listings', [listing, ...listings.filter((item) => item.id !== listing.id)]);
    return listing;
}

export async function loadRequests(user) {
    if (supabase) return unwrap(supabase.from('draft_pickup_requests').select('*').order('created_at', { ascending: false }));
    return readLocal('requests', []).filter((row) => row.buyer_id === user.id || row.seller_id === user.id);
}
