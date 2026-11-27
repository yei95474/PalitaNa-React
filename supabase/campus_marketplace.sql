begin;
alter table public.draft_pickup_requests
    add column pickup_spot text check (pickup_spot in ('VSU Main Gate', 'University Library entrance', 'VSU Convention Center entrance', 'Other public meeting spot')),
    add column pickup_at timestamptz,
    add constraint draft_pickup_schedule_pair check ((pickup_spot is null) = (pickup_at is null)),
    drop constraint draft_pickup_requests_status_check,
    add constraint draft_pickup_requests_status_check check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed'));
grant update (pickup_spot, pickup_at) on public.draft_pickup_requests to authenticated;

create policy "Buyer completes accepted campus pickup" on public.draft_pickup_requests
    for update to authenticated
    using ((select auth.uid()) = buyer_id and status = 'accepted')
    with check ((select auth.uid()) = buyer_id and status = 'completed');

create function public.draft_guard_pickup_schedule() returns trigger
    language plpgsql security invoker set search_path = ''
    as $$
    begin
        if not (
            (old.status = 'pending' and new.status in ('accepted', 'declined', 'cancelled'))
            or (old.status = 'accepted' and new.status = 'completed')
        ) then
            raise exception 'This pickup cannot move to the requested status.';
        end if;
        if new.status = 'accepted' then
            if new.pickup_spot is null or new.pickup_at is null or new.pickup_at <= now() then
                raise exception 'Choose a pickup spot and a future meeting time.';
            end if;
        elsif new.pickup_spot is distinct from old.pickup_spot
            or new.pickup_at is distinct from old.pickup_at
            or (new.status = 'completed' and new.seller_reply is distinct from old.seller_reply) then
            raise exception 'Pickup details are fixed after scheduling.';
        end if;
        return new;
    end;
    $$;
revoke execute on function public.draft_guard_pickup_schedule() from public, anon, authenticated;
create trigger draft_guard_schedule before update on public.draft_pickup_requests
    for each row execute function public.draft_guard_pickup_schedule();

create table public.draft_saved_listings (
    buyer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    listing_id uuid not null references public.draft_listings(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (buyer_id, listing_id)
);
create index draft_saved_listing_idx on public.draft_saved_listings(listing_id);
alter table public.draft_saved_listings enable row level security;
revoke all on public.draft_saved_listings from public, anon, authenticated;
grant select, delete on public.draft_saved_listings to authenticated;
grant insert (listing_id) on public.draft_saved_listings to authenticated;
create policy "Read own saved listings" on public.draft_saved_listings for select to authenticated
    using ((select auth.uid()) = buyer_id);
create policy "Save visible listings" on public.draft_saved_listings for insert to authenticated
    with check ((select auth.uid()) = buyer_id and exists (
        select 1 from public.draft_listings item where item.id = listing_id and item.status = 'available'
    ));
create policy "Remove own saved listings" on public.draft_saved_listings for delete to authenticated
    using ((select auth.uid()) = buyer_id);

create table public.draft_pickup_messages (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references public.draft_pickup_requests(id) on delete cascade,
    sender_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
    body text not null check (char_length(btrim(body)) between 1 and 1000),
    created_at timestamptz not null default now()
);
create index draft_messages_request_time_idx on public.draft_pickup_messages(request_id, created_at desc, id desc);
create index draft_messages_sender_idx on public.draft_pickup_messages(sender_id);
alter table public.draft_pickup_messages enable row level security;
revoke all on public.draft_pickup_messages from public, anon, authenticated;
grant select on public.draft_pickup_messages to authenticated;
grant insert (request_id, body) on public.draft_pickup_messages to authenticated;
create policy "Pickup participants read chat" on public.draft_pickup_messages for select to authenticated
    using (exists (
        select 1 from public.draft_pickup_requests pickup
        where pickup.id = request_id and (select auth.uid()) in (pickup.buyer_id, pickup.seller_id)
    ));
create policy "Pickup participants send chat" on public.draft_pickup_messages for insert to authenticated
    with check ((select auth.uid()) = sender_id and exists (
        select 1 from public.draft_pickup_requests pickup
        where pickup.id = request_id and pickup.status in ('pending', 'accepted')
            and (select auth.uid()) in (pickup.buyer_id, pickup.seller_id)
    ));

create table public.draft_seller_reviews (
    request_id uuid primary key references public.draft_pickup_requests(id) on delete cascade,
    seller_id uuid not null references auth.users(id) on delete cascade,
    rating smallint not null check (rating between 1 and 5),
    body text not null default '' check (char_length(body) <= 500),
    created_at timestamptz not null default now()
);
create index draft_reviews_seller_idx on public.draft_seller_reviews(seller_id, created_at desc);
alter table public.draft_seller_reviews enable row level security;
revoke all on public.draft_seller_reviews from public, anon, authenticated;
grant select on public.draft_seller_reviews to anon, authenticated;
grant insert (request_id, seller_id, rating, body) on public.draft_seller_reviews to authenticated;
create policy "Published seller reviews" on public.draft_seller_reviews for select to anon, authenticated using (true);
create policy "Completed pickup buyer can review seller" on public.draft_seller_reviews for insert to authenticated
    with check (exists (
        select 1 from public.draft_pickup_requests pickup
        where pickup.id = request_id
            and pickup.seller_id = draft_seller_reviews.seller_id
            and pickup.buyer_id = (select auth.uid())
            and pickup.status = 'completed'
    ));
commit;
