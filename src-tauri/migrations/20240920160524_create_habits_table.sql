-- Add migration script here
CREATE TABLE habits (
    id INTEGER PRIMARY KEY,
    habit_name VARCHAR(30),
    points INTEGER
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    points INTEGER,
    updated_at INTEGER
);