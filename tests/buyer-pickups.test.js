import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const storage = new Map();
const buyer = { id: 'buyer' };
const seller = { id: 'demo-seller' };
const outsider = { id: 'outsider' };
const email = 'buyer@example.test';
const at = (minutes) => new Date(Date.now() + minutes * 60_000).toISOString();

let vite;
let pickups;
let demo;
let marketplace;

before(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    });
    vite = await createServer({
        mode: 'demo', configFile: false, appType: 'custom',
        server: { middlewareMode: true, watch: null },
    });
    pickups = await vite.ssrLoadModule('/src/lib/buyer.js');
    demo = await vite.ssrLoadModule('/src/lib/demo.js');
    marketplace = await vite.ssrLoadModule('/src/lib/marketplace.js');
});

beforeEach(() => storage.clear());
after(async () => { await vite?.close(); });

function entry(item, preference = null) {
    return {
        id: crypto.randomUUID(),
        listing_id: item.id,
        expected_price: item.price,
        preference,
        note: '',
    };
}

test('submits available items, reports stale items, and handles a retry once', async () => {
    const listings = demo.demoListings();
    const [available, repriced, sold] = listings;
    demo.writeLocal('listings', [
        available, { ...repriced, price: repriced.price + 1 }, { ...sold, status: 'sold' }, ...listings.slice(3),
    ]);
    const original = entry(available);
    const result = await pickups.sendBuyerRequests(buyer, [original, entry(repriced), entry(sold)], email);
    assert.deepEqual(result.map(({ status }) => status), ['sent', 'price_changed', 'unavailable']);
    assert.deepEqual(await pickups.sendBuyerRequests(buyer, [original], email), [result[0]]);
    assert.equal((await pickups.sendBuyerRequests(buyer, [entry(available)], email))[0].status, 'exists');
    assert.equal((await marketplace.loadRequests(buyer)).length, 1);
    assert.equal((await marketplace.loadRequests(outsider)).length, 0);
});

test('keeps the agreed meetup until the other participant confirms a new one', async () => {
    const library = pickups.CAMPUS_SPOTS[1];
    const first = { spot: library, at: at(75), details: '' };
    await pickups.sendBuyerRequests(buyer, [entry(demo.demoListings()[0], { spot: library, from: at(60), until: at(120) })], email);
    const [pending] = await marketplace.loadRequests(buyer);

    await assert.rejects(pickups.updateBuyerPickup(outsider, pending, 'cancel'));
    const accepted = await pickups.updateBuyerPickup(seller, pending, 'propose', first);
    assert.equal(accepted.status, 'accepted');
    assert.equal(accepted.pickup_at, first.at);
    await assert.rejects(pickups.updateBuyerPickup(buyer, pending, 'cancel'), /changed/);
    await assert.rejects(pickups.updateBuyerPickup(buyer, accepted, 'complete'));

    const replacement = { spot: pickups.CAMPUS_SPOTS[0], at: at(90), details: 'Main gate' };
    const proposed = await pickups.updateBuyerPickup(buyer, accepted, 'propose', replacement);
    assert.equal(proposed.pickup_at, first.at);
    await assert.rejects(pickups.updateBuyerPickup(buyer, proposed, 'confirm'));
    const confirmed = await pickups.updateBuyerPickup(seller, proposed, 'confirm');
    assert.equal(confirmed.pickup_at, replacement.at);
    assert.equal(confirmed.meetup_events.at(-1).label, 'Meetup rescheduled');

    const canceled = await pickups.updateBuyerPickup(buyer, confirmed, 'cancel');
    assert.equal(canceled.status, 'cancelled');
    assert.equal(canceled.proposal, null);
    await assert.rejects(pickups.updateBuyerPickup(seller, canceled, 'confirm'));
});
