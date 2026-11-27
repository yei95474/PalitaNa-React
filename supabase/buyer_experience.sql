-- Run after campus_marketplace.sql. Publish with the matching buyer UI.
begin;

alter table public.draft_pickup_requests
    add column preference jsonb,
    add column proposal jsonb,
    add column pickup_issue jsonb,
    add column meetup_events jsonb not null default '[]'::jsonb,
    add column revision integer not null default 0,
    add column item_image text,
    add column seller_name text;

-- The RPCs below own transitions. The old insert path can still create plain requests.
revoke update (status, seller_reply, pickup_spot, pickup_at) on public.draft_pickup_requests from authenticated;
drop policy "Seller replies to pending pickups" on public.draft_pickup_requests;
drop policy "Buyer cancels pending draft pickups" on public.draft_pickup_requests;
drop policy "Buyer completes accepted campus pickup" on public.draft_pickup_requests;
drop trigger draft_guard_schedule on public.draft_pickup_requests;
drop function public.draft_guard_pickup_schedule();

create or replace function public.draft_snapshot_listing() returns trigger
    language plpgsql security invoker set search_path = ''
    as $$
    declare
        item public.draft_listings%rowtype;
    begin
        select * into item from public.draft_listings
            where id = new.listing_id and status = 'available';
        if not found or item.user_id = new.buyer_id then
            raise exception 'An item is unavailable. Review your items and try again.';
        end if;
        new.seller_id := item.user_id;
        new.seller_name := item.seller_name;
        new.item_name := item.name;
        new.item_price := item.price;
        new.item_image := item.image;
        new.location := item.location;
        return new;
    end;
    $$;

create policy "Buyers can view their saved sold listings" on public.draft_listings
    for select to authenticated using (
        status = 'sold' and exists (
            select 1 from public.draft_saved_listings saved
            where saved.listing_id = draft_listings.id and saved.buyer_id = (select auth.uid())
        )
    );

create schema if not exists draft_private;
revoke all on schema draft_private from public, anon;
grant usage on schema draft_private to authenticated;

create function draft_private.submit_buyer_pickups(input_rows jsonb, contact_email text) returns jsonb
    language plpgsql security definer set search_path = ''
    as $$
    declare
        actor uuid := auth.uid();
        entry record;
        item public.draft_listings%rowtype;
        existing_id uuid;
        outcome text;
        result jsonb := '[]'::jsonb;
    begin
        if actor is null then raise exception 'Sign in before requesting pickup.'; end if;
        if jsonb_typeof(input_rows) is distinct from 'array' then raise exception 'Select items first.'; end if;
        if jsonb_array_length(input_rows) not between 1 and 50
            or contact_email is null or char_length(contact_email) > 254
            or contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+$' then
            raise exception 'Check your selected items and contact email.';
        end if;

        -- Lock listings in a consistent order so simultaneous requests and listing edits agree.
        for entry in
            select * from jsonb_to_recordset(input_rows) as inputs(
                id uuid, listing_id uuid, expected_price integer, note text, preference jsonb
            ) order by listing_id
        loop
            if entry.id is null or entry.listing_id is null or entry.expected_price is null or char_length(entry.note) > 1000 then
                raise exception 'Check your selected items and note.';
            end if;
            select * into item from public.draft_listings where id = entry.listing_id for update;
            select r.id into existing_id from public.draft_pickup_requests r
                where r.listing_id = entry.listing_id and r.buyer_id = actor
                    and (r.id = entry.id or r.status in ('pending', 'accepted'))
                order by (r.id = entry.id) desc limit 1;

            if existing_id is not null then
                outcome := case when existing_id = entry.id then 'sent' else 'exists' end;
            elsif item.id is null or item.status <> 'available' or item.user_id = actor then
                outcome := 'unavailable';
            elsif item.price <> entry.expected_price then
                outcome := 'price_changed';
            elsif entry.preference is not null and (
                jsonb_typeof(entry.preference) <> 'object'
                or coalesce(entry.preference ->> 'spot', '') not in ('VSU Main Gate', 'University Library entrance', 'VSU Convention Center entrance')
                or entry.preference ->> 'from' is null
                or entry.preference ->> 'until' is null
                or (entry.preference ->> 'from')::timestamptz >= (entry.preference ->> 'until')::timestamptz
                or (entry.preference ->> 'until')::timestamptz <= now()
            ) then
                outcome := 'invalid_preference';
            else
                insert into public.draft_pickup_requests (id, listing_id, buyer_id, buyer_email, note, preference)
                    values (entry.id, entry.listing_id, actor, contact_email, coalesce(entry.note, ''), entry.preference);
                outcome := 'sent';
            end if;
            result := result || jsonb_build_array(jsonb_build_object('listing_id', entry.listing_id, 'status', outcome));
        end loop;
        return result;
    end;
    $$;

