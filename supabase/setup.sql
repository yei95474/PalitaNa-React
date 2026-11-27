-- Install once in a dedicated Supabase project for PalitaNa-Draft.
begin;

create table public.draft_listings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    seller_name text not null check (char_length(btrim(seller_name)) between 1 and 100),
    name text not null check (char_length(btrim(name)) between 1 and 100),
    description text not null check (char_length(btrim(description)) between 1 and 1600),
    price integer not null check (price between 0 and 10000000),
    category text not null check (category in (
        'Men''s Apparel', 'Women''s Apparel', 'Mobile & Gadgets', 'Gifts', 'Makeup & Fragrances',
        'Hobbies & Stationery', 'Personal Care', 'Food', 'Groceries', 'Entertainment', 'Home & Living',
        'Men''s Accessories', 'Women''s Accessories', 'Home Appliances', 'Toys & Collectibles', 'Pets & Grooming'
    )),
    location text not null check (location in (
        'Brgy. Kilim', 'Brgy. Pangasugan', 'Inside VSU', 'Brgy. Patag', 'Brgy. Gabas', 'Brgy. Utod', 'Baybay City Proper'
    )),
    condition text not null check (condition in ('Brand New (Sealed)', 'Like New', 'Good Condition', 'Pre-loved', 'Damaged')),
    image text not null default '' check (image = '' or (image ~* '^https://' and char_length(image) <= 2000)),
    status text not null default 'available' check (status in ('available', 'sold')),
    created_at timestamptz not null default now()
);

create table public.draft_pickup_requests (
    id uuid primary key default gen_random_uuid(),
    listing_id uuid references public.draft_listings(id) on delete set null,
    buyer_id uuid not null references auth.users(id) on delete cascade,
    seller_id uuid not null references auth.users(id) on delete cascade,
    item_name text not null,
    item_price integer not null,
    location text not null,
    buyer_email text not null check (char_length(buyer_email) <= 254 and buyer_email ~ '^[^[:space:]@]+@[^[:space:]@]+$'),
    note text not null default '' check (char_length(note) <= 1000),
    seller_reply text not null default '' check (char_length(seller_reply) <= 1000),
    status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
    created_at timestamptz not null default now(),
    check (buyer_id <> seller_id),
    check (status <> 'accepted' or btrim(seller_reply) <> '')
);

create index draft_listings_owner_idx on public.draft_listings(user_id);
create index draft_requests_listing_idx on public.draft_pickup_requests(listing_id);
create index draft_requests_buyer_idx on public.draft_pickup_requests(buyer_id);
create index draft_requests_seller_idx on public.draft_pickup_requests(seller_id);
create unique index draft_one_active_request on public.draft_pickup_requests(listing_id, buyer_id)
    where status in ('pending', 'accepted');

alter table public.draft_listings enable row level security;
alter table public.draft_pickup_requests enable row level security;
revoke all on public.draft_listings, public.draft_pickup_requests from public, anon, authenticated;
grant select on public.draft_listings to anon, authenticated;
grant insert (user_id, seller_name, name, description, price, category, location, condition, image, status),
      update (user_id, seller_name, name, description, price, category, location, condition, image, status)
      on public.draft_listings to authenticated;
grant select on public.draft_pickup_requests to authenticated;
grant insert (listing_id, buyer_id, buyer_email, note), update (status, seller_reply)
      on public.draft_pickup_requests to authenticated;

create policy "Published listings" on public.draft_listings for select to anon, authenticated
    using (status = 'available' or (select auth.uid()) = user_id);
create policy "Create own listing" on public.draft_listings for insert to authenticated
    with check ((select auth.uid()) = user_id);
create policy "Edit own listing" on public.draft_listings for update to authenticated
    using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Read own pickups" on public.draft_pickup_requests for select to authenticated
    using ((select auth.uid()) in (buyer_id, seller_id));
create policy "Request pickup as buyer" on public.draft_pickup_requests for insert to authenticated
    with check ((select auth.uid()) = buyer_id and buyer_id <> seller_id and status = 'pending');
create policy "Seller replies to pending pickups" on public.draft_pickup_requests for update to authenticated
    using ((select auth.uid()) = seller_id and status = 'pending')
    with check ((select auth.uid()) = seller_id and status in ('accepted', 'declined'));

create function public.draft_snapshot_listing() returns trigger
    language plpgsql security invoker set search_path = ''
    as $$
    declare
        item public.draft_listings%rowtype;
    begin
        -- A listing snapshot gives both parties the same details even if the listing changes.
        select * into item from public.draft_listings
            where id = new.listing_id and status = 'available';
        if not found or item.user_id = new.buyer_id then
            raise exception 'An item is unavailable. Review your cart and try again.';
        end if;
        new.seller_id := item.user_id;
        new.item_name := item.name;
        new.item_price := item.price;
        new.location := item.location;
        return new;
    end;
    $$;
revoke execute on function public.draft_snapshot_listing() from public, anon, authenticated;
create trigger draft_snapshot_pickup_listing before insert on public.draft_pickup_requests
    for each row execute function public.draft_snapshot_listing();

commit;
