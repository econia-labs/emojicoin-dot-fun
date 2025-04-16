-- Your SQL goes here
CREATE TABLE processor_status (
  processor VARCHAR(50) UNIQUE PRIMARY KEY NOT NULL,
  last_success_version BIGINT NOT NULL,
  last_transaction_timestamp TIMESTAMP NOT NULL,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);