create function draft_private.update_buyer_pickup(
    pickup_id uuid, action_name text, action_data jsonb, expected_revision integer
) returns jsonb
    language plpgsql security definer set search_path = ''
    as $$
    declare
        actor uuid := auth.uid();
        pickup public.draft_pickup_requests%rowtype;
        buyer boolean;
        seller boolean;
        next_status text;
        next_proposal jsonb;
        next_issue jsonb;
        next_reply text;
        next_spot text;
        next_time timestamptz;
        spot text;
        at_time timestamptz;
        directions text := btrim(coalesce(action_data ->> 'details', ''));
        issue text := action_data ->> 'issue';
        confirmed jsonb;
        event jsonb;
        events jsonb;
    begin
        if actor is null then raise exception 'Sign in to manage pickups.'; end if;
        select * into pickup from public.draft_pickup_requests p
            where p.id = pickup_id and actor in (p.buyer_id, p.seller_id) for update;
        if not found or pickup.status not in ('pending', 'accepted') then
            raise exception 'This pickup is closed or unavailable.';
        end if;
        if pickup.revision is distinct from expected_revision then raise exception 'This pickup changed. Refresh and try again.'; end if;

        buyer := actor = pickup.buyer_id;
        seller := actor = pickup.seller_id;
        next_status := pickup.status;
        next_proposal := pickup.proposal;
        next_issue := pickup.pickup_issue;
        next_reply := pickup.seller_reply;
        next_spot := pickup.pickup_spot;
        next_time := pickup.pickup_at;

        if action_name = 'propose' and (seller or pickup.status = 'accepted' or pickup.proposal is not null) then
            spot := action_data ->> 'spot';
            at_time := (action_data ->> 'at')::timestamptz;
            if spot is null or spot not in ('VSU Main Gate', 'University Library entrance', 'VSU Convention Center entrance', 'Other public meeting spot')
                or at_time is null or not isfinite(at_time) or at_time <= now() or char_length(directions) > 1000
                or (spot = 'Other public meeting spot' and directions = '') then
                raise exception 'Choose a public meeting spot and a future time. Add directions for a custom spot.';
            end if;
            next_proposal := jsonb_build_object('spot', spot, 'at', at_time, 'details', directions, 'by', actor);
            if seller and pickup.status = 'pending' and pickup.proposal is null and pickup.preference ->> 'spot' = spot
                and at_time >= (pickup.preference ->> 'from')::timestamptz
                and at_time < (pickup.preference ->> 'until')::timestamptz then
                confirmed := next_proposal;
            else
                event := jsonb_build_object('label', 'New meetup proposed', 'spot', spot, 'time', at_time);
            end if;
        elsif action_name = 'confirm' and pickup.proposal is not null and pickup.proposal ->> 'by' <> actor::text then
            if (pickup.proposal ->> 'at')::timestamptz <= now() then
                raise exception 'That time has passed. Suggest a new time.';
            end if;
            confirmed := pickup.proposal;
        elsif action_name = 'dismiss' and pickup.proposal is not null then
            next_proposal := null;
            event := jsonb_build_object('label', 'Meetup proposal cleared');
        elsif action_name = 'decline' and seller and pickup.status = 'pending' then
            next_status := 'declined';
            next_proposal := null;
            event := jsonb_build_object('label', 'Seller declined the request');
        elsif action_name = 'cancel' and (buyer or pickup.status = 'accepted') then
            next_status := 'cancelled';
            next_proposal := null;
            event := jsonb_build_object('label', 'Pickup canceled');
        elsif action_name = 'complete' and buyer and pickup.status = 'accepted' and coalesce(pickup.pickup_at <= now(), true) then
            next_status := 'completed';
            next_proposal := null;
            event := jsonb_build_object('label', 'Item received');
        elsif action_name = 'issue' and buyer and pickup.status = 'accepted' and coalesce(pickup.pickup_at <= now(), true)
            and issue in ('Missed meetup', 'Item condition issue', 'Other pickup issue') and char_length(directions) <= 1000 then
            next_issue := jsonb_build_object('issue', issue, 'details', directions);
            event := jsonb_build_object('label', issue || ' recorded');
        else
            raise exception 'This action is unavailable for the current pickup.';
        end if;

        if confirmed is not null then
            next_status := 'accepted';
            next_spot := confirmed ->> 'spot';
            next_time := (confirmed ->> 'at')::timestamptz;
            next_reply := coalesce(nullif(confirmed ->> 'details', ''), 'Meet at the landmark shown on the card.');
            next_proposal := null;
            next_issue := null;
            event := jsonb_build_object(
                'label', case when pickup.pickup_at is null then 'Meetup confirmed' else 'Meetup rescheduled' end,
                'spot', next_spot, 'time', next_time
            );
        end if;

        events := pickup.meetup_events || jsonb_build_array(event || jsonb_build_object('at', now()));
        if jsonb_array_length(events) > 50 then
            events := events - 0;
        end if;
        update public.draft_pickup_requests
            set status = next_status, proposal = next_proposal, pickup_issue = next_issue, seller_reply = next_reply,
                pickup_spot = next_spot, pickup_at = next_time, meetup_events = events, revision = pickup.revision + 1
            where id = pickup.id returning * into pickup;
        return to_jsonb(pickup);
    end;
    $$;

