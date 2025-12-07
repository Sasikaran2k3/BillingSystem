from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
import requests
import win32print
import win32ui
import win32con
import os
import sys
from pathlib import Path
import webbrowser
import random
print("Current Working Directory:", os.getcwd())
print("Templates Directory:", os.listdir('templates'))

# URL to open
url = "http://127.0.0.1:4000/"

if sys.platform == "win32":
    data_dir = Path(os.environ['APPDATA']) / 'BillingBuddy'
elif sys.platform == "darwin":  # macOS
    data_dir = Path.home() / 'Library' / 'Application Support' / 'BillingBuddy'
else:  # Linux
    data_dir = Path.home() / '.BillingBuddy'

data_dir.mkdir(exist_ok=True)

# Open the URL in the default browser
webbrowser.open(url)

# Get the list of all printers
printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)

# Print the names of the printers
for printer in printers:
    print(printer[2])


app = Flask(__name__)
CORS(app)

database_name = "billing_system1.db"
db_path = data_dir / database_name

auto_print = True  # Set to True to enable auto printing

print("Database Path:", db_path)
# Database connection
def get_db_connection():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn
 
# Routes
@app.route("/")
def index():
    return render_template("Invoice.html")
@app.route("/ProductManager")
def products():
    return render_template("ProductManager.html")
@app.route("/Customer")
def customers():
    return render_template("CustomerManager.html")
@app.route("/Message")
def message():
    return render_template("MessageManager.html")
@app.route("/Analysis")
def analysis():
    return render_template("AnalyticsManager.html")

@app.route("/api/fulldata")
def fetch_analysis_data():
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    full_data = conn.execute("""SELECT 
    Invoices.*, 
    Invoice_Items.*, 
    Products.name AS product_name,
    Products.tax,
    Products.hsn,
    Customers.name AS customer_name
    FROM Invoices
    JOIN Invoice_Items ON Invoices.invoice_id = Invoice_Items.invoice_id
    JOIN Products ON Invoice_Items.product_id = Products.product_id
    JOIN Customers ON Invoices.customer_id = Customers.id
    ORDER BY Invoices.invoice_id DESC;
""").fetchall()
    conn.close()
    return jsonify([dict(row) for row in full_data])

@app.route("/api/products", methods=["GET", "POST"])
def manage_products():
    def generate_unique_barcode():
        while True:
            cursor = conn.cursor()
            barcode = str(random.randint(100000000000, 999999999999))  # 12-digit barcode
            cursor.execute("SELECT COUNT(*) FROM Products WHERE barcode = ?", (barcode,))
            if cursor.fetchone()[0] == 0:
                return barcode  # Unique barcode found
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
        print(new_product)
        if(new_product.get("barcode") == ''):
            new_product["barcode"] = generate_unique_barcode()
        conn.execute(
            "INSERT INTO Products (name, category, price, stock, barcode, mrp, purchase_cost, tax, HSN) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (new_product["name"], new_product["category"], new_product["price"], new_product["stock"], new_product.get("barcode"), new_product.get("mrp"), new_product["purchase_cost"], new_product.get("tax", 5.0), new_product.get("HSN", ""))
        )
        conn.commit()
        conn.close()
        return jsonify(new_product), 201

@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    def generate_unique_barcode():
        while True:
            cursor = conn.cursor()
            barcode = str(random.randint(100000000000, 999999999999))  # 12-digit barcode
            cursor.execute("SELECT COUNT(*) FROM Products WHERE barcode = ?", (barcode,))
            if cursor.fetchone()[0] == 0:
                return barcode  # Unique barcode found
    try:
        conn = get_db_connection()
        updated_product = request.json
        print(f"Received update request for product ID: {product_id} with data: {updated_product}")
        if(updated_product.get("barcode") == ''):
            updated_product["barcode"] = generate_unique_barcode()
        conn.execute(
            "UPDATE Products SET name = ?, category = ?, price = ?, stock = ?, barcode = ?, mrp = ?, purchase_cost = ?, tax = ?, HSN = ?, product_id = ? WHERE product_id = ?",
            (updated_product["name"], updated_product["category"], updated_product["price"], updated_product["stock"], updated_product["barcode"], updated_product.get("mrp"), updated_product["purchase_cost"], updated_product.get("tax", 5.0), updated_product.get("HSN", ""), updated_product["product_id"], updated_product["original_product_id"])
        )
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

