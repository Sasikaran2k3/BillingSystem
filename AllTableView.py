import sqlite3

# Connect to the database
conn = sqlite3.connect("billing_system.db")
cursor = conn.cursor()

# List of all table names
tables = ["Users", "Customers", "Products", "Categories", "Suppliers", "Invoices", "Invoice_Items", "Payments", 
          "Expenses", "Tax", "Settings", "Logs", "Discounts"]

# Fetch and display data from each table with column names
for table in tables:
    print(f"Data from {table}:")
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [column[1] for column in cursor.fetchall()]
    print(f"Columns: {columns}")

    cursor.execute(f"SELECT * FROM {table}")
    for row in cursor.fetchall():
        print(row)
    print("-" * 50)

# Close the connection
conn.close()
