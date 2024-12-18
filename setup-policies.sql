-- Drop existing policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Users can view their own documents" on documents;
drop policy if exists "Users can insert their own documents" on documents;
drop policy if exists "Users can update their own documents" on documents;
drop policy if exists "Users can delete their own documents" on documents;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using ( true );

create policy "Users can insert their own profile"
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );

-- Documents policies
create policy "Users can view their own documents"
    on documents for select
    using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
    on documents for insert
    with check ( 
        auth.uid() = user_id 
        or 
        (auth.jwt()->>'role' = 'service_role')
    );

create policy "Users can update their own documents"
    on documents for update
    using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
    on documents for delete
    using ( auth.uid() = user_id ); 