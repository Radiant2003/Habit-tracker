-- Add migration script here
CREATE TABLE records (
    id INTEGER PRIMARY KEY,
    created_at VARCHAR(20),
    points INTEGER
);