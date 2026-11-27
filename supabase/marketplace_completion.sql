begin;

alter table public.draft_listings
    drop constraint draft_listings_status_check,
    add constraint draft_listings_status_check check (status in ('available', 'sold', 'archived'));

revoke insert on public.draft_listings from authenticated;
grant insert (id, user_id, seller_name, name, description, price, category, location, condition, image, status)
    on public.draft_listings to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('draft-listing-photos', 'draft-listing-photos', true, 2097152, array['image/webp']);

create policy "Upload own draft listing photos" on storage.objects
    for insert to authenticated
    with check (
        bucket_id = 'draft-listing-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and array_length(storage.foldername(name), 1) = 2
        and storage.extension(name) = 'webp'
    );

create policy "View own draft photo objects" on storage.objects
    for select to authenticated
    using (bucket_id = 'draft-listing-photos' and owner_id = (select auth.uid())::text);

create policy "Delete own draft photo objects" on storage.objects
    for delete to authenticated
    using (bucket_id = 'draft-listing-photos' and owner_id = (select auth.uid())::text);

alter table public.draft_pickup_requests
    drop constraint draft_pickup_requests_status_check,
    add constraint draft_pickup_requests_status_check check (status in ('pending', 'accepted', 'declined', 'cancelled'));

create policy "Buyer cancels pending draft pickups" on public.draft_pickup_requests
    for update to authenticated
    using ((select auth.uid()) = buyer_id and status = 'pending')
    with check ((select auth.uid()) = buyer_id and status = 'cancelled' and seller_reply = '');

commit;
