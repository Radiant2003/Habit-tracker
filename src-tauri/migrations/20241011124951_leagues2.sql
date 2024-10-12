-- Add migration script here
CREATE TABLE leagues (
    id INTEGER PRIMARY KEY,
    league_name VARCHAR(30),
    lower_bound INTEGER,
    league_cost INTEGER
);

ALTER TABLE users ADD COLUMN league_id INTEGER REFERENCES leagues(id);

INSERT INTO leagues (league_name, lower_bound, league_cost) VALUES ("zhest", 0, 0),
    ("iron", 500, 20),
    ("steel", 1000, 40),
    ("bronze", 1500, 60),
    ("silver", 2000, 80),
    ("gold", 2500, 100),
    ("platinum", 3000, 120),
    ("diamond", 3500, 140);