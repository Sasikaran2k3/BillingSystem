import sqlite3
from datetime import datetime

# Connect to SQLite database (creates a new one if not exists)
conn = sqlite3.connect("billing_system.db")
cursor = conn.cursor()

# Create tables
cursor.executescript("""
-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Customers Table
CREATE TABLE IF NOT EXISTS Customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT
);

-- Products Table
CREATE TABLE IF NOT EXISTS Products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    barcode TEXT UNIQUE NOT NULL,
    supplier TEXT NOT NULL,
);

-- Categories Table
CREATE TABLE IF NOT EXISTS Categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL,
    description TEXT
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS Suppliers (
    supplier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    email TEXT,
    address TEXT
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS Invoices (
    invoice_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    date TEXT NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    discount REAL,
    tax REAL,
    net_total REAL NOT NULL
);

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS Invoice_Items (
    invoice_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    price_per_unit REAL NOT NULL,
    subtotal REAL NOT NULL
);

-- Payments Table
CREATE TABLE IF NOT EXISTS Payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    payment_date TEXT NOT NULL,
    amount_paid REAL NOT NULL,
    balance_due REAL
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS Expenses (
    expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_name TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT
);

-- Tax Table
CREATE TABLE IF NOT EXISTS Tax (
    tax_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tax_name TEXT NOT NULL,
    tax_percentage REAL NOT NULL
);

-- Settings Table
CREATE TABLE IF NOT EXISTS Settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_name TEXT NOT NULL,
    value TEXT NOT NULL
);

-- Logs Table
CREATE TABLE IF NOT EXISTS Logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Discounts Table
CREATE TABLE IF NOT EXISTS Discounts (
    discount_id INTEGER PRIMARY KEY AUTOINCREMENT,
    discount_name TEXT NOT NULL,
    discount_percentage REAL NOT NULL,
    applicable_products TEXT
);
""")

# Add dummy records
current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Users
cursor.execute("INSERT INTO Users (username, password, role, created_at) VALUES (?, ?, ?, ?)", 
               ("admin", "password123", "Admin", current_time))

# Customers
cursor.execute("INSERT INTO Customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
               ("John Doe", "9876543210", "john@example.com", "123 Main St"))

# Suppliers
cursor.execute("INSERT INTO Suppliers (name, contact, email, address) VALUES (?, ?, ?, ?)",
               ("Fresh Farms", "9988776655", "farms@example.com", "Farm Road, City"))

# Categories
cursor.execute("INSERT INTO Categories (category_name, description) VALUES (?, ?)",
               ("Fruits", "Fresh fruits category"))

# Products
cursor.execute("""
INSERT INTO Products (name, category, price, stock, barcode, supplier, tax_rate)
VALUES (?, ?, ?, ?, ?, ?, ?)
""", ("Apple", "Fruits", 150.0, 100, "123456789012", "Some Supplier", 1))

# Invoices
cursor.execute("""
INSERT INTO Invoices (customer_id, date, total_amount, payment_method, discount, tax, net_total)
VALUES (?, ?, ?, ?, ?, ?, ?)
""", (1, current_time, 150.0, "Cash", 0.0, 5.0, 157.5))

# Invoice Items
cursor.execute("""
INSERT INTO Invoice_Items (invoice_id, product_id, quantity, price_per_unit, subtotal)
VALUES (?, ?, ?, ?, ?)
""", (1, 1, 1, 150.0, 150.0))

# Payments
cursor.execute("""
INSERT INTO Payments (invoice_id, payment_date, amount_paid, balance_due)
VALUES (?, ?, ?, ?)
""", (1, current_time, 157.5, 0.0))

# Expenses
cursor.execute("""
INSERT INTO Expenses (expense_name, amount, date, description)
VALUES (?, ?, ?, ?)
""", ("Shop Rent", 5000.0, current_time, "Monthly rent for the shop"))

# Tax
cursor.execute("""
INSERT INTO Tax (tax_name, tax_percentage)
VALUES (?, ?)
""", ("GST", 5.0))

# Settings
cursor.execute("""
INSERT INTO Settings (setting_name, value)
VALUES (?, ?)
""", ("Shop Name", "Fruit Delight"))

# Logs
cursor.execute("""
INSERT INTO Logs (user_id, action, timestamp)
VALUES (?, ?, ?)
""", (1, "Created initial dummy records", current_time))

# Discounts
cursor.execute("""
INSERT INTO Discounts (discount_name, discount_percentage, applicable_products)
VALUES (?, ?, ?)
""", ("Summer Sale", 10.0, "Fruits"))

# Commit and close connection
conn.commit()
conn.close()

print("Tables created and dummy records added successfully.")
