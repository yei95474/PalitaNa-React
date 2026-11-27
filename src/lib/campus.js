import { supabase } from './supabase.js';
import { readLocal, writeLocal } from './demo.js';

const manila = new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila',
});

export const displayPickupTime = (value) => manila.format(new Date(value)) + ' PHT';

async function result(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function collect(query) {
    const rows = [];
    for (let start = 0; ; start += 500) {
        const next = await result(query(start));
        rows.push(...next);
        if (next.length < 500) return rows;
    }
}

export async function loadSaved(user) {
    if (supabase) {
        const rows = await collect((start) => supabase.from('draft_saved_listings').select('listing_id')
            .order('listing_id').range(start, start + 499));
        return rows.map((row) => row.listing_id);
    }
    return readLocal('saved:' + user.id, []);
}

export async function setSaved(user, listing, saved) {
    if (supabase) {
        const table = supabase.from('draft_saved_listings');
        if (!saved) return result(table.delete().eq('listing_id', listing));
        const { error } = await table.insert({ listing_id: listing });
        if (error && error.code !== '23505') throw error;
        return;
    }
    const key = 'saved:' + user.id;
    const ids = readLocal(key, []).filter((id) => id !== listing);
    writeLocal(key, saved ? [...ids, listing] : ids);
}

export async function loadSellerReviews(sellerId) {
    if (supabase) return collect((start) => supabase.from('draft_seller_reviews').select('*')
        .eq('seller_id', sellerId).order('created_at', { ascending: false }).order('request_id').range(start, start + 499));
    return readLocal('reviews', []).filter((row) => row.seller_id === sellerId);
}

export async function loadRequestReview(requestId) {
    if (supabase) return result(supabase.from('draft_seller_reviews').select('*').eq('request_id', requestId).maybeSingle());
    return readLocal('reviews', []).find((row) => row.request_id === requestId) ?? null;
}

export async function submitReview(user, pickup, rating, body) {
    const payload = { request_id: pickup.id, seller_id: pickup.seller_id, rating, body };
    if (supabase) return result(supabase.from('draft_seller_reviews').insert(payload).select().single());
    const request = readLocal('requests', []).find((row) => row.id === pickup.id);
    if (request?.status !== 'completed' || request.buyer_id !== user.id) throw new Error('Complete this pickup before leaving a review.');
    const reviews = readLocal('reviews', []);
    if (reviews.some((row) => row.request_id === pickup.id)) throw new Error('You already reviewed this trade.');
    const entry = { ...payload, created_at: new Date().toISOString() };
    writeLocal('reviews', [entry, ...reviews]);
    return entry;
}

export async function loadMessages(user, requestId, limit) {
    if (supabase) {
        const rows = await result(supabase.from('draft_pickup_messages').select('*')
            .eq('request_id', requestId).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit));
        return rows.reverse();
    }
    const request = readLocal('requests', []).find((row) => row.id === requestId);
    if (![request?.buyer_id, request?.seller_id].includes(user.id)) return [];
    return readLocal('messages:' + requestId, []).slice(-limit);
}

export async function sendMessage(user, requestId, body) {
    if (!body || body.length > 1000) throw new Error('Enter a message between 1 and 1,000 characters.');
    if (supabase) return result(supabase.from('draft_pickup_messages').insert({ request_id: requestId, body }).select().single());
    const request = readLocal('requests', []).find((row) => row.id === requestId);
    if (![request?.buyer_id, request?.seller_id].includes(user.id) || !['pending', 'accepted'].includes(request.status)) {
        throw new Error('This pickup conversation is closed.');
    }
    const key = 'messages:' + requestId;
    const message = { id: crypto.randomUUID(), request_id: requestId, sender_id: user.id, body, created_at: new Date().toISOString() };
    writeLocal(key, [...readLocal(key, []), message]);
    return message;
}