@app.route("/api/customers", methods=["GET"])
def get_customers(id=None):
    query = request.args.get("query", "")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    if query:
        customers = conn.execute("SELECT * FROM Customers WHERE name LIKE ?", (f"{query}%",)).fetchall()
    elif id:
        customers = conn.execute("SELECT * FROM Customers WHERE id = ?", (id,)).fetchall()
    else:
        customers = conn.execute("SELECT * FROM Customers").fetchall()
    conn.close()
    return jsonify([dict(row) for row in customers])
@app.route("/api/customers", methods=["POST"])
def create_customer():
    try:
        new_customer = request.json
        conn = get_db_connection()
        conn.execute("INSERT INTO Customers (name, phone, address) VALUES (?, ?, ?)",
                     (new_customer["name"], new_customer["phone"], new_customer["address"]))
        conn.commit()
        conn.close()
        return jsonify(new_customer), 201
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
@app.route("/api/customers/<int:customer_id>", methods=["PUT"])
def update_customer(customer_id):
    try:
        conn = get_db_connection()
        updated_customer = request.json
        conn.execute("UPDATE Customers SET name = ?, phone = ?, address = ? WHERE id = ?",
                     (updated_customer["name"], updated_customer["phone"], updated_customer["address"], customer_id))
        conn.commit()
        conn.close()
        return jsonify(updated_customer)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500
