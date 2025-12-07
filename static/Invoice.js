document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('invoiceForm');
    const lineItemsTable = document.getElementById('lineItems').getElementsByTagName('tbody')[0];
    const totalAmountInput = document.getElementById('totalAmount');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productQtyInput = document.getElementById('productQty');
    const barCodeInput = document.getElementById('barCode');
    const suggestionsDiv = document.getElementById('suggestionsDiv');
    const discountInput = document.getElementById('discount');
    const pendingInput = document.getElementById('pending');
    const netTotalInput = document.getElementById('netTotal');
    const customerNameInput = document.getElementById('customerName');
    const customerIdInput = document.getElementById('customerId');
    const cashPaymentInput = document.getElementById('cashPayment');
    const onlinePaymentInput = document.getElementById('onlinePayment');
    const displayTotalAmt = document.getElementById('displayTotalAmount');
    const displayTotalItems = document.getElementById('displayTotalItems');
    // Set current date
    document.getElementById('currentDate').textContent = new Date().toISOString().split('T')[0];

    // Fetch products from the server
    let products = [];
    let customers = [];

    async function fetchProducts() {
        const response = await fetch('/api/products');
        products = await response.json();
    }

    function showToast(message) {
        const toast = document.getElementById('toast');
        const toastMessage = toast.querySelector('.toast-message');

        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000); // Hide the toast after 3 seconds
    }

    async function fetchCustomers() {
        const response = await fetch('/api/customers');
        customers = await response.json();
        const customerName = "CASH";
        const defaultCustomer = customers.find(c => c.name.toUpperCase() === customerName);
        document.getElementById('customerName').value = defaultCustomer.name;
        document.getElementById('customerId').value = defaultCustomer.id;
    }

    fetchProducts();
    fetchCustomers();


    function showAutocompleteSuggestions(items, isCustomer = false) {
        suggestionsDiv.innerHTML = "";

        items.forEach((item, index) => {
            const suggestion = document.createElement("div");
            suggestion.classList.add("suggestion");

            if (isCustomer) {
                suggestion.textContent = `${item.id} - ${item.name} - ${item.phone}`;
                suggestion.addEventListener("click", function() {
                    document.getElementById('customerId').value = item.id;
                    customerNameInput.value = item.name;
                    document.getElementById('customerAddress').value = item.address;
                    document.getElementById('customerPhone').value = item.phone;
                    suggestionsDiv.innerHTML = "";
                });
            } else {
                suggestion.textContent = `${item.product_id} - ${item.name} - ₹${item.price} - Stock: ${item.stock}`;
                suggestion.addEventListener("click", function() {
                    productIdInput.value = item.product_id;
                    productNameInput.value = item.name;
                    productQtyInput.focus();
                    suggestionsDiv.innerHTML = "";
                });
            }

            suggestion.dataset.index = index;
            suggestionsDiv.appendChild(suggestion);
        });

        // Highlight or select the first item
        if (suggestionsDiv.firstChild) {
            suggestionsDiv.firstChild.classList.add('selected');
            selectedIndex = 0; // Update selectedIndex to the first item
        }

        suggestionsDiv.style.display = 'block';
        suggestionsDiv.style.border = 'solid 1px #ccc';
    }

    let selectedIndex = -1;

    // Event listeners for keydown to navigate suggestions
    productNameInput.addEventListener('keydown', navigateSuggestions);
    customerNameInput.addEventListener('keydown', navigateSuggestions);
    customerIdInput.addEventListener('keydown', navigateSuggestions);

    function navigateSuggestions(e) {
        const suggestions = suggestionsDiv.querySelectorAll('.suggestion');
        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedIndex < suggestions.length - 1) {
                if (selectedIndex >= 0) suggestions[selectedIndex].classList.remove('selected');
                selectedIndex++;
                suggestions[selectedIndex].classList.add('selected');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedIndex > 0) {
                suggestions[selectedIndex].classList.remove('selected');
                selectedIndex--;
                suggestions[selectedIndex].classList.add('selected');
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                suggestions[selectedIndex].click();
                selectedIndex = -1;
            }
        }
    }
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Insert')
            document.getElementById('customerName').focus();
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape')
            document.getElementById('sideMenu').style.display = 'none';
    });
    document.addEventListener('click', function(event) {
        const target = event.target;
        if (target !== productNameInput && target !== customerNameInput && target !== customerIdInput) {
            document.getElementById('sideMenu').style.display = 'none';
        }
    });

    productNameInput.addEventListener('focus', function() {
        document.getElementById('sideMenu').style.display = 'block';
        showAutocompleteSuggestions(products);
    });

    customerNameInput.addEventListener('focus', function() {
        showAutocompleteSuggestions(customers, true);
        document.getElementById('sideMenu').style.display = 'block';
    });
    customerIdInput.addEventListener('focus', function() {
        showAutocompleteSuggestions(customers, true);
        document.getElementById('sideMenu').style.display = 'block';
    });
    productIdInput.addEventListener('input', function() {
        const query = productIdInput.value.toLowerCase();
        const filteredProducts = products.filter(product =>
            product.product_id.toString().includes(query)
        );

        (filteredProducts);
    });

    productIdInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const productId = productIdInput.value;
            const product = products.find(p => p.product_id.toString() === productId);

            if (product) {
                barCodeInput.value = product.barcode;
                productNameInput.value = product.name;
                productQtyInput.focus();
                suggestionsDiv.innerHTML = "";
            } else {
                productNameInput.value = '';
                showToast("Error : Product Code not Found !");
            }
        }
    });

    customerNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById("customerAddress").focus();
        }
    });
    document.getElementById("customerAddress").addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById("customerPhone").focus();
        }
    });
    document.getElementById("customerPhone").addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            barCodeInput.focus();
        }
    });
    barCodeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const barcode = barCodeInput.value;
            if (barcode != '') {
                const product = products.find(p => p.barcode === barcode);
                if (product) {
                    productIdInput.value = product.product_id;
                    productNameInput.value = product.name;
                    productQtyInput.focus();
                    suggestionsDiv.innerHTML = "";
                } else {
                    productNameInput.value = '';
                    productIdInput.value = '';
                    showToast("Error : Barcode not Found !");
                }
            }
        }
    });
    productNameInput.addEventListener('input', async function() {
        const query = productNameInput.value;
        const response = await fetch(`/api/products?query=${query}`);
        const products = await response.json();
        showAutocompleteSuggestions(products);
    });

    customerNameInput.addEventListener('input', async function() {
        const query = customerNameInput.value;
        const response = await fetch(`/api/customers?query=${query}`);
        const customers = await response.json();
        showAutocompleteSuggestions(customers, true);
    });
    customerIdInput.addEventListener('input', async function() {
        const query = customerIdInput.value;
        const filteredCustomers = [];
        customers.forEach(c => {
            if (c.id.toString().startsWith(query)) {
                filteredCustomers.push(c);
            }
        });
        showAutocompleteSuggestions(filteredCustomers, true);
    });

    productNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('sideMenu').style.display = 'none';
            productQtyInput.focus();
        }
    });

    productQtyInput.addEventListener('focus', function() {
        productQtyInput.select();
    });

    productQtyInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const productId = productIdInput.value;
            const productName = productNameInput.value;
            const quantity = parseFloat(productQtyInput.value);

            const product = products.find(p => p.product_id.toString() === productId || p.name === productName);
            console.log(quantity);
            if (product && quantity > 0 && quantity < 10000) {
                addLineItem(product, quantity);
                productIdInput.value = '';
                productNameInput.value = '';
                productQtyInput.value = '';
                barCodeInput.value = '';
                barCodeInput.focus();
            } else if (isNaN(quantity)) {
                showToast("Error: Quantity cannot be empty !");
            } else if (quantity == 0) {
                showToast("Error: Quantity cannot be 0 !");
            }else if (quantity > 10000) {
		        productQtyInput.value = '';
                showToast("Error: Quantity cannot be QR Code !");
            } 
            else {
                showToast("Error: Product not Found !");
            }
        }
    });

    document.getElementById('customerName').addEventListener('focus', function() {
        this.select();
    });
    function scrollTableToBottom() {
        const tableWrapper = document.querySelector('#lineItems').parentElement;
        tableWrapper.scrollTop = tableWrapper.scrollHeight;
    }

    function addLineItem(product, quantity) {
        const newRow = lineItemsTable.insertRow();
        newRow.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.name}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${product.price.toFixed(2)}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${quantity}</td>
            <td>${(product.price * quantity).toFixed(2)}</td>
            <td style="display: none;">${product.tax || 5}%</td>
            <td><button type="button" onclick="removeLineItem(this)">Remove</button></td>
        `;
        scrollTableToBottom();
        updateTotalAmount();
    }

    function updateTotalAmount() {
        const totals = Array.from(lineItemsTable.querySelectorAll('tr')).map(row => parseFloat(row.cells[4].textContent) || 0);
        let sum = totals.reduce((a, b) => a + b, 0);
        totalAmountInput.value = `₹ ${sum.toFixed(2)}`;
        const discount = parseFloat(discountInput.value) || 0;
        const pending = parseFloat(pendingInput.value) || 0;
        if (discount > 0 || pending > 0) {
            sum = sum - discount + pending;
            netTotalInput.value = `₹ ${(sum).toFixed(2)}`;
            netTotalInput.style.display = 'block';
        } else {
            netTotalInput.style.display = 'none';
            sum = sum - discount + pending;
            netTotalInput.value = `₹ ${(sum).toFixed(2)}`;
        }
        displayTotalAmt.textContent = `₹ ${sum.toFixed(2)}`;
        displayTotalItems.textContent = totals.length;
        calculateBalance();
    }

    discountInput.addEventListener('input', function() {
        updateTotalAmount();
    });

    pendingInput.addEventListener('input', function() {
        updateTotalAmount();
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'End') {
            document.getElementById('cashPayment').focus();
		window.scrollTo(0,document.body.scrollHeight);
        }
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Home') {
            document.getElementById('barCode').focus();
        }
    });
    cashPaymentInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            onlinePaymentInput.focus();
        }
    });
    onlinePaymentInput.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('createInvoiceBtn').click();
        }
    });
    document.getElementById("InvoiceId").addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            handleEnterPress();
        }
    });
    let main_items = [];
    async function handleEnterPress() {
        await fetchCustomers();
        document.querySelectorAll('td button').forEach(button => {
            button.click();
        });

        const invoiceId = document.getElementById("InvoiceId").value;

        await fetch(`/api/invoices?query=${invoiceId}`)
            .then(response => response.json())
            .then(invoice => {
                if (invoice.length === 0) {
                    alert("Invoice not found!");
                    return;
                }
                document.getElementById("InvoiceId").value = invoice[0].invoice_id;
                document.getElementById("customerId").value = invoice[0].customer_id;
                console.log(customers);
                const instant = customers.find(c => c.id == invoice[0].customer_id);
                document.getElementById("customerName").value = instant["name"];
                document.getElementById("customerAddress").value = instant["address"];
                document.getElementById("customerPhone").value = instant["phone"];
                document.getElementById("currentDate").value = invoice[0].invoice_date;
                document.getElementById("totalAmount").value = invoice[0].total_amount;
                document.getElementById("discount").value = invoice[0].discount;
                document.getElementById("netTotal").value = invoice[0].net_total;
            });
        await fetch(`/api/invoices/${invoiceId}/items`)
            .then(response => response.json())
            .then(items => {
                for (const item of items) {
                    const product = products.find(p => p.product_id === item.product_id);
                    if (!product) continue; // Skip this item if no matching product is found
                    item.name = product.name;
                    item.price = item.unit_price;
                    item.tax = product.tax || 5; // Default tax rate if not found
                    main_items.push(item);
                    addLineItem(item, item.quantity);
                }
            });
        barCodeInput.focus();
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitButton = form.querySelector('input[type="submit"], button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Processing...'; // Optional: change text
        }
        const printOrRevert = confirm("Do you want to save the bill ?");
        if (printOrRevert) {
            const totalAmount = parseFloat(totalAmountInput.value.replace('₹ ', ''));
            const discount = parseFloat(discountInput.value) || 0;
            const pending = parseFloat(pendingInput.value) || 0;
            const netTotal = totalAmount - discount + pending;
            const tax_batch = {};

            // This main has code to update an invoice
            if (main_items.length > 0) {
                const createItems = [];
                const deleteItems = [];
                const updateItems = [];
                const lineItems = Array.from(lineItemsTable.rows).map(row => {
                    const product_id = row.cells[0].textContent;
                    const quantity = parseFloat(row.cells[3].textContent);
                    const unit_price = parseFloat(row.cells[2].textContent);
                    const total_price = parseFloat(row.cells[4].textContent);
                    
                    // Get tax rate from the product (you'll need to fetch this from your products data)
                    // Assuming you have access to products data or tax rate
                    const tax_rate = parseFloat(row.cells[5].textContent) || 5; // Default 5% if not found
                    
                    const price_without_tax = Math.round((total_price / (1 + tax_rate / 100)) * 100) / 100;

                    // Calculate GST components: each is (tax_rate/2)% of basic amount
                    const gst_rate_half = tax_rate / 2;

                    const gst_price = (price_without_tax * gst_rate_half / 100) ;
                    const cgst_price = gst_price;               
                    
                    const tax_amount = gst_price + cgst_price;

                    console.log(`Edit Tax: ${tax_rate}, GST Price: ${gst_price}, CGST Price: ${cgst_price}, price_without_tax: ${price_without_tax}`);
                    // Add to tax_batch object with format: {tax_rate: [total_price_without_tax, tax_amount]}
                    // Dynamic tax calculation for tax_batch
                    const tax_key = tax_rate;
                    if (tax_batch[tax_key]) {
                        tax_batch[tax_key][0] += price_without_tax; // Add to total price without tax
                        tax_batch[tax_key][1] += tax_amount; // Add to tax amount
                    } else {
                        tax_batch[tax_key] = [price_without_tax, tax_amount];
                    }
                    
                    // Round tax_batch values to 2 decimal places
                    tax_batch[tax_key][0] = Math.round(tax_batch[tax_key][0] * 100) / 100;
                    tax_batch[tax_key][1] = Math.round(tax_batch[tax_key][1] * 100) / 100;
                    
                    return {
                        product_id: product_id,
                        quantity: quantity,
                        unit_price: unit_price,
                        total_price: total_price,
                        gst_price: gst_price,
                        cgst_price: cgst_price,
                        tax_rate: tax_rate
                    };
                });
                lineItems.forEach(newItem => {
                    const oldItem = main_items.find(item => item.product_id == newItem.product_id);
                    if (!oldItem) {
                        // Create: New item (not found in main_items)
                        createItems.push(newItem);
                        console.log("Create: ", newItem);
                    } else if (newItem.total_price !== oldItem.total_price || newItem.quantity !== oldItem.quantity) {
                        // Update: Existing item but properties have changed
                        updateItems.push({
                            oldItem: oldItem,
                            newItem: newItem
                        });
                        console.log("Update: ", JSON.stringify(newItem));
                    }
                });
                // Find items that exist in main_items but are missing from lineItems (i.e., deleted)
                main_items.forEach(oldItem => {
                    const isDeleted = !lineItems.some(newItem => newItem.product_id == oldItem.product_id);
                    if (isDeleted) {
                        deleteItems.push(oldItem);
                        console.log("Delete: ", oldItem);
                    }
                });

                const now = new Date();
                // Format date as DD/MM/YY
                const datePart = now.toLocaleDateString('en-GB').split('/').join('/');
                // Format time as HH:MM:SS
                const timePart = now.toLocaleTimeString('en-GB', { hour12: false });
                console.log(onlinePaymentInput.value);
                const invoice_date = `${datePart} - ${timePart}`;
                const invoiceData = {
                    customer_id: document.getElementById('customerId').value,
                    invoice_date: invoice_date,
                    total_amount: totalAmount,
                    discount: discount,
                    pending: pending,
                    net_total: netTotal,
                    mode_of_payment: onlinePaymentInput.value ? "UPI" : "Cash"
                };
                const lineItemsForPrint = Array.from(lineItemsTable.rows).map(row => ({
                    product_id: row.cells[0].textContent,
                    product_name: row.cells[1].textContent,
                    quantity: parseFloat(row.cells[3].textContent),
                    unit_price: parseFloat(row.cells[2].textContent),
                    total_price: parseFloat(row.cells[4].textContent)
                }));
                invoiceData.invoice_id = document.getElementById('InvoiceId').value;
                invoiceData.customer_name = document.getElementById('customerName').value;
                invoiceData.customer_address = document.getElementById('customerAddress').value;
                invoiceData.customer_phone = document.getElementById('customerPhone').value;
                invoiceData.lineItems = lineItemsForPrint;
                const onlinePaymentValue = parseFloat(onlinePaymentInput.value) || 0;
                const cashPaymentValue = parseFloat(cashPaymentInput.value) || 0;
                invoiceData.recieved_amount = onlinePaymentValue + cashPaymentValue;
                invoiceData.tax_batch = tax_batch;

                const invoiceResponse = await fetch(`/api/invoices/${invoiceData.invoice_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoiceData)
                });

                for (const item of deleteItems) {
                    const response = await fetch(`/api/invoices/${item.invoice_id}/items/${item.invoice_item_id}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        console.log(`Item ${item.invoice_item_id} deleted successfully!`);
                    } else {
                        console.error(`Failed to delete item ${item.invoice_item_id}`);
                    }
                }
                for (const item of updateItems) {
                    const response = await fetch(`/api/invoices/${item.oldItem.invoice_id}/items/${item.oldItem.invoice_item_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(item.newItem)
                    });
                    if (response.ok) {
                        console.log(`Item ${item.oldItem.invoice_item_id} updated successfully!`);
                    } else {
                        console.error(`Failed to update item ${item.oldItem.invoice_item_id}`);
                    }
                }
                for (const item of createItems) {
                    console.log(JSON.stringify(item))
                    const response = await fetch(`/api/invoices/${invoiceData.invoice_id}/items`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ "lineItems": [item] })
                    });
                    if (response.ok) {
                        console.log(`Item ${item.invoice_item_id} created successfully!`);
                    } else {
                        console.error(`Failed to create item ${item.invoice_item_id}`);
                    }
                }
                if (confirm('Do you want to print?')) {
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
                }
                window.location.href = "./";
                // Code for updating the invoice 
            } else {
                const totalAmount = parseFloat(totalAmountInput.value.replace('₹ ', ''));
                const discount = parseFloat(discountInput.value) || 0;
                const pending = parseFloat(pendingInput.value) || 0;
                const netTotal = totalAmount - discount + pending;

                const now = new Date();
                // Format date as DD/MM/YY
                const datePart = now.toLocaleDateString('en-GB').split('/').join('/');

                // Format time as HH:MM:SS
                const timePart = now.toLocaleTimeString('en-GB', { hour12: false });

                const invoice_date = `${datePart} - ${timePart}`;
                const invoiceData = {
                    customer_id: document.getElementById('customerId').value,
                    invoice_date: invoice_date,
                    total_amount: totalAmount,
                    discount: discount,
                    pending: pending,
                    net_total: netTotal,
                    mode_of_payment: onlinePaymentInput.value ? "UPI" : "Cash"
                };


            const tax_batch = {};

            const lineItems = Array.from(lineItemsTable.rows).map(row => {
                const product_id = row.cells[0].textContent;
                const quantity = parseFloat(row.cells[3].textContent);
                const unit_price = parseFloat(row.cells[2].textContent);
                const total_price = parseFloat(row.cells[4].textContent);
            
                // Get tax rate from the product (you'll need to fetch this from your products data)
                // Assuming you have access to products data or tax rate
                const tax_rate = parseFloat(row.cells[5].textContent) || 5; // Default 5% if not found
                
                const price_without_tax_ = Math.round((total_price / (1 + tax_rate / 100)) * 100) / 100;

                // Calculate GST components: each is (tax_rate/2)% of basic amount
                const gst_rate_half = tax_rate / 2;

                const gst_price = price_without_tax_ * gst_rate_half / 100;
                const cgst_price = gst_price;              
                
                const tax_amount = gst_price + cgst_price;

                console.log(`Tax: ${tax_rate}, GST Price: ${gst_price}, CGST Price: ${cgst_price}, price_without_tax: ${price_without_tax_}`);

                // Dynamic tax calculation for tax_batch
                
                
                // Add to tax_batch object with format: {tax_rate: [total_price_without_tax, tax_amount]}
                const tax_key = tax_rate;
                if (tax_batch[tax_key]) {
                    tax_batch[tax_key][0] += price_without_tax_; // Add to total price without tax
                    tax_batch[tax_key][1] += tax_amount; // Add to tax amount
                } else {
                    tax_batch[tax_key] = [price_without_tax_, tax_amount];
                }
                
                // Round tax_batch values to 2 decimal places
                tax_batch[tax_key][0] = Math.round(tax_batch[tax_key][0] * 100) / 100;
                tax_batch[tax_key][1] = Math.round(tax_batch[tax_key][1] * 100) / 100;
                
                return {
                    product_id: product_id,
                    quantity: quantity,
                    unit_price: unit_price,
                    total_price: total_price,
                    gst_price: gst_price,
                    cgst_price: cgst_price,
                    tax_rate: tax_rate
                };
            });

            // Log the final tax_batch object

                const lineItemsForPrint = Array.from(lineItemsTable.rows).map(row => ({
                    product_id: row.cells[0].textContent,
                    product_name: row.cells[1].textContent,
                    quantity: parseFloat(row.cells[3].textContent),
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
                        const lineItemsResponse = await fetch(`/api/invoices/${invoice_id}/items`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ lineItems })
                        });
                        if (lineItemsResponse.ok) {
                            invoiceData.invoice_id = invoice_id;
                            invoiceData.customer_name = document.getElementById('customerName').value;
                            invoiceData.customer_address = document.getElementById('customerAddress').value;
                            invoiceData.customer_phone = document.getElementById('customerPhone').value;
                            invoiceData.lineItems = lineItemsForPrint;
                            const onlinePaymentValue = parseFloat(onlinePaymentInput.value) || 0;
                            const cashPaymentValue = parseFloat(cashPaymentInput.value) || 0;
                            invoiceData.recieved_amount = onlinePaymentValue + cashPaymentValue;
                            invoiceData.tax_batch = tax_batch;
                            // Print the invoice
                            if (confirm('Do you want to print?')) {
                                const clientIp = '';
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
                                    showToast('Failed to print the invoice');
                                }
                            }
                            alert('Invoice created successfully!');
                            location.reload();
                        } else {
                            const errorData = await lineItemsResponse.json();
                            showToast(errorData.error || "Failed to create invoice.");
                            console.error(errorData.error || "Failed to create invoice.");
                        }
                    } else {
                        const errorData = await invoiceResponse.json();
                        showToast(errorData.error || "Failed to create invoice.");
                        console.error(errorData.error || "Failed to create invoice.");
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            }
        } else {
            // Code to revert/cancel the action
            console.log("Action reverted.");
        }
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit'; // Restore original text
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
    const quantity = parseFloat(row.cells[3].textContent) || 0;
    row.cells[4].textContent = (unitPrice * quantity).toFixed(2);
    updateTotalAmount();
}
const totalAmountInput = document.getElementById('totalAmount');
const lineItemsTable = document.getElementById('lineItems').getElementsByTagName('tbody')[0];

