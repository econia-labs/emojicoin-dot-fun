-- This file should undo anything in `up.sql`
REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM web_anon;
DROP USER web_anon;
