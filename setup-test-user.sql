-- Create function to create a test user
create or replace function create_test_user(test_email text, test_password text)
returns uuid
language plpgsql
security definer
as 'declare new_user_id uuid; begin insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at) values (uuid_generate_v4(), test_email, crypt(test_password, gen_salt(''bf'')), now(), ''{"provider": "email", "providers": ["email"]}''::jsonb, ''{"full_name": "Test User"}''::jsonb, ''authenticated'', ''authenticated'', now(), now()) returning id into new_user_id; insert into public.profiles (id, full_name) values (new_user_id, ''Test User''); return new_user_id; end;';

-- Grant execute permission
grant execute on function create_test_user(text, text) to authenticated, anon; 