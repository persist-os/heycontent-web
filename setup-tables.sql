-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Drop existing tables
drop table if exists documents;
drop table if exists profiles;

-- Create profiles table
create table profiles (
    id uuid references auth.users on delete cascade not null primary key,
    updated_at timestamp with time zone,
    username text unique,
    full_name text,
    avatar_url text,
    website text,
    constraint username_length check (char_length(username) >= 3)
);

-- Create documents table
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
alter table profiles enable row level security;
alter table documents enable row level security;

-- Grant permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, service_role;
grant all privileges on all functions in schema public to postgres, service_role;
grant all privileges on all sequences in schema public to postgres, service_role;

grant select on table profiles to anon, authenticated;
grant insert, update, delete on table profiles to authenticated;
grant insert, update, delete, select on table documents to authenticated; 