@app.route("/api/customers/<int:customer_id>", methods=["DELETE"])
def delete_customer(customer_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM Customers WHERE id = ?", (customer_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Customer deleted"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/messages", methods=["GET"])
def get_messages():
    query = request.args.get("query", "")
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    if query:
        messages = conn.execute("SELECT * FROM Messages WHERE event LIKE ?", (f"{query}%",)).fetchall()
    else:
        messages = conn.execute("SELECT * FROM Messages").fetchall()
    conn.close()
    return jsonify([dict(row) for row in messages])

@app.route("/api/messages", methods=["POST"])
def create_message():
    try:
        new_message = request.json
        conn = get_db_connection()
        conn.execute("INSERT INTO Messages (event, message) VALUES (?, ?)",
                     (new_message["event"], new_message["message"]))
        conn.commit()
        conn.close()
        return jsonify(new_message), 201
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/messages/<int:message_id>", methods=["PUT"])
def update_message(message_id):
    try:
        conn = get_db_connection()
        updated_message = request.json
        conn.execute("UPDATE Messages SET event = ?, message = ? WHERE id = ?",
                     (updated_message["event"], updated_message["message"], message_id))
        conn.commit()
        conn.close()
        return jsonify(updated_message)
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/messages/activate/<int:message_id>", methods=["PUT"])
def activate_message(message_id):
    try:
        conn = get_db_connection()
        current_status = conn.execute("SELECT status FROM Messages WHERE id = ?", (message_id,)).fetchone()

        if not current_status:
            return jsonify({"error": "Message not found"}), 404

        new_status = "active" if current_status["status"] == "inactive" else "inactive"

        conn.execute("UPDATE Messages SET status = ? WHERE id = ?", (new_status, message_id))
        conn.commit()
        conn.close()
        return jsonify({"id": message_id, "status": new_status})
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/messages/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM Messages WHERE id = ?", (message_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Message deleted"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route("/SalesManager")
def invoices():
    return render_template("SalesManager.html")
# Get all invoices
@app.route("/api/invoices", methods=["GET"])
def get_invoices():
    query = request.args.get("query", "")
    conn = get_db_connection()
    if query:
        invoices = conn.execute("SELECT * FROM Invoices WHERE invoice_id LIKE ?", (f"{query}%",)).fetchall()
    else:
        invoices = conn.execute("SELECT * FROM Invoices ORDER BY invoice_id DESC").fetchall()
    conn.close()
    return jsonify([dict(row) for row in invoices])
# Delete invoice
@app.route("/api/invoices/<int:invoice_id>", methods=["DELETE"])
def delete_invoice(invoice_id):
    try:
        conn = get_db_connection()
        conn.execute("DELETE FROM Invoices WHERE invoice_id = ?", (invoice_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Invoice deleted"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

# Route to `create` a new invoice
@app.route("/api/invoices", methods=["POST"])
def create_invoice():
    try:
        invoice_data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        print(invoice_data)
        cursor.execute("""
            INSERT INTO Invoices (customer_id, invoice_date, total_amount, discount, net_total, mode_of_payment)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (invoice_data["customer_id"], invoice_data["invoice_date"], invoice_data["total_amount"], invoice_data["discount"], invoice_data["net_total"], invoice_data["mode_of_payment"]))
        conn.commit()
        invoice_id = cursor.lastrowid
        conn.close()
        return jsonify({"invoice_id": invoice_id}), 201
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

# Route to update a specific invoice
@app.route("/api/invoices/<int:invoice_id>", methods=["PUT"])
def update_invoice(invoice_id):
    try:
        invoice_data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE Invoices 
            SET customer_id = ?, invoice_date = ?, total_amount = ?, discount = ?, net_total = ?, mode_of_payment = ?
            WHERE invoice_id = ?
        """, (invoice_data["customer_id"], invoice_data["invoice_date"], invoice_data["total_amount"], invoice_data["discount"], invoice_data["net_total"], invoice_data["mode_of_payment"], invoice_id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Invoice updated successfully"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

# Route to add invoice items for a specific invoice
@app.route("/api/invoices/<int:invoice_id>/items", methods=["POST"])
def add_invoice_items(invoice_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        line_items = request.json["lineItems"]
        for item in line_items:
            try:
                # Insert invoice item
                cursor.execute("""
                    INSERT INTO Invoice_Items (invoice_id,product_id,quantity,unit_price,total_price,profit,gst_price,cgst_price)
                    VALUES (?,?,?,?,?,? - ((SELECT purchase_cost FROM Products WHERE product_id = ?) * ?),?,?)
                """, (invoice_id, item["product_id"], item["quantity"], item["unit_price"], item["total_price"], item["total_price"], item["product_id"], item["quantity"], item["gst_price"], item["cgst_price"]))
            except Exception as e:
                print(f"Error inserting invoice item: {e}")
                return jsonify({"error": f"Failed to insert invoice item for product {item['product_id']}"}), 500
            try:
                # Decrease stock of the product
                cursor.execute("""
                    UPDATE Products 
                    SET stock = CASE 
                        WHEN stock IS NOT '' AND stock > ? THEN stock - ? 
                        WHEN stock IS NOT '' AND stock <= ? THEN '' 
                        ELSE stock 
                    END
                    WHERE product_id = ?;
                """, (item["quantity"],item["quantity"],item["quantity"], item["product_id"]))
            except Exception as e:
                print(f"Error updating stock: {e}")
                return jsonify({"error": f"Failed to update stock for product {item['product_id']}"}), 500

        conn.commit()
        return jsonify({"message": "Invoice items added and stock updated successfully"}), 201

    except Exception as e:
        print(f"General error: {e}")
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


# Route to delete invoice items for a specific invoice
@app.route("/api/invoices/<int:invoice_id>/items/<int:item_id>", methods=["DELETE"])
def delete_invoice_item(invoice_id, item_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Retrieve the deleted item's quantity and product_id
        cursor.execute("SELECT product_id, quantity FROM Invoice_Items WHERE invoice_id = ? AND invoice_item_id = ?", (invoice_id, item_id))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({"error": "Invoice item not found"}), 404
        
        product_id, quantity = item
        
        try:
            # Delete the invoice item
            cursor.execute("DELETE FROM Invoice_Items WHERE invoice_id = ? AND invoice_item_id = ?", (invoice_id, item_id))
        except Exception as e:
            print(f"Error deleting invoice item: {e}")
            return jsonify({"error": "Failed to delete invoice item"}), 500
        
        try:
            # Restore stock of the product
            cursor.execute("""
                UPDATE Products 
                SET stock = CASE 
                    WHEN stock IS NOT '' THEN stock + ?
                    ELSE ?
                END
                WHERE product_id = ?;
            """, (quantity, quantity, product_id))
        except Exception as e:
            print(f"Error updating stock: {e}")
            return jsonify({"error": "Failed to restore stock"}), 500
        
        conn.commit()
        return jsonify({"message": "Invoice item deleted and stock updated successfully"}), 200
    
    except Exception as e:
        print(f"General error: {e}")
        return jsonify({"error": str(e)}), 500
    
    finally:
        conn.close()

# Route to update invoice items for a specific invoice
@app.route("/api/invoices/<int:invoice_id>/items/<int:item_id>", methods=["PUT"])
def update_invoice_item(invoice_id, item_id):
    try:
        item_data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()

        # Fetch the previous quantity and product_id
        cursor.execute("""
            SELECT product_id, quantity FROM Invoice_Items
            WHERE invoice_id = ? AND invoice_item_id = ?
        """, (invoice_id, item_id))
        prev_item = cursor.fetchone()

        if not prev_item:
            return jsonify({"error": "Invoice item not found"}), 404

        _ , prev_quantity = prev_item
        new_product_id = item_data["product_id"]
        new_quantity = item_data["quantity"]
        # If the product remains the same, update quantity and adjust stock accordingly
        if prev_quantity != new_quantity:
            print("Changed quantity")
            quantity_diff = new_quantity - prev_quantity  # Positive if more taken, negative if returned
            print(quantity_diff)
            cursor.execute("""
                UPDATE Products
                SET stock = CASE 
                    WHEN stock IS NOT '' AND stock >= ? THEN stock - ?
                    WHEN ? <= 0 THEN - ?
                    ELSE ''
                END
                WHERE product_id = ?
            """, (quantity_diff, quantity_diff,quantity_diff, quantity_diff, new_product_id))

        # Update invoice item details
        cursor.execute("""
            UPDATE Invoice_Items 
            SET quantity = ?, 
                unit_price = ?, 
                total_price = ?, 
                profit = ? - ((SELECT purchase_cost FROM Products WHERE product_id = (SELECT product_id FROM Invoice_Items WHERE invoice_item_id = ?)) * ?),
                gst_price = ?,
                cgst_price = ?
            WHERE invoice_id = ? AND invoice_item_id = ?
        """, (new_quantity, item_data["unit_price"], item_data["total_price"], item_data["total_price"], item_id, new_quantity, item_data["gst_price"], item_data["cgst_price"], invoice_id, item_id))
        conn.commit()
        return jsonify({"message": "Invoice item updated successfully"}), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()


@app.route("/api/invoices/<int:invoice_id>/items", methods=["GET"])
def get_invoice_items(invoice_id):
    try:
        conn = get_db_connection()
        invoice_items = conn.execute("SELECT * FROM Invoice_Items WHERE invoice_id = ?", (invoice_id,)).fetchall()
        conn.close()
        return jsonify([dict(row) for row in invoice_items]), 200
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/invoices/print", methods=["POST"])
def print_invoice(invoice_data=None, user_ip=None):
    # If called via API → use request data
    if invoice_data is None:
        invoice_data = request.get_json()
    if user_ip is None:
        user_ip = request.remote_addr
    print("PORT : ",user_ip)
    # Send JSON to local machine
    #return {"status": "sent to printer"}
    try:
        print("Collecting End Message")
        conn = get_db_connection()
        messages = conn.execute("SELECT message FROM Messages WHERE status = ?", ("active",)).fetchall()
        messages_list = [row["message"] for row in messages]
        print(messages)
        conn.close()
        print("Begins Printing")
        printer_name = "RP3160 GOLD(U) 1"
        hPrinter = win32print.OpenPrinter(printer_name)
        #invoice_data = request.json
        print("print data :", invoice_data)
        invoice_data['messages'] = messages_list
        if('127.0.0.1' != user_ip):
            requests.post(f'http://{user_ip}:5001/print', json=invoice_data)
        try:
            total_length = 30
            hJob = win32print.StartDocPrinter(hPrinter, 1, ("ESC/POS Invoice Print", None, "RAW"))
            win32print.StartPagePrinter(hPrinter)

            # Create a printer device context
            hdc = win32ui.CreateDC()
            hdc.CreatePrinterDC(printer_name)
            hdc.StartDoc("Invoice")
            hdc.StartPage()
            def add_text(dc, text, x, y, font_name="DejaVu Sans Mono Bold", font_size=30, bold=False, italic=False):
                # Create font
                fontdata = {
                    'name': font_name,
                    'height': font_size,
                    'weight': win32con.FW_BOLD if bold else win32con.FW_NORMAL,
                    'italic': italic,
                }
                x=0
                if('Item' in text):
                    flag = 1
                font = win32ui.CreateFont(fontdata)
                dc.SelectObject(font)
                dc.TextOut(x, y, text)

            # Adjusted font size for better readability on 72.00 mm width paper

            y_position = 5
            
            # Store Name: Double height, bold, center-aligned
            add_text(hdc, '{}'.format(' SELVAM STORES',total_length), 10, y_position, font_size=80, bold=True)
            y_position += 100
            # Store Address: Bold, normal height, center-aligned
            add_text(hdc, '{:^{}}'.format('No:416 Periyar EVR High Road',total_length), 10, y_position, bold=True,font_size=36)
            y_position += 50
            add_text(hdc, '{:^{}}'.format('Arumbakkam, Chennai-600106.',total_length), 10, y_position, bold=True,font_size=36)
            y_position += 50
            add_text(hdc, '{:^{}}'.format('  (Selva Vinayagar St)',total_length), 10, y_position, bold=True,font_size=36)
            y_position += 50
            add_text(hdc, '{:^{}}'.format('Phone: 7358206231, 9283122209',total_length), 10, y_position, bold=True,font_size=36)
            y_position += 100
            add_text(hdc, '{:^{}}'.format('ESTIMATE BILL',total_length), 10, y_position, bold=True,font_size=36)
            y_position += 50
            
            # Invoice details
            date = invoice_data['invoice_date'].split("-")
            add_text(hdc, f"No: {invoice_data['invoice_id']:<10} {date[0]:<10} {date[1]:<10}\n", 10, y_position, bold=True)
            y_position += 50
            add_text(hdc, f"{invoice_data['customer_name']}\n", 10, y_position, bold=True)
            y_position += 30
            if(len(invoice_data['customer_address']) > 0):
                add_text(hdc, f"{invoice_data['customer_address']}\n", 10, y_position, bold=True)
                y_position += 30
            if(len(invoice_data['customer_phone']) > 0):
                add_text(hdc, f"{invoice_data['customer_phone']}\n", 10, y_position, bold=True)
                y_position += 30
            add_text(hdc, '\n', 10, y_position, bold=True)
            y_position += 40
            
            # Table Header
            add_text(hdc, '----------------------------------------------\n', 10, y_position, font_size=36, bold=True)
            y_position += 25
            add_text(hdc, 'Item         Qty  Price  Total\n', 10, y_position, font_size=36, bold=True)
            y_position += 35
            add_text(hdc, '----------------------------------------------\n', 10, y_position, font_size=36, bold=True)
            y_position += 50

            # Table Data
            for item in invoice_data['lineItems']:
                #product_name_lines = split_text(item['product_name'], 13)
                unit_price = str(item['unit_price'])+' '*3 if 0 else f"{item['unit_price']:.2f}"
                total_price = str(item['total_price'])+' '*3 if 0 else f"{item['total_price']:.2f}"
                add_text(hdc, f"{item['product_name'][:35]:<25}", 10, y_position, bold=True)
                y_position += 30
                add_text(hdc, f"{' '*15}{item['quantity']:<5}{unit_price:>8}{total_price:>8}\n", 10, y_position, bold=True)
                y_position += 50
            # Subtotal, Discount, and Net Total
            add_text(hdc, '----------------------------------------------\n', 10, y_position, font_size=36, bold=True)
            y_position += 40
            if invoice_data['discount'] > 0 or invoice_data['pending'] > 0:
                add_text(hdc, f"Subtotal             {invoice_data['total_amount']:.2f}\n", 10, y_position, bold=True)
                y_position += 50
            if invoice_data['discount']:
                add_text(hdc, f"Discount (-)         {invoice_data['discount']:.2f}\n", 10, y_position, bold=True)
                y_position += 50
            if invoice_data['pending']:
                add_text(hdc, f"Pending  (+)         {invoice_data['pending']:.2f}\n", 10, y_position, bold=True)
                y_position += 50
            add_text(hdc, f"{'Items :'}{len(invoice_data['lineItems']):<11}{'Total':^9}{invoice_data['net_total']:>9.2f}", 10, y_position, bold=True)
            
            #roundoff = abs(invoice_data["net_total"] - int(invoice_data["net_total"]))
            #if(roundoff > 0):
            #    y_position += 30
            #    add_text(hdc, f"Round Off (-) : {roundoff:>9.2f}", 10, y_position, bold=True)
            y_position += 40
            add_text(hdc, '----------------------------------------------\n', 10, y_position, font_size=36, bold=True)
            y_position += 50
            add_text(hdc, f"{'Net Total : '}{invoice_data['net_total']:<9.2f}", 10, y_position, bold=True,font_size=42)
            y_position += 40
            # add_text(hdc, '----------------------------------------------\n', 10, y_position, font_size=36, bold=True)
            # y_position += 50
            # for tax_rate, (price_without_tax, tax_amount) in invoice_data['tax_batch'].items():
            #     add_text(hdc, f'Tax {tax_rate}% : {price_without_tax:.2f} + {tax_amount:.2f} = {price_without_tax + tax_amount:.2f}', 10, y_position, bold=True)
            #     y_position += 40
            #     add_text(hdc, f'GST {int(tax_rate)/2}% : {tax_amount/2:.2f} CGST {int(tax_rate)/2}% : {tax_amount/2:.2f} ', 10, y_position, bold=True)
            #     y_position += 40
            # add_text(hdc, '----------------------------------------------\n', 10, y_position, font_size=36, bold=True)
            y_position += 50
            if(invoice_data["recieved_amount"] == 0):
                pass
            else:
                add_text(hdc, f'Amount recieved : {invoice_data["recieved_amount"]}', 100, y_position, bold=True)
                y_position += 40
                balance = invoice_data["recieved_amount"] - invoice_data['net_total']
                add_text(hdc, f'{"Pending Amount" if balance < 0 else  "Balance Amount" } : {abs(balance):.2f}', 100, y_position, bold=True)
                y_position += 60
            word_count = 36
            for message in messages_list:
                line = '"'
                for sub_msg in message.split(" "):
                    if((len(line) + len(sub_msg)) < 32):
                        line += (sub_msg + " ")
                    else:
                        add_text(hdc, f'{line:^34}', 100, y_position, bold=True)
                        y_position += 40
                        line = (sub_msg + " ")
                line += '"'
                add_text(hdc, f'{line:^34}', 100, y_position, bold=True)
                y_position += 60
            # Add "Affordable groceries, Premium quality" and "Thank you! Visit again" at the end in center and bold
            add_text(hdc, 'Affordable groceries,Premium quality\n\n', 100, y_position, bold=True)
            y_position += 40
            add_text(hdc, '*** Thank you! Visit again ***\n\n\n', 100, y_position, bold=True)
            y_position += 100

            hdc.EndPage()
            hdc.EndDoc()
            win32print.EndPagePrinter(hPrinter)
            win32print.EndDocPrinter(hPrinter)
            return jsonify({"message": "Invoice item Printed successfully"}), 200
        except Exception as e:
            print(f"Error: {e}")
        finally:
            win32print.ClosePrinter(hPrinter)
    except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": str(e)}), 500

@app.route("/BarcodeManager")
def barcode():
    return render_template("BarcodeManager.html")
@app.route("/api/barcode/print", methods=["POST"])
def barcode_print():
    try:
        print("Begins barcode printing")
        printer_name = "SNBC TVSE LP46 Dlite BPLE"
        barcodeItems= request.json
        # Manipulate the PRN file with POST Data
        prn_file = "2d_template_2lines.prn"
        for products in barcodeItems:
            print(products)
            data_split = products["product_name"].split(" ")
            first_line = ""
            second_line = ""
            for i in data_split:
                if(len(first_line)+len(i) <= 18):
                    first_line += (i + " ")
                else:
                    second_line += (i + " ")
            print(first_line)
            print(second_line)
            with open(prn_file, "rb") as f:
                count = str(int((products["qty"] + 3 - ( products["qty"] % 3 ) if(products["qty"] % 3 != 0) else products["qty"]) / 3))
                data = f.read()
                data = data.replace(b"{PRODUCT NAME L1}", str(first_line).encode())   
                if(len(products["product_name"]) >= 18):
                    data = data.replace(b"{PRODUCT NAME L2}", str(second_line[:18]).encode())
                else:
                    data = data.replace(b"{PRODUCT NAME L2}", b"")          
                data = data.replace(b"{BARCODE}", str(products["barcode"]).encode())
                data = data.replace(b"{MRP}", str(products["mrp"]).encode())
                data = data.replace(b"{AMT}", str(products["unit_price"]).encode())
                data = data.replace(b"{MFG}", str(products["mf_date"]).encode())
                data = data.replace(b"{EXP}", str(products["exp_date"]).encode())
                data = data.replace(b"{qty}", count.encode())
                
                hPrinter = win32print.OpenPrinter(printer_name)
                try:
                    hJob = win32print.StartDocPrinter(hPrinter, 1, ("PrintJob", None, "RAW"))
                    win32print.StartPagePrinter(hPrinter)
                    win32print.WritePrinter(hPrinter, data)
                    win32print.EndPagePrinter(hPrinter)
                    win32print.EndDocPrinter(hPrinter)
                    print("PRN file sent to printer successfully!")
                finally:
                    win32print.ClosePrinter(hPrinter)
                
        return jsonify({"message": "Barcode printed successfully"}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/sync", methods=["GET"])
def sync_with_express_server(express_server_url='http://sasikaran-dell-g15.local:3000', flask_port=4000):
    """
    Sync with Express.js server to register as order manager
    """
    try:
        sync_data = {
            'port': flask_port,
            'endpoint': '/receiveOrder'
        }
        
        response = requests.post(f'{express_server_url}/sync', json=sync_data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✓ Sync successful: {result['message']}")
            return "Sync Successful", 200
        else:
            print(f"✗ Sync failed: {response.status_code} - {response.text}")
            return "Sync Failed", 200
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Sync error: {str(e)}")
        return "Sync Error", 200

@app.route("/receiveOrder", methods=["POST"])
def receive_order():
    print("Receiving Order")
    try:
        order_data = request.json
        print(f"✓ Received order: {order_data['orderId']}")
        # Fetch the order
        try:
            collect_orders()
        except Exception as e:
            print(f"✗ Error processing order: {str(e)}")
            return jsonify({'success': False, 'error': str(e)}), 500
        return jsonify({'success': True, 'message': 'Order received successfully'}), 200
    except Exception as e:
        print(f"✗ Receive error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
    

@app.route("/processOnlineOrder", methods=["POST"])
def process_online_order(order):
    # Entry Complete Invoice
    req = requests.post(url + "api/invoices", json=order)
    print("Status : ",req.status_code,req.json())
    lineItemsResponse = None
    if(req.status_code == 201):
        # Entry Line Items
        order['invoice_id'] = req.json()['invoice_id']
        lineItemsResponse = requests.post(url + f"api/invoices/{order['invoice_id']}/items", json={"lineItems": order['items']})
        print("Line Items Status : ",lineItemsResponse.status_code if lineItemsResponse else "No line items response")
    if(lineItemsResponse.status_code == 201):
        print(lineItemsResponse.json())
    print("Fetching Customer Details")
    customer = get_customers(order['customer_id']).get_json()
    if(len(customer) == 0):
        print("Customer not found, creating new customer")
        customer = {
            "name": 'CASH',
            "phone": '',
            "address": ''
        }
    else:
        order['customer_name'] = customer[0]['name']
        order['customer_phone'] = customer[0]['phone']
        order['customer_address'] = customer[0]['address']
    order['lineItems'] = order['items']
    order['recieved_amount'] = order['recieved_amount'] if 'recieved_amount' in order else order['net_total']
    print_invoice(user_ip='127.0.0.1', invoice_data=order)
        

@app.route("/api/collectOrders", methods=["GET"])
def collect_orders():
    try:
        express_server_url = "http://sasikaran-dell-g15.local:3000"
        
        response = requests.post(f'{express_server_url}/collectOrders', timeout=10)
        
        if response.status_code == 200:
            orders_data = response.json()
            for order in orders_data['orders']:
                print(order.get("sentToOrderManager"))
                if(order.get("sentToOrderManager") == True):
                    continue
                process_online_order(order)
            print(f"✓ Collected {orders_data['ordersCount']} orders")
            return jsonify({
                'success': True,
                'message': f"Collected {orders_data['ordersCount']} orders",
                'orders': orders_data['orders']
            })
        else:
            print(f"✗ Failed to collect orders: {response.status_code}")
            return jsonify({
                'success': False,
                'error': f"Server responded with {response.status_code}"
            }), response.status_code
            
    except requests.exceptions.RequestException as e:
        print(f"✗ Collection error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port= 4000, debug=True)