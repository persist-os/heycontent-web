-- Function to handle new user signup
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as 'begin insert into public.profiles (id, full_name, avatar_url) values (new.id, new.raw_user_meta_data->>''full_name'', new.raw_user_meta_data->>''avatar_url''); return new; end;';

-- Drop existing trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Drop existing vector search function
drop function if exists match_documents(vector(1536), float, int);

-- Create vector search function
create or replace function match_documents(query_embedding vector(1536), match_threshold float, match_count int) returns table (id uuid, content text, metadata jsonb, similarity float) language sql security definer stable as 'select d.id, d.content, d.metadata, (1 - (d.embedding <=> query_embedding))::float as similarity from documents d where 1 - (d.embedding <=> query_embedding) > match_threshold order by d.embedding <=> query_embedding limit match_count;';

-- Grant execute permissions
grant execute on function match_documents(vector(1536), float, int) to authenticated, anon;