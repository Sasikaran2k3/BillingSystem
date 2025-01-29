document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('invoiceForm');
    const lineItemsTable = document.getElementById('lineItems').getElementsByTagName('tbody')[0];
    const totalAmountInput = document.getElementById('totalAmount');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productQtyInput = document.getElementById('productQty');
    const barCodeInput = document.getElementById('barCode');
    const suggestionsDiv = document.getElementById('suggestions');
    const discountInput = document.getElementById('discount');
    const netTotalInput = document.getElementById('netTotal');

    // Set current date
    document.getElementById('currentDate').textContent = new Date().toISOString().split('T')[0];

    // Fetch products from the server
    let products = [];

    async function fetchProducts() {
        const response = await fetch('/api/products');
        products = await response.json();
        showAutocompleteSuggestions(products);
    }

    fetchProducts();
    let customers = [];

    async function fetchCustomers() {
        const response = await fetch('/api/customers');
        customers = await response.json();
    }

    fetchCustomers();
    function showAutocompleteSuggestions(products) {
        suggestionsDiv.innerHTML = "";

        products.forEach(product => {
            const item = document.createElement("div");
            item.classList.add("suggestion");
            item.textContent = `${product.product_id} - ${product.name} - $${product.price} - Stock: ${product.stock}`;

            item.addEventListener("click", function() {
                productIdInput.value = product.product_id;
                productNameInput.value = product.name;
                productQtyInput.focus();
                suggestionsDiv.innerHTML = "";
            });

            suggestionsDiv.appendChild(item);
            suggestionsDiv.style.display = 'block';
            suggestionsDiv.style.border = 'solid 1px #ccc';
        });
    }

    productIdInput.addEventListener('focus', function() {
        suggestionsDiv.style.display = 'block';
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'End') {
            document.getElementById('createInvoiceBtn').focus();
        }
    });

    productIdInput.addEventListener('input', function() {
        const query = productIdInput.value.toLowerCase();

        const filteredProducts = products.filter(product =>
            product.product_id.toString().includes(query)
        );

        showAutocompleteSuggestions(filteredProducts);
    });

    productIdInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const productId = productIdInput.value;
            const product = products.find(p => p.product_id.toString() === productId);

            if (product) {
                productNameInput.value = product.name;
                productQtyInput.focus();
                suggestionsDiv.innerHTML = "";
            } else {
                productNameInput.value = '';
            }
        }
    });

    barCodeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = barCodeInput.value;
            const product = products.find(p => p.barcode === barcode);

            if (product) {
                productNameInput.value = product.name;
                productQtyInput.focus();
                suggestionsDiv.innerHTML = "";
            } else {
                productNameInput.value = '';
            }
        }
    });

    productNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            productQtyInput.focus();
        }
    });
    productQtyInput.addEventListener('focus', function() {
        productQtyInput.value = '1';
        productQtyInput.select();
    });
    

    productQtyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const productId = productIdInput.value;
            const productName = productNameInput.value;
            const quantity = parseInt(productQtyInput.value);

            const product = products.find(p => p.product_id.toString() === productId || p.name === productName);

            if (product && quantity > 0) {
                addLineItem(product, quantity);
                productIdInput.value = '';
                productNameInput.value = '';
                productQtyInput.value = '';
                barCodeInput.value = '';
                barCodeInput.focus();
            }
        }
    });
    document.getElementById('customerName').value = 'CASH';
    document.getElementById('customerName').addEventListener('focus', function() {
        this.select();
    });    
    function addLineItem(product, quantity) {
        const newRow = lineItemsTable.insertRow();
        newRow.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.name}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${product.price.toFixed(2)}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${quantity}</td>
            <td>${(product.price * quantity).toFixed(2)}</td>
            <td><button type="button" onclick="removeLineItem(this)">Remove</button></td>
        `;
        updateTotalAmount();
    }


    function updateTotalAmount() {
        const totals = Array.from(lineItemsTable.querySelectorAll('tr')).map(row => parseFloat(row.cells[4].textContent) || 0);
        const sum = totals.reduce((a, b) => a + b, 0);
        totalAmountInput.value = `₹ ${sum.toFixed(2)}`;
        const discount = parseFloat(discountInput.value) || 0;
        if (discount > 0) {
            netTotalInput.value = `₹ ${(sum - discount).toFixed(2)}`;
            netTotalInput.style.display = 'block';
        } else {
            netTotalInput.style.display = 'none';
        }
    }

    discountInput.addEventListener('input', function() {
        updateTotalAmount();
    });

    form.addEventListener('submit', async function(e) 
    {
        e.preventDefault();
        const printOrRevert = confirm("Do you want to print the invoice?");
        if (printOrRevert) {
            // Code to print the invoice
            console.log("Printing invoice...");
        

        const totalAmount = parseFloat(totalAmountInput.value.replace('₹ ', ''));
        const discount = parseFloat(discountInput.value) || 0;
        const netTotal = totalAmount - discount;

        const invoiceData = {
            customer_id: 1, // Assuming a customer_id for now
            invoice_date: new Date().toISOString().split('T')[0],
            total_amount: totalAmount,
            discount: discount,
            net_total: netTotal

        };

        const lineItems = Array.from(lineItemsTable.rows).map(row => ({
            product_id: row.cells[0].textContent,
            quantity: parseInt(row.cells[3].textContent),
            unit_price: parseFloat(row.cells[2].textContent),
            total_price: parseFloat(row.cells[4].textContent)
        }));

        const lineItemsForPrint = Array.from(lineItemsTable.rows).map(row => ({
            product_id: row.cells[0].textContent,
            product_name: row.cells[1].textContent,
            quantity: parseInt(row.cells[3].textContent),
            unit_price: parseFloat(row.cells[2].textContent),
            total_price: parseFloat(row.cells[4].textContent)
        }));
        

        try {
            const invoiceResponse = await fetch('/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invoiceData)
            });

            if (invoiceResponse.ok) {
                const invoice = await invoiceResponse.json();
                const invoice_id = invoice.invoice_id;
                console.log('Invoice created:', invoice + '\n' + invoice_id);
                const lineItemsResponse = await fetch(`/api/invoices/${invoice_id}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ lineItems })
                });

                if (lineItemsResponse.ok) {
                    invoiceData.invoice_id = invoice_id;
                    invoiceData.customer_name = "SELVAM STORES";
                    invoiceData.customer_address = "No: 416 Periyar EVR High Road,Arumbakkam, Chennai-106 ";
                    invoiceData.customer_phone = "7358206231, 9283122209";
                    invoiceData.lineItems = lineItemsForPrint;
                    // Print the invoice
                    const printResponse = await fetch('/api/invoices/print', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(invoiceData)
                    });

                    if (printResponse.ok) {
                        console.log('Invoice created and printed successfully!');
                    } else {
                        console.error('Failed to print the invoice');
                    }

                    alert('Invoice created successfully!');
                } else {
                    console.error('Failed to add line items');
                }
                
            } else {
                console.error('Failed to create invoice');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    } else {
        // Code to revert/cancel the action
        console.log("Action reverted.");
    }
    });
});

// Global function to remove line item (called from inline onclick)
function removeLineItem(button) {
    const row = button.closest('tr');
    row.parentNode.removeChild(row);
    document.getElementById('invoiceForm').dispatchEvent(new Event('input'));
    updateTotalAmount();
}
function updateLineItem(cell) {
    const row = cell.closest('tr');
    const unitPrice = parseFloat(row.cells[2].textContent) || 0;
    const quantity = parseInt(row.cells[3].textContent) || 0;
    row.cells[4].textContent = (unitPrice * quantity).toFixed(2);
    updateTotalAmount();
}
const totalAmountInput = document.getElementById('totalAmount');
const lineItemsTable = document.getElementById('lineItems').getElementsByTagName('tbody')[0];
function updateTotalAmount() {
    const totals = Array.from(lineItemsTable.querySelectorAll('tr')).map(row => parseFloat(row.cells[4].textContent) || 0);
    const sum = totals.reduce((a, b) => a + b, 0);
    totalAmountInput.value = `₹ ${sum.toFixed(2)}`;
}
