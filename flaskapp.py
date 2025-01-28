from flask import Flask, render_template, request, jsonify
import sqlite3
import win32print

app = Flask(__name__)

# Database connection
def get_db_connection():
    conn = sqlite3.connect("billing_system.db")
    conn.row_factory = sqlite3.Row
    return conn

# Routes
@app.route("/")
def index():
    return render_template("Invoice.html")
@app.route("/ProductManager")
def products():
    return render_template("ProductManager.html")
@app.route("/api/products", methods=["GET", "POST"])
def manage_products():
    if request.method == "GET":
        query = request.args.get("query", "")
        conn = get_db_connection()
        if query:
            products = conn.execute("SELECT * FROM Products WHERE name LIKE ?", (f"%{query}%",)).fetchall()
        else:
            products = conn.execute("SELECT * FROM Products").fetchall()
        conn.close()
        return jsonify([dict(row) for row in products])
    elif request.method == "POST":
        new_product = request.json
        conn = get_db_connection()
        conn.execute("INSERT INTO Products (name, category, price, stock, barcode) VALUES (?, ?, ?, ?, ?)",
                     (new_product["name"], new_product["category"], new_product["price"], new_product["stock"], new_product.get("barcode")))
        conn.commit()
        conn.close()
        return jsonify(new_product), 201


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    try:
        conn = get_db_connection()
        updated_product = request.json
        print(f"Received update request for product ID: {product_id} with data: {updated_product}")
        conn.execute("UPDATE Products SET name = ?, category = ?, price = ?, stock = ?, barcode = ? WHERE product_id = ?",
                     (updated_product["name"], updated_product["category"], updated_product["price"], updated_product["stock"], updated_product["barcode"], product_id))
        conn.commit()
        conn.close()
        return jsonify(updated_product)
    except Exception as e:
        print(f"Error updating product: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM Products WHERE product_id = ?", (product_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Product deleted"}), 200
    except Exception as e:
        print(f"Error deleting product: {e}")
        return jsonify({"error": str(e)}), 500
# Route to create a new invoice
@app.route("/api/invoices", methods=["POST"])
def create_invoice():
    try:
        invoice_data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Invoices (customer_id, invoice_date, total_amount, discount, net_total)
            VALUES (?, ?, ?, ?, ?)
        """, (invoice_data["customer_id"], invoice_data["invoice_date"], invoice_data["total_amount"], invoice_data["discount"], invoice_data["net_total"]))
        conn.commit()
        invoice_id = cursor.lastrowid
        conn.close()
        return jsonify({"invoice_id": invoice_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Route to add invoice items for a specific invoice
@app.route("/api/invoices/<int:invoice_id>/items", methods=["POST"])
def add_invoice_items(invoice_id):
    try:
        line_items = request.json["lineItems"]
        conn = get_db_connection()
        cursor = conn.cursor()
        for item in line_items:
            cursor.execute("""
                INSERT INTO Invoice_Items (invoice_id, product_id, quantity, unit_price, total_price)
                VALUES (?, ?, ?, ?, ?)
            """, (invoice_id, item["product_id"], item["quantity"], item["unit_price"], item["total_price"]))
        conn.commit()
        conn.close()
        return jsonify({"message": "Invoice items added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/invoices/print", methods=["POST"])
def print_invoice():
    try:
        invoice_data = request.json
        print("begins printing")
        printer_name = win32print.GetDefaultPrinter()
        hPrinter = win32print.OpenPrinter(printer_name)

        try:
            print(invoice_data)
            hJob = win32print.StartDocPrinter(hPrinter, 1, ("ESC/POS Invoice Print", None, "RAW"))
            win32print.StartPagePrinter(hPrinter)
            
            # ESC/POS command to print invoice
            esc_pos_invoice = b'\x1b\x40'  # Initialize printer
            esc_pos_invoice += b'\x1b\x21\x20'  # Double height
            esc_pos_invoice += b'*** INVOICE ***\n'
            esc_pos_invoice += b'\x1b\x21\x00'  # Cancel double height

            esc_pos_invoice += f"Date: {invoice_data['invoice_date']}\n".encode()
            esc_pos_invoice += f"Invoice #: {invoice_data['invoice_id']}\n".encode()
            esc_pos_invoice += f"Shop Name: {invoice_data['customer_name']}\n".encode()
            esc_pos_invoice += f"Address: {invoice_data['customer_address']}\n".encode()
            esc_pos_invoice += f"Phone: {invoice_data['customer_phone']}\n".encode()
            esc_pos_invoice += b'\n'
            esc_pos_invoice += b'Item                Qty    Price    Total\n'
            esc_pos_invoice += b'----------------------------------------\n'
            
            for item in invoice_data['lineItems']:
                esc_pos_invoice += f"{item['product_name'][:20]:<20}{item['quantity']:<8}{item['unit_price']:<8}{item['total_price']:<8}\n".encode()
                
            esc_pos_invoice += b'----------------------------------------\n'
            if invoice_data['discount'] :
                esc_pos_invoice += f"Subtotal                         {invoice_data['total_amount']:.2f}\n".encode()
                esc_pos_invoice += f"Discount                        {invoice_data['discount']:.2f}\n".encode()
            esc_pos_invoice += f"Net Total                        {invoice_data['net_total']:.2f}\n".encode()
            esc_pos_invoice += b'----------------------------------------\n'
            esc_pos_invoice += b'\n'
            esc_pos_invoice += b'\n'
            esc_pos_invoice += b'\x1d\x56\x00'  # Perform full cut

            win32print.WritePrinter(hPrinter, esc_pos_invoice)
            win32print.EndPagePrinter(hPrinter)
            win32print.EndDocPrinter(hPrinter)
        finally:
            win32print.ClosePrinter(hPrinter)
        
        return jsonify({"message": "Invoice printed successfully"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
