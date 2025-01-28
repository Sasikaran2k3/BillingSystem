import win32print

# Find the default printer
printer_name = win32print.GetDefaultPrinter()

# Open the printer
hPrinter = win32print.OpenPrinter(printer_name)

try:
    # Start a print job
    hJob = win32print.StartDocPrinter(hPrinter, 1, ("ESC/POS Invoice Print", None, "RAW"))
    win32print.StartPagePrinter(hPrinter)

    # ESC/POS command to print invoice
    esc_pos_invoice = b'\x1b\x40'  # Initialize printer
    esc_pos_invoice += b'\x1b\x21\x20'  # Double height
    esc_pos_invoice += b'*** INVOICE ***\n'
    esc_pos_invoice += b'\x1b\x21\x00'  # Cancel double height

    esc_pos_invoice += b'Date: 2025-01-28\n'
    esc_pos_invoice += b'Invoice #: 123456\n'
    esc_pos_invoice += b'Customer Name: John Doe\n'
    esc_pos_invoice += b'Address: 1234 Elm Street, SomeCity, ST 56789\n'
    esc_pos_invoice += b'Phone: (555) 123-4567\n'
    esc_pos_invoice += b'\n'    
    esc_pos_invoice += b'Item                Qty    Price    Total\n'
    esc_pos_invoice += b'----------------------------------------\n'
    esc_pos_invoice += b'Widget A            2      50.00    100.00\n'
    esc_pos_invoice += b'Widget B            1      30.00     30.00\n'
    esc_pos_invoice += b'Widget C            5      10.00     50.00\n'
    esc_pos_invoice += b'----------------------------------------\n'
    esc_pos_invoice += b'Subtotal                         180.00\n'
    esc_pos_invoice += b'Tax (5%)                           9.00\n'
    esc_pos_invoice += b'Total                            189.00\n'
    esc_pos_invoice += b'----------------------------------------\n'
    esc_pos_invoice += b'\n'
    esc_pos_invoice += b'Thank you for your business!\n'
    esc_pos_invoice += b'\x1d\x56\x00'  # Perform full cut

    # Print the invoice
    win32print.WritePrinter(hPrinter, esc_pos_invoice)

    # End the print job
    win32print.EndPagePrinter(hPrinter)
    win32print.EndDocPrinter(hPrinter)
finally:
    win32print.ClosePrinter(hPrinter)
