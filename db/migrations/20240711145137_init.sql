-- migrate:up
CREATE EXTENSION pgcrypto;

CREATE TABLE if NOT EXISTS account (
  id SERIAL PRIMARY key,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  state text NOT NULL,
  created_at TIMESTAMPTZ not null
);

CREATE TABLE if NOT EXISTS session (
  id SERIAL PRIMARY key,
  user_id INT not null REFERENCES account (id),
  expire_at TIMESTAMPTZ NOT NULL,
  token text NOT NULL,
  csrf text NOT NULL
);

-- migrate:down
DROP TABLE if EXISTS session;

DROP TABLE if EXISTS account;