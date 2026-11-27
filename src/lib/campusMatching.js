import { supabase } from './supabase.js';
import { demoListings, readLocal, writeLocal } from './demo.js';
import { campusDay, queryResult } from './buyer.js';

export async function loadAvailability() {
    if (!supabase) return readLocal('availability', []).filter(({ until }) => Date.parse(until) > Date.now());
    const now = new Date().toISOString();
    const windows = [];
    for (let offset = 0; ; offset += 500) {
        const batch = await queryResult(supabase.from('draft_seller_availability').select('seller_id,spot,from:starts_at,until:ends_at')
            .gt('ends_at', now).order('seller_id').range(offset, offset + 499));
        windows.push(...batch);
        if (batch.length < 500) return windows;
    }
}

export async function publishAvailability(user, window) {
    if (supabase) {
        if (!window) return queryResult(supabase.from('draft_seller_availability').delete().eq('seller_id', user.id));
        return queryResult(supabase.from('draft_seller_availability').upsert({
            seller_id: user.id, spot: window.spot, starts_at: window.from, ends_at: window.until,
        }));
    }
    const others = readLocal('availability', []).filter(({ seller_id }) => seller_id !== user.id);
    writeLocal('availability', window ? [...others, { ...window, seller_id: user.id }] : others);
}

export async function loadWanted(user) {
    const today = campusDay();
    if (supabase) {
        const posts = await queryResult(supabase.from('draft_wanted_posts').select('*')
            .eq('open', true).gte('needed_by', today).order('created_at', { ascending: false }).limit(100));
        const replies = user && posts.length ? await queryResult(supabase.from('draft_wanted_replies').select('post_id,listing_id')
            .in('post_id', posts.map(({ id }) => id)).order('created_at', { ascending: false })) : [];
        return { posts, replies };
    }
    const posts = readLocal('wanted', []).filter((post) => post.open && post.needed_by >= today);
    const owned = new Set(posts.filter((post) => post.buyer_id === user?.id).map((post) => post.id));
    const replies = user ? readLocal('wanted-replies', []).filter((reply) => owned.has(reply.post_id) || reply.seller_id === user.id) : [];
    return { posts, replies };
}

export async function createWanted(user, post) {
    if (supabase) return queryResult(supabase.from('draft_wanted_posts').insert({ ...post, buyer_id: user.id }).select().single());
    const saved = { ...post, buyer_id: user.id, id: crypto.randomUUID(), open: true, created_at: new Date().toISOString() };
    writeLocal('wanted', [saved, ...readLocal('wanted', [])]);
    return saved;
}

export async function closeWanted(user, id) {
    if (supabase) return queryResult(supabase.from('draft_wanted_posts').update({ open: false }).eq('id', id).eq('buyer_id', user.id).select('id').single());
    writeLocal('wanted', readLocal('wanted', []).map((post) => post.id === id && post.buyer_id === user.id ? { ...post, open: false } : post));
}

export async function replyToWanted(user, postId, listingId) {
    if (supabase) return queryResult(supabase.from('draft_wanted_replies').insert({ post_id: postId, listing_id: listingId, seller_id: user.id }));
    const post = readLocal('wanted', []).find((row) => row.id === postId && row.open && row.needed_by >= campusDay());
    const listing = demoListings().find((row) => row.id === listingId && row.user_id === user.id && row.status === 'available');
    if (!post || post.buyer_id === user.id || !listing) throw new Error('This listing or request is no longer available.');
    const replies = readLocal('wanted-replies', []);
    if (replies.some(({ post_id, listing_id }) => post_id === postId && listing_id === listingId)) {
        throw new Error('You already sent this listing.');
    }
    writeLocal('wanted-replies', [{ post_id: postId, listing_id: listingId, seller_id: user.id }, ...replies]);
}
