-- migrate:up
CREATE EXTENSION pgcrypto;

CREATE TABLE if NOT EXISTS account (
  id SERIAL PRIMARY key,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  state text NOT NULL,
  created_at TIMESTAMPTZ not null default now()
);

CREATE TABLE if not EXISTS verification (
  id SERIAL PRIMARY key,
  email text not null,
  token text not null,
  created_at TIMESTAMPTZ not null default now()
);

CREATE TABLE if NOT EXISTS session (
  id SERIAL PRIMARY key,
  token text NOT NULL,
  account_id INT not null REFERENCES account (id) on delete cascade,
  expire_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ not null default now()
);

CREATE TABLE if not EXISTS csrf (
  id SERIAL PRIMARY key,
  token text not null,
  session_id int REFERENCES session (id) on delete cascade,
  type int not null default 0,
  created_at TIMESTAMPTZ not null default now()
);

create TABLE if not exists profile (
  id SERIAL PRIMARY key,
  account_id INT not null REFERENCES account (id) on delete cascade,
  first_name text,
  last_name text,
  country_code varchar(2),
  address text,
  avatar text,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ not null default now()
);

create index if not exists idx_verification_email on verification using btree (email);

create index if not exists idx_verification_token on verification using btree (token);

-- migrate:down
DROP TABLE if EXISTS session;

DROP TABLE if EXISTS profile;

DROP TABLE if EXISTS verification;

DROP TABLE if EXISTS account;