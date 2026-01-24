CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(20) CHECK (role IN ('ADMIN', 'MEMBER', 'EMPLOYEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE societies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    address TEXT
);

CREATE TABLE flats (
    id SERIAL PRIMARY KEY,
    society_id INT REFERENCES societies(id),
    flat_number VARCHAR(20),
    owner_name VARCHAR(100)
);

CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
