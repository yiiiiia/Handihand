-- migrate:up
CREATE EXTENSION pgcrypto;

CREATE TABLE if NOT EXISTS account (
  id SERIAL PRIMARY key,
  identity_value text NOT NULL,
  identity_type text not null,
  password text,
  state text NOT NULL,
  created_at TIMESTAMPTZ not null default now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(identity_value, identity_type)
);

create TABLE if not exists profile (
  id SERIAL PRIMARY key,
  account_id int not null,
  country_code varchar(2),
  region text,
  city text,
  postcode text,
  street_address text,
  extended_address text,
  username text UNIQUE,
  photo text,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ not null default now(),
  foreign key (account_id) REFERENCES account (id) on delete cascade
);

create index IF NOT EXISTS idx_profile_account_id on profile using btree (account_id);

create index IF NOT EXISTS idx_profile_country_code on profile using btree (country_code);

CREATE TABLE if NOT EXISTS session (
  id SERIAL PRIMARY key,
  session text NOT NULL UNIQUE,
  account_id int not null,
  expire_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ not null default now(),
  foreign key (account_id) REFERENCES account (id) on delete cascade
);

create index IF NOT EXISTS idx_session_account_id on session using btree (account_id);

CREATE TABLE if not EXISTS oauth (
  id SERIAL PRIMARY key,
  identity text not null,
  token text not null,
  refresh_token text,
  provider text not null,
  account_id INT not null,
  created_at TIMESTAMPTZ not null default now(),
  foreign key (account_id) REFERENCES account (id) on delete cascade,
  UNIQUE (identity, provider)
);

create index IF NOT EXISTS idx_oauth_account_id on oauth using btree (account_id);

CREATE TABLE if not EXISTS verification (
  id SERIAL PRIMARY key,
  email text,
  code text not null UNIQUE,
  session text,
  created_at TIMESTAMPTZ not null default now(),
  foreign key (session) REFERENCES session (session) on delete cascade
);

create index IF NOT EXISTS idx_verification_session on verification using btree (session);

create index IF NOT EXISTS idx_verification_email on verification using btree (email);

create table if NOT exists tag (
  id SERIAL PRIMARY key,
  word text not null UNIQUE,
  created_at TIMESTAMPTZ not null default now()
);

create table if not exists video (
  id SERIAL PRIMARY key,
  account_id int not null,
  country_code text,
  title text,
  description text,
  name text not null,
  type text not null,
  size int not null,
  upload_url text,
  thumbnail_url text,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_video_account_id on video using btree (account_id);

create index if not exists idx_video_country on video using btree (country_code);

create index if not exists idx_video_title_description on video using gin (
  to_tsvector(
    'english',
    coalesce(title, '') || ' ' || coalesce(description, '')
  )
);

create table if not exists video_tag (
  video_id int not null,
  tag_id int not null,
  created_at TIMESTAMPTZ not null default now(),
  PRIMARY key (video_id, tag_id)
);

CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL UNIQUE,
  country_name TEXT NOT NULL UNIQUE
);

-- migrate:down
DROP TABLE if EXISTS verification;

DROP TABLE if EXISTS oauth;

DROP TABLE if EXISTS session;

DROP TABLE if EXISTS profile;

DROP TABLE if EXISTS account;

DROP TABLE if EXISTS video_tag;

DROP TABLE if EXISTS tag;

DROP TABLE if EXISTS video;

DROP TABLE if EXISTS countries;
