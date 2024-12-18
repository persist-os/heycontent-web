-- Drop existing table and related objects
drop table if exists documents cascade;

-- Drop all versions of match_documents function
do $$ 
begin
    drop function if exists match_documents(vector, float, int);
    drop function if exists match_documents(vector(1536), float, int);
    drop function if exists match_documents(query_embedding vector(1536), match_threshold float, match_count int);
    drop function if exists match_documents(query_embedding vector(1536), filter_metadata jsonb, match_threshold float, match_count int);
exception 
    when others then 
        null; -- Ignore errors if functions don't exist
end $$;

-- Create documents table with correct structure
create table documents (
    id uuid default uuid_generate_v4() primary key,
    content text not null,
    metadata jsonb,
    embedding vector(1536),
    user_id uuid references auth.users on delete cascade not null,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table documents enable row level security;

-- Grant base permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on table documents to authenticated;

-- Create RLS policies
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

-- Recreate vector similarity search function
create or replace function match_documents(
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
returns table (
    id uuid,
    content text,
    metadata jsonb,
    similarity float
)
language plpgsql
security definer
as $$
begin
    return query
    select
        d.id,
        d.content,
        d.metadata,
        1 - (d.embedding <=> query_embedding) as similarity
    from documents d
    where 1 - (d.embedding <=> query_embedding) > match_threshold
        and auth.uid() = d.user_id  -- Add RLS check in the function
    order by d.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Grant execute permission on match_documents function
grant execute on function match_documents(vector(1536), float, int) to authenticated, anon; 