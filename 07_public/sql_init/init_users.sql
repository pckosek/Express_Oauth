DROP TABLE IF EXISTS users;
CREATE TABLE users (id INT, ion_username VARCHAR(256), display_name VARCHAR(256), admin BOOLEAN, PRIMARY KEY(id));