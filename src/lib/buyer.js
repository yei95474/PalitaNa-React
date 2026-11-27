import { supabase } from './supabase.js';
import { demoListings, readLocal, writeLocal } from './demo.js';

export const CAMPUS_SPOTS = ['VSU Main Gate', 'University Library entrance', 'VSU Convention Center entrance', 'Other public meeting spot'];
export const PUBLIC_SPOTS = CAMPUS_SPOTS.slice(0, -1);
export const OTHER_SPOT = CAMPUS_SPOTS.at(-1);
export const PICKUP_ISSUES = ['Missed meetup', 'Item condition issue', 'Other pickup issue'];

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFormat = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit' });
const shortDayFormat = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric' });
export const campusDay = (time = Date.now()) => dayFormat.format(time);
export const campusTime = (time) => timeFormat.format(new Date(time));
export const campusShortDay = (time) => shortDayFormat.format(new Date(time));
export const campusMoment = (day, time) => new Date(day + 'T' + time + '+08:00');

export function pickupWindow(day, start, end, now = Date.now()) {
    const from = campusMoment(day, start).getTime();
    const until = campusMoment(day, end).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(until) || from >= until || until <= now) {
        throw new Error('Choose a future window with an end time after its start.');
    }
    return { from: new Date(from).toISOString(), until: new Date(until).toISOString() };
}

export function pickupCheckoutPath(ids) {
    const params = new URLSearchParams(ids.map((id) => ['item', id]));
    return '/checkout?' + params.toString();
}

export function groupBySeller(values, productOf) {
    const sellers = new Map();
    for (const value of values) {
        const product = productOf(value);
        const seller = product?.user_id ?? '';
        if (!sellers.has(seller)) sellers.set(seller, { id: seller, name: product?.seller_name ?? 'Unavailable listings', items: [] });
        sellers.get(seller).items.push(value);
    }
    return [...sellers.values()];
}

export async function queryResult(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function sendBuyerRequests(user, entries, email) {
    if (supabase) return queryResult(supabase.rpc('draft_submit_buyer_pickups', { input_rows: entries, contact_email: email }));

    const requests = readLocal('requests', []);
    const listings = demoListings();
    const results = entries.map((entry) => {
        const existing = requests.find((row) => row.buyer_id === user.id && row.listing_id === entry.listing_id &&
            (row.id === entry.id || ['pending', 'accepted'].includes(row.status)));
        if (existing) return { listing_id: entry.listing_id, status: rowStatus(existing, entry.id) };
        const item = listings.find((listing) => listing.id === entry.listing_id && listing.status === 'available' && listing.user_id !== user.id);
        if (!item) return { listing_id: entry.listing_id, status: 'unavailable' };
        if (item.price !== entry.expected_price) return { listing_id: entry.listing_id, status: 'price_changed' };
        requests.unshift({
            id: entry.id, listing_id: item.id, buyer_id: user.id, seller_id: item.user_id, item_name: item.name,
            item_price: item.price, item_image: item.image, seller_name: item.seller_name, location: item.location,
            buyer_email: email, note: entry.note, preference: entry.preference, status: 'pending',
            seller_reply: '', created_at: new Date().toISOString(),
        });
        return { listing_id: item.id, status: 'sent' };
    });
    writeLocal('requests', requests);
    return results;
}

function rowStatus(request, id) {
    return request.id === id ? 'sent' : 'exists';
}

export async function updateBuyerPickup(user, request, action, details = {}) {
    if (supabase) return queryResult(supabase.rpc('draft_update_buyer_pickup', {
        pickup_id: request.id, action_name: action, action_data: details, expected_revision: request.revision ?? 0,
    }));

    const requests = readLocal('requests', []);
    const original = requests.find((row) => row.id === request.id && [row.buyer_id, row.seller_id].includes(user.id));
    if (!original || (original.revision ?? 0) !== (request.revision ?? 0)) {
        throw new Error('This pickup changed. Refresh it and try again.');
    }
    const updated = applyPickupAction(original, user.id, action, details);
    writeLocal('requests', requests.map((row) => row.id === updated.id ? updated : row));
    return updated;
}

export function applyPickupAction(request, actor, action, details, now = Date.now()) {
    const buyer = actor === request.buyer_id;
    const seller = actor === request.seller_id;
    const active = ['pending', 'accepted'].includes(request.status);
    if ((!buyer && !seller) || !active) throw new Error('This pickup is closed.');
    const isoNow = new Date(now).toISOString();
    const updated = { ...request, revision: (request.revision ?? 0) + 1 };
    let event;
    function schedule(plan) {
        updated.status = 'accepted';
        updated.pickup_spot = plan.spot;
        updated.pickup_at = plan.at;
        updated.seller_reply = plan.details || 'Meet at the landmark shown on the card.';
        updated.proposal = null;
        updated.pickup_issue = null;
        event = { label: request.pickup_at ? 'Meetup rescheduled' : 'Meetup confirmed', spot: plan.spot, time: plan.at };
    }
    if (action === 'propose' && (seller || request.status === 'accepted' || request.proposal)) {
        if (!CAMPUS_SPOTS.includes(details.spot) || !(Date.parse(details.at) > now) ||
            (details.spot === OTHER_SPOT && !details.details?.trim()) || (details.details?.length ?? 0) > 1000) {
            throw new Error('Choose a public meeting spot and a future time. Add directions for a custom spot.');
        }
        const plan = { spot: details.spot, at: new Date(details.at).toISOString(), details: details.details?.trim() ?? '', by: actor };
        const preference = request.preference;
        if (seller && request.status === 'pending' && !request.proposal && preference?.spot === plan.spot &&
            Date.parse(plan.at) >= Date.parse(preference.from) && Date.parse(plan.at) < Date.parse(preference.until)) {
            schedule(plan);
        } else {
            updated.proposal = plan;
            event = { label: 'New meetup proposed', spot: plan.spot, time: plan.at };
        }
    } else if (action === 'confirm' && request.proposal && request.proposal.by !== actor) {
        if (!(Date.parse(request.proposal.at) > now)) throw new Error('That time has passed. Suggest a new time.');
        schedule(request.proposal);
    } else if (action === 'dismiss' && request.proposal) {
        updated.proposal = null;
        event = { label: 'Meetup proposal cleared' };
    } else if (action === 'decline' && seller && request.status === 'pending') {
        updated.status = 'declined';
        updated.proposal = null;
        event = { label: 'Seller declined the request' };
    } else if (action === 'cancel' && (buyer || request.status === 'accepted')) {
        updated.status = 'cancelled';
        updated.proposal = null;
        event = { label: 'Pickup canceled' };
    } else if (action === 'complete' && buyer && request.status === 'accepted' && (!request.pickup_at || Date.parse(request.pickup_at) <= now)) {
        updated.status = 'completed';
        updated.proposal = null;
        event = { label: 'Item received' };
    } else if (action === 'issue' && buyer && request.status === 'accepted' && (!request.pickup_at || Date.parse(request.pickup_at) <= now) &&
        PICKUP_ISSUES.includes(details.issue) && (details.details?.length ?? 0) <= 1000) {
        updated.pickup_issue = { issue: details.issue, details: details.details?.trim() ?? '' };
        event = { label: details.issue + ' recorded' };
    } else {
        throw new Error('This action is unavailable for the current pickup.');
    }
    updated.meetup_events = [...(request.meetup_events ?? []), { ...event, at: isoNow }].slice(-50);
    return updated;
}
