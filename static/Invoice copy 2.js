document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('invoiceForm');
    const lineItemsTable = document.getElementById('lineItems').getElementsByTagName('tbody')[0];
    const totalAmountInput = document.getElementById('totalAmount');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productQtyInput = document.getElementById('productQty');
    const barCodeInput = document.getElementById('barCode');
    const suggestionsDiv = document.getElementById('suggestions');

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
                productIdInput.focus();
            }
        }
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

    function removeLineItem(button) {
        const row = button.closest('tr');
        row.parentNode.removeChild(row);
        updateTotalAmount();
    }

    function updateTotalAmount() {
        const totals = Array.from(lineItemsTable.querySelectorAll('tr')).map(row => parseFloat(row.cells[4].textContent) || 0);
        const sum = totals.reduce((a, b) => a + b, 0);
        totalAmountInput.value = `₹ ${sum.toFixed(2)}`;
    }

    document.addEventListener('click', function(e) {
        if (!suggestionsDiv.contains(e.target) && e.target !== productIdInput && e.target !== productNameInput) {
            suggestionsDiv.style.display = 'none';
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
    
        const invoiceData = {
            customer_id: 1, // Assuming a customer_id for now
            invoice_date: new Date().toISOString().split('T')[0],
            total_amount: parseFloat(totalAmountInput.value.replace('₹ ', '')),
            discount: 0, // Assuming no discount for now
            net_total: parseFloat(totalAmountInput.value.replace('₹ ', ''))
        };
    
        const lineItems = Array.from(lineItemsTable.rows).map(row => ({
            product_id: row.cells[0].textContent,
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
    
                const lineItemsResponse = await fetch(`/api/invoices/${invoice_id}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ lineItems })
                });
    
                if (lineItemsResponse.ok) {
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
