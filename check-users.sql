-- Check existing users
select id, email, role
from auth.users
where email like 'test%@example.com'
limit 5;

-- Check existing profiles
select id, full_name
from public.profiles
where full_name = 'Test User'
limit 5; 