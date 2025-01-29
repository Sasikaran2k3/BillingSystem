import sqlite3
from datetime import datetime

# Connect to SQLite database (creates a new one if not exists)
conn = sqlite3.connect("billing_system.db")
cursor = conn.cursor()

# Drop the Customers table if it exists
cursor.execute("DROP TABLE IF EXISTS Customers")

# Create the Customers table
cursor.executescript("""
CREATE TABLE IF NOT EXISTS Customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT ,
    address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
""")

# Insert data into Customers table
cursor.executescript("""
INSERT INTO Customers (name, phone, address) VALUES 
('A', '9876543210', '123 Street, City'),
('John', '9876543211', '456 Avenue, City'),
('Alice B.', '9876543212', '789 Boulevard, City'),
('Michael Johnson', '9876543213', '101 Road, City'),
('Christopher Alexander', '9876543214', '202 Lane, City');
""")


# Commit the changes and close the connection
conn.commit()
conn.close()