-- Public RPC entry points run as the caller. Privileged routines check the authenticated user
-- and keep their schema outside the Data API.
create function public.draft_submit_buyer_pickups(input_rows jsonb, contact_email text) returns jsonb
    language sql security invoker set search_path = ''
    as $$ select draft_private.submit_buyer_pickups(input_rows, contact_email); $$;
create function public.draft_update_buyer_pickup(
    pickup_id uuid, action_name text, action_data jsonb, expected_revision integer
) returns jsonb
    language sql security invoker set search_path = ''
    as $$ select draft_private.update_buyer_pickup(pickup_id, action_name, action_data, expected_revision); $$;

revoke execute on function draft_private.submit_buyer_pickups(jsonb, text),
    draft_private.update_buyer_pickup(uuid, text, jsonb, integer),
    public.draft_submit_buyer_pickups(jsonb, text),
    public.draft_update_buyer_pickup(uuid, text, jsonb, integer) from public, anon;
grant execute on function draft_private.submit_buyer_pickups(jsonb, text),
    draft_private.update_buyer_pickup(uuid, text, jsonb, integer),
    public.draft_submit_buyer_pickups(jsonb, text),
    public.draft_update_buyer_pickup(uuid, text, jsonb, integer) to authenticated;

create table public.draft_seller_availability (
    seller_id uuid primary key references auth.users(id) on delete cascade,
    spot text not null check (spot in ('VSU Main Gate', 'University Library entrance', 'VSU Convention Center entrance')),
    starts_at timestamptz not null,
    ends_at timestamptz not null check (isfinite(starts_at) and isfinite(ends_at) and starts_at < ends_at)
);
alter table public.draft_seller_availability enable row level security;
revoke all on public.draft_seller_availability from public, anon, authenticated;
grant select on public.draft_seller_availability to anon, authenticated;
grant insert, update, delete on public.draft_seller_availability to authenticated;
create policy "Read advertised pickup windows" on public.draft_seller_availability for select to anon, authenticated
    using (ends_at > now() or seller_id = (select auth.uid()));
