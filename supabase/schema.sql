-- Extensions
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text not null default 'editor' check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

-- Magazines
create table if not exists public.magazines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  release_cycle text,
  description text,
  cover_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Gifts
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  desc text,
  magazine_slug text references public.magazines(slug) on update cascade on delete set null,
  issue text,
  image_url text,
  brand text,
  price integer,
  category text,
  hot boolean not null default false,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.magazines enable row level security;
alter table public.gifts enable row level security;
alter table public.announcements enable row level security;

-- Helper function
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Read policies for published content
create policy if not exists "public read magazines"
on public.magazines for select
using (published = true);

create policy if not exists "public read gifts"
on public.gifts for select
using (published = true);

create policy if not exists "public read announcements"
on public.announcements for select
using (published = true);

-- Admin full access
create policy if not exists "admin full magazines"
on public.magazines for all
using (public.is_admin())
with check (public.is_admin());

create policy if not exists "admin full gifts"
on public.gifts for all
using (public.is_admin())
with check (public.is_admin());

create policy if not exists "admin full announcements"
on public.announcements for all
using (public.is_admin())
with check (public.is_admin());

-- Profile policies
create policy if not exists "users read self profile"
on public.profiles for select
using (id = auth.uid());

create policy if not exists "admin manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());
