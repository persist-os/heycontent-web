-- Grant necessary permissions to the authenticated role
grant usage on schema public to authenticated;
grant all privileges on all tables in schema public to authenticated;
grant all privileges on all sequences in schema public to authenticated;
grant all privileges on all functions in schema public to authenticated;

-- Grant specific permissions for the RAG system
grant execute on function public.match_documents to authenticated;
grant all privileges on table public.rag_documents to authenticated;

-- Create policies for RAG documents
create policy "Users can view all RAG documents"
    on public.rag_documents for select
    to authenticated
    using (true);

create policy "Users can insert RAG documents"
    on public.rag_documents for insert
    to authenticated
    with check (true);

create policy "Users can update RAG documents"
    on public.rag_documents for update
    to authenticated
    using (true);

create policy "Users can delete RAG documents"
    on public.rag_documents for delete
    to authenticated
    using (true);

-- Ensure the vector extension is available
create extension if not exists vector;

-- Recreate the match_documents function with proper permissions
create or replace function public.match_documents(
    query_embedding vector(1536),
    match_count int default 5,
    filter jsonb default '{}'
)
returns table (
    id bigint,
    content text,
    metadata jsonb,
    similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        id,
        content,
        metadata,
        1 - (embedding <=> query_embedding) as similarity
    from public.rag_documents
    where metadata @> filter
    order by embedding <=> query_embedding
    limit match_count;
end;
$$; 