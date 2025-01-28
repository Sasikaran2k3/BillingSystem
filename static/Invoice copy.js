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
            <td>${product.price.toFixed(2)}</td>
            <td>${quantity}</td>
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

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted!', {
            totalAmount: document.getElementById('totalAmount').value,
            lineItems: Array.from(lineItemsTable.rows).map(row => ({
                productCode: row.cells[0].textContent,
                productName: row.cells[1].textContent,
                unitPrice: row.cells[2].textContent,
                quantity: row.cells[3].textContent,
                total: row.cells[4].textContent
            }))
        });
        alert('Invoice created! Check the console for details.');
    });
});

// Global function to remove line item (called from inline onclick)
function removeLineItem(button) {
    const row = button.closest('tr');
    row.parentNode.removeChild(row);
    document.getElementById('invoiceForm').dispatchEvent(new Event('input'));
}
