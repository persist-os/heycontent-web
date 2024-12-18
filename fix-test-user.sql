-- Drop existing function if it exists
drop function if exists create_test_user(text, text);

-- Create function to create a test user
create or replace function create_test_user(
    test_email text,
    test_password text
)
returns uuid
language plpgsql
security definer
as $function$
declare
    new_user_id uuid;
    existing_user_id uuid;
begin
    -- Check if user already exists in auth.users
    select id into existing_user_id
    from auth.users
    where email = test_email;
    
    if found then
        -- Check if profile exists
        select id into new_user_id
        from public.profiles
        where id = existing_user_id;
        
        if found then
            return existing_user_id;
        end if;
        
        -- Create profile if it doesn't exist
        insert into public.profiles (id, full_name)
        values (existing_user_id, 'Test User');
        
        return existing_user_id;
    end if;

    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    begin
        -- Create user in auth.users
        insert into auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at
        )
        values (
            new_user_id,
            test_email,
            crypt(test_password, gen_salt('bf')),
            now(),
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            '{"full_name": "Test User"}'::jsonb,
            'authenticated',
            'authenticated',
            now(),
            now()
        );

        -- Create profile for the user
        insert into public.profiles (
            id,
            full_name
        )
        values (
            new_user_id,
            'Test User'
        );

        return new_user_id;
    exception
        when unique_violation then
            -- If we hit a race condition, try to get the existing user
            select id into existing_user_id
            from auth.users
            where email = test_email;
            
            if found then
                return existing_user_id;
            else
                raise exception 'Could not create or find user';
            end if;
    end;
end;
$function$;

-- Grant execute permission
grant execute on function create_test_user(text, text) to authenticated, anon; 