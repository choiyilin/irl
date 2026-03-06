-- ============================================================
-- IRL — Storage bucket + policies for profile photos
-- Run in Supabase SQL Editor AFTER schema.sql and rls.sql.
-- ============================================================

-- Create the storage bucket (public readable for serving photos)
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

-- Users can upload to their own folder: {user_id}/*
create policy "Users can upload their own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update/overwrite their own photos
create policy "Users can update their own photos"
  on storage.objects for update
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own photos
create policy "Users can delete their own photos"
  on storage.objects for delete
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read photos (bucket is public, but policy still needed)
create policy "Public read access for profile photos"
  on storage.objects for select
  using (bucket_id = 'profile-photos');
