-- migrate:up
CREATE EXTENSION pgcrypto;

CREATE TABLE if NOT EXISTS account (
  id SERIAL PRIMARY key,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  state text NOT NULL,
  created_at TIMESTAMPTZ not null default now()
);

create TABLE if not exists profile (
  id SERIAL PRIMARY key,
  first_name text,
  last_name text,
  country_code varchar(2),
  address text,
  avatar text,
  account_id int not null,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ not null default now(),
  foreign key (account_id) REFERENCES account (id) on delete cascade
);

create index IF NOT EXISTS idx_profile_account_id on profile using btree (account_id);

CREATE TABLE if NOT EXISTS session (
  id SERIAL PRIMARY key,
  session_id text NOT NULL UNIQUE,
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
  session_id int,
  kind int not null,
  created_at TIMESTAMPTZ not null default now(),
  foreign key (session_id) REFERENCES session (id) on delete cascade
);

create index IF NOT EXISTS idx_verification_session_id on verification using btree (session_id);

create index IF NOT EXISTS idx_verification_email on verification using btree (email);

-- migrate:down
DROP TABLE if EXISTS verification;

DROP TABLE if EXISTS oauth;

DROP TABLE if EXISTS session;

DROP TABLE if EXISTS profile;

DROP TABLE if EXISTS account;