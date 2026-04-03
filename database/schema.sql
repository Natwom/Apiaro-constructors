-- Apiaro Constructors Database Schema

CREATE DATABASE IF NOT EXISTS apiaro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apiaro_db;

-- Users table (Admin)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Projects table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ongoing',
    location VARCHAR(200),
    budget DECIMAL(15, 2),
    start_date DATE,
    end_date DATE,
    client_name VARCHAR(100),
    images TEXT,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price DECIMAL(15, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    unit VARCHAR(20),
    image VARCHAR(255),
    featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20),
    customer_address TEXT,
    items TEXT NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
-- Password is hashed with bcrypt
INSERT INTO users (username, email, password_hash, full_name) VALUES 
('admin', 'admin@apiaro.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'Administrator');

-- Sample projects
INSERT INTO projects (title, description, category, status, location, budget, client_name, featured) VALUES
('Kampala Office Complex', 'Modern 5-story office building with parking', 'building', 'completed', 'Kampala, Uganda', 2500000.00, 'ABC Corporation', TRUE),
('Entebbe Road Expansion', '20km highway expansion project', 'road', 'ongoing', 'Entebbe Road', 8500000.00, 'UNRA', TRUE),
('Residential Estate', '50-unit residential development', 'building', 'ongoing', 'Nakasero', 3200000.00, 'Private Developer', FALSE);

-- Sample products
INSERT INTO products (name, description, category, price, stock_quantity, unit, featured) VALUES
('Portland Cement', 'High-quality construction cement', 'cement', 35000.00, 500, 'bag', TRUE),
('Steel Rebar 12mm', 'High-tensile steel reinforcement bars', 'steel', 4500.00, 200, 'piece', TRUE),
('Timber Planks', 'Hardwood timber for construction', 'timber', 25000.00, 100, 'piece', FALSE),
('Roofing Sheets', 'Aluminum zinc roofing sheets', 'roofing', 75000.00, 300, 'sheet', TRUE),
('River Sand', 'Clean river sand for construction', 'aggregate', 80000.00, 1000, 'ton', FALSE);