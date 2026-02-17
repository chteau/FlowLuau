grant usage on schema public to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;

alter default privileges in schema public
grant select, insert, update, delete on tables to app_user;