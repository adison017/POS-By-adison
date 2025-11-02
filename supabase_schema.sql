-- Create Tables
CREATE TABLE IF NOT EXISTS menu_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id VARCHAR(50),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS menu_items (
    id VARCHAR(50) PRIMARY KEY,
    category_id VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_default DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    branch_id VARCHAR(50),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_no VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    branch_id VARCHAR(50),
    cashier_id VARCHAR(50),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    item_id VARCHAR(50),
    name VARCHAR(255),
    qty INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'queued',
    created_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(50) PRIMARY KEY,
    expense_date DATE NOT NULL,
    category VARCHAR(50),
    note TEXT,
    amount DECIMAL(10,2) NOT NULL,
    branch_id VARCHAR(50),
    created_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS income (
    id VARCHAR(50) PRIMARY KEY,
    income_date DATE NOT NULL,
    category VARCHAR(50),
    note TEXT,
    amount DECIMAL(10,2) NOT NULL,
    branch_id VARCHAR(50),
    created_at TIMESTAMPTZ
);

-- New table for payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

-- Insert default payment methods
INSERT INTO payment_methods (id, name, description, is_active, display_order, created_at, updated_at) VALUES
('pm_cash', 'เงินสด', 'ชำระด้วยเงินสด', TRUE, 1, NOW(), NOW()),
('pm_credit', 'บัตรเครดิต', 'ชำระด้วยบัตรเครดิต', TRUE, 2, NOW(), NOW()),
('pm_debit', 'บัตรเดบิต', 'ชำระด้วยบัตรเดบิต', TRUE, 3, NOW(), NOW()),
('pm_qr', 'QR Payment', 'ชำระด้วย QR Code', TRUE, 4, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;