function updateTotalAmount() {
    const totals = Array.from(lineItemsTable.querySelectorAll('tr')).map(row => parseFloat(row.cells[4].textContent) || 0);
    let sum = totals.reduce((a, b) => a + b, 0);
    totalAmountInput.value = `₹ ${sum.toFixed(2)}`;
    const discountInput = document.getElementById('discount');
    const netTotalInput = document.getElementById('netTotal');
    const pendingInput = document.getElementById('pending');
    const discount = parseFloat(discountInput.value) || 0;
    const pending = parseFloat(pendingInput.value) || 0;
    if (discount > 0 || pending > 0) {
        sum = sum - discount + pending;
        netTotalInput.value = `₹ ${(sum).toFixed(2)}`;
        netTotalInput.style.display = 'block';
    } else {
        netTotalInput.style.display = 'none';
        sum = sum - discount + pending;
        netTotalInput.value = `₹ ${(sum).toFixed(2)}`;
    }
    const displayTotalAmt = document.getElementById('displayTotalAmount');
    const displayTotalItems = document.getElementById('displayTotalItems');
    displayTotalAmt.textContent = `₹ ${sum.toFixed(2)}`;
    displayTotalItems.textContent = totals.length;
    calculateBalance();
}
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('InvoiceId');
    const urlParams = new URLSearchParams(window.location.search);
    const word = urlParams.get('query');
    if (input && word !== null) {
        input.value = word;
        console.log("Word: ", word);
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
    } else {
        console.log("Input element with ID 'invoiceId' not found. or no query");
    }
});
function calculateBalance() {
    const netTotal = parseFloat(document.getElementById('netTotal').value.replace('₹ ', '')) || 0;
    const total_amount = parseFloat(document.getElementById('totalAmount').value.replace('₹ ', '')) || 0;
    const cashPayment = parseFloat(document.getElementById('cashPayment').value) || 0;
    const onlinePayment = parseFloat(document.getElementById('onlinePayment').value) || 0;
    let balance = 0.0;
    const totalPaid = cashPayment + onlinePayment;
    if(netTotal !== total_amount && netTotal === 0)
        balance = totalPaid - total_amount;
    else
        balance = totalPaid - netTotal;
    console.log("Net Total: ", netTotal);
    console.log("Total Amount: ", total_amount);
    document.getElementById('Balance').value = balance.toFixed(2);
  }

  // Add event listeners
  document.getElementById('cashPayment').addEventListener('focus', calculateBalance);
  document.getElementById('cashPayment').addEventListener('input', calculateBalance);
  document.getElementById('onlinePayment').addEventListener('input', calculateBalance);

function syncOrders() {
    fetch('/api/collectOrders')
        .then(response => response.json())
        .then(data => {
            if (data.success === true) {
                console.log(data);
                alert(`✅ ${data.message}`);
            } else {
                console.error('Error:', data.error);
                alert(`❌ ${data.error}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('⚠️ Failed to synchronize orders.');
        });
}
