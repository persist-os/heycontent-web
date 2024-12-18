-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- Create documents table for vector similarity search
create table if not exists rag_documents (
    id uuid primary key default uuid_generate_v4(),
    content text,
    metadata jsonb,
    embedding vector(1536)
);

-- Enable RLS and create policies for documents table
alter table rag_documents enable row level security;

create policy "Users can view all documents"
    on rag_documents for select
    to authenticated
    using (true);

create policy "Users can insert their own documents"
    on rag_documents for insert
    to authenticated
    with check (true);

create policy "Users can update their own documents"
    on rag_documents for update
    to authenticated
    using (true);

-- Create match_documents function for vector similarity search
create or replace function match_documents(
  filter jsonb DEFAULT '{}',
  match_count int DEFAULT 10,
  query_embedding vector DEFAULT '[0]'::vector
) returns table (
  id text,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    rag_documents.id::text,
    rag_documents.content,
    rag_documents.metadata,
    1 - (rag_documents.embedding <=> query_embedding) as similarity
  from rag_documents
  where case
    when filter ? 'metadata' then
      rag_documents.metadata @> (filter->>'metadata')::jsonb
    else
      true
    end
  order by rag_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Create User table
create table if not exists "User" (
    id text primary key,
    name text,
    email text unique,
    password text,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    "currentPersona" text,
    "emailVerified" timestamp(3),
    "futureVision" text,
    image text,
    "resetToken" text unique,
    "resetTokenExpiry" timestamp(3),
    "verifyToken" text unique,
    "verifyTokenExpiry" timestamp(3)
);

-- Create Account table
create table if not exists "Account" (
    id text primary key,
    "userId" text not null,
    type text not null,
    provider text not null,
    "providerAccountId" text not null,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_token text,
    constraint "Account_userId_fkey" foreign key ("userId") references "User"(id) on delete cascade
);

create unique index if not exists "Account_provider_providerAccountId_key" on "Account"(provider, "providerAccountId");

-- Create Insight table
create table if not exists "Insight" (
    id serial primary key,
    type text not null,
    title text not null,
    description text not null,
    impact text not null,
    timing text not null,
    confidence integer not null,
    "userId" text not null,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    constraint "Insight_userId_fkey" foreign key ("userId") references "User"(id)
);

create index if not exists "Insight_userId_idx" on "Insight"("userId");

-- Create Conversation table
create table if not exists "Conversation" (
    id text primary key,
    "userId" text not null,
    title text not null,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    starred boolean not null default false,
    constraint "Conversation_userId_fkey" foreign key ("userId") references "User"(id)
);

create index if not exists "Conversation_userId_idx" on "Conversation"("userId");

-- Create Message table
create table if not exists "Message" (
    id text primary key,
    content text not null,
    role text not null,
    timestamp timestamp(3) not null default current_timestamp,
    "conversationId" text not null,
    "referencedMessageId" text,
    constraint "Message_conversationId_fkey" foreign key ("conversationId") references "Conversation"(id),
    constraint "Message_referencedMessageId_fkey" foreign key ("referencedMessageId") references "Message"(id)
);

create index if not exists "Message_conversationId_idx" on "Message"("conversationId");

-- Create SocialUpdate table
create table if not exists "SocialUpdate" (
    id text primary key,
    "createdAt" timestamp(3) not null default current_timestamp,
    platform text not null,
    type text not null,
    data jsonb not null,
    "updatedAt" timestamp(3) not null,
    "userId" text not null,
    constraint "SocialUpdate_userId_fkey" foreign key ("userId") references "User"(id)
);

create index if not exists "SocialUpdate_userId_idx" on "SocialUpdate"("userId");

-- Create SocialAccount table
create table if not exists "SocialAccount" (
    id text primary key,
    "userId" text not null,
    platform text not null,
    name text,
    username text,
    "accessToken" text not null,
    "refreshToken" text,
    "expiresAt" timestamp(3),
    "tokenType" text,
    scope text,
    "profileUrl" text,
    "avatarUrl" text,
    metadata jsonb,
    "isConnected" boolean not null default false,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    metrics jsonb,
    partnerships jsonb,
    constraint "SocialAccount_userId_fkey" foreign key ("userId") references "User"(id) on delete cascade
);

create unique index if not exists "SocialAccount_userId_platform_key" on "SocialAccount"("userId", platform);

-- Create Partnership table
create table if not exists "Partnership" (
    id text primary key,
    "userId" text not null,
    name text not null,
    status text not null default 'pending',
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    "proposedToId" text,
    "suggestedToId" text,
    constraint "Partnership_userId_fkey" foreign key ("userId") references "User"(id),
    constraint "Partnership_proposedToId_fkey" foreign key ("proposedToId") references "User"(id),
    constraint "Partnership_suggestedToId_fkey" foreign key ("suggestedToId") references "User"(id)
);

create index if not exists "Partnership_userId_idx" on "Partnership"("userId");
create index if not exists "Partnership_proposedToId_idx" on "Partnership"("proposedToId");
create index if not exists "Partnership_suggestedToId_idx" on "Partnership"("suggestedToId");

-- Create PartnershipRequirement table
create table if not exists "PartnershipRequirement" (
    id text primary key,
    "partnershipId" text not null,
    title text not null,
    completed boolean not null default false,
    constraint "PartnershipRequirement_partnershipId_fkey" foreign key ("partnershipId") references "Partnership"(id) on delete cascade
);

-- Create PartnershipEvent table
create table if not exists "PartnershipEvent" (
    id text primary key,
    "partnershipId" text not null,
    date timestamp(3) not null,
    type text,
    description text,
    constraint "PartnershipEvent_partnershipId_fkey" foreign key ("partnershipId") references "Partnership"(id) on delete cascade
);

-- Create Contact table
create table if not exists "Contact" (
    id text primary key,
    "partnershipId" text not null,
    name text not null,
    email text,
    phone text,
    role text,
    constraint "Contact_partnershipId_fkey" foreign key ("partnershipId") references "Partnership"(id) on delete cascade
);

-- Create PartnershipHistory table
create table if not exists "PartnershipHistory" (
    id text primary key,
    "partnershipId" text not null,
    date timestamp(3) not null,
    action text not null,
    details text,
    constraint "PartnershipHistory_partnershipId_fkey" foreign key ("partnershipId") references "Partnership"(id) on delete cascade
);

-- Create Note table
create table if not exists "Note" (
    id text primary key,
    "userId" text not null,
    title text not null,
    content text not null,
    "createdAt" timestamp(3) not null default current_timestamp,
    "updatedAt" timestamp(3) not null,
    important boolean not null default false,
    tags text[] not null default '{}',
    reference_list jsonb[] not null default '{}',
    constraint "Note_userId_fkey" foreign key ("userId") references "User"(id) on delete cascade
);

create index if not exists "Note_userId_idx" on "Note"("userId");

-- Enable Row Level Security
alter table "User" enable row level security;
alter table "Account" enable row level security;
alter table "Insight" enable row level security;
alter table "Conversation" enable row level security;
alter table "Message" enable row level security;
alter table "SocialUpdate" enable row level security;
alter table "SocialAccount" enable row level security;
alter table "Partnership" enable row level security;
alter table "PartnershipRequirement" enable row level security;
alter table "PartnershipEvent" enable row level security;
alter table "Contact" enable row level security;
alter table "PartnershipHistory" enable row level security;
alter table "Note" enable row level security;

-- Create RLS Policies
create policy "Users can view their own data" on "User"
    for select using (auth.uid()::text = id);

create policy "Users can update their own data" on "User"
    for update using (auth.uid()::text = id);

create policy "Users can view their own accounts" on "Account"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own accounts" on "Account"
    for all using (auth.uid()::text = "userId");

create policy "Users can view their own insights" on "Insight"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own insights" on "Insight"
    for all using (auth.uid()::text = "userId");

create policy "Users can view their own conversations" on "Conversation"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own conversations" on "Conversation"
    for all using (auth.uid()::text = "userId");

create policy "Users can view their own messages" on "Message"
    for select using (
        exists (
            select 1 from "Conversation"
            where id = "Message"."conversationId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can manage their own messages" on "Message"
    for all using (
        exists (
            select 1 from "Conversation"
            where id = "Message"."conversationId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can view their own social updates" on "SocialUpdate"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own social updates" on "SocialUpdate"
    for all using (auth.uid()::text = "userId");

create policy "Users can view their own social accounts" on "SocialAccount"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own social accounts" on "SocialAccount"
    for all using (auth.uid()::text = "userId");

create policy "Users can view their own partnerships" on "Partnership"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own partnerships" on "Partnership"
    for all using (auth.uid()::text = "userId");

create policy "Users can view their own partnership requirements" on "PartnershipRequirement"
    for select using (
        exists (
            select 1 from "Partnership"
            where id = "PartnershipRequirement"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can manage their own partnership requirements" on "PartnershipRequirement"
    for all using (
        exists (
            select 1 from "Partnership"
            where id = "PartnershipRequirement"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can view their own partnership events" on "PartnershipEvent"
    for select using (
        exists (
            select 1 from "Partnership"
            where id = "PartnershipEvent"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can manage their own partnership events" on "PartnershipEvent"
    for all using (
        exists (
            select 1 from "Partnership"
            where id = "PartnershipEvent"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can view their own contacts" on "Contact"
    for select using (
        exists (
            select 1 from "Partnership"
            where id = "Contact"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can manage their own contacts" on "Contact"
    for all using (
        exists (
            select 1 from "Partnership"
            where id = "Contact"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can view their own partnership history" on "PartnershipHistory"
    for select using (
        exists (
            select 1 from "Partnership"
            where id = "PartnershipHistory"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can manage their own partnership history" on "PartnershipHistory"
    for all using (
        exists (
            select 1 from "Partnership"
            where id = "PartnershipHistory"."partnershipId"
            and "userId" = auth.uid()::text
        )
    );

create policy "Users can view their own notes" on "Note"
    for select using (auth.uid()::text = "userId");

create policy "Users can manage their own notes" on "Note"
    for all using (auth.uid()::text = "userId"); 