create policy "Sellers publish their windows" on public.draft_seller_availability for insert to authenticated
    with check (seller_id = (select auth.uid()) and ends_at > now());
create policy "Sellers update their windows" on public.draft_seller_availability for update to authenticated
    using (seller_id = (select auth.uid())) with check (seller_id = (select auth.uid()) and ends_at > now());
create policy "Sellers remove their windows" on public.draft_seller_availability for delete to authenticated
    using (seller_id = (select auth.uid()));

create table public.draft_wanted_posts (
    id uuid primary key default gen_random_uuid(),
    buyer_id uuid not null references auth.users(id) on delete cascade,
    item text not null check (char_length(btrim(item)) between 1 and 100),
    budget integer not null check (budget between 0 and 10000000),
    area text not null check (area in ('Brgy. Kilim', 'Brgy. Pangasugan', 'Inside VSU', 'Brgy. Patag', 'Brgy. Gabas', 'Brgy. Utod', 'Baybay City Proper')),
    needed_by date not null,
    open boolean not null default true,
    created_at timestamptz not null default now()
);
create index draft_wanted_open_idx on public.draft_wanted_posts(created_at desc) where open;
create index draft_wanted_buyer_idx on public.draft_wanted_posts(buyer_id);
alter table public.draft_wanted_posts enable row level security;
revoke all on public.draft_wanted_posts from public, anon, authenticated;
grant select on public.draft_wanted_posts to anon, authenticated;
grant insert (buyer_id, item, budget, area, needed_by), update (open) on public.draft_wanted_posts to authenticated;
create policy "Read wanted posts" on public.draft_wanted_posts for select to anon, authenticated
    using ((open and needed_by >= (now() at time zone 'Asia/Manila')::date) or buyer_id = (select auth.uid()));
create policy "Buyers post wanted items" on public.draft_wanted_posts for insert to authenticated
    with check (buyer_id = (select auth.uid()) and needed_by >= (now() at time zone 'Asia/Manila')::date);
create policy "Buyers close their wanted posts" on public.draft_wanted_posts for update to authenticated
    using (buyer_id = (select auth.uid()) and open) with check (buyer_id = (select auth.uid()) and not open);

create table public.draft_wanted_replies (
    post_id uuid references public.draft_wanted_posts(id) on delete cascade,
    listing_id uuid references public.draft_listings(id) on delete cascade,
    seller_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (post_id, listing_id)
);
create index draft_wanted_reply_seller_idx on public.draft_wanted_replies(seller_id);
create index draft_wanted_reply_listing_idx on public.draft_wanted_replies(listing_id);
alter table public.draft_wanted_replies enable row level security;
revoke all on public.draft_wanted_replies from public, anon, authenticated;
grant select on public.draft_wanted_replies to authenticated;
grant insert (post_id, listing_id, seller_id) on public.draft_wanted_replies to authenticated;
create policy "Participants read wanted replies" on public.draft_wanted_replies for select to authenticated
    using ((select auth.uid()) = seller_id or exists (
        select 1 from public.draft_wanted_posts p where p.id = post_id and p.buyer_id = (select auth.uid())
    ));
create policy "Sellers reply with an available listing they own" on public.draft_wanted_replies for insert to authenticated
    with check ((select auth.uid()) = seller_id and exists (
        select 1 from public.draft_wanted_posts p where p.id = post_id and p.open
            and p.needed_by >= (now() at time zone 'Asia/Manila')::date and p.buyer_id <> (select auth.uid())
    ) and exists (
        select 1 from public.draft_listings item where item.id = listing_id and item.user_id = (select auth.uid()) and item.status = 'available'
    ));

commit;
