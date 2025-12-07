document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('invoiceForm');
    const lineItemsTable = document.getElementById('lineItems').getElementsByTagName('tbody')[0];
    const totalAmountInput = document.getElementById('totalAmount');
    const productIdInput = document.getElementById('productId');
    const productNameInput = document.getElementById('productName');
    const productQtyInput = document.getElementById('productQty');
    const barCodeInput = document.getElementById('barCode');
    const suggestionsDiv = document.getElementById('suggestionsDiv');

    // Fetch products from the server
    let products = [];

    async function fetchProducts() {
        const response = await fetch('/api/products');
        products = await response.json();
    }

    fetchProducts();


    function showAutocompleteSuggestions(items) {
        suggestionsDiv.innerHTML = "";

        items.forEach((item, index) => {
            const suggestion = document.createElement("div");
            suggestion.classList.add("suggestion");


            suggestion.textContent = `${item.product_id} - ${item.name} - $${item.price} - Stock: ${item.stock}`;
            suggestion.addEventListener("click", function() {
                productIdInput.value = item.product_id;
                productNameInput.value = item.name;
                productQtyInput.focus();
                suggestionsDiv.innerHTML = "";
            });

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
        if (event.key === 'Escape')
            document.getElementById('sideMenu').style.display = 'none';
    });
    document.addEventListener('click', function(event) {
        const target = event.target;
        if (target !== productNameInput) {
            document.getElementById('sideMenu').style.display = 'none';
        }
    });

    productNameInput.addEventListener('focus', function() {
        document.getElementById('sideMenu').style.display = 'block';
        showAutocompleteSuggestions(products);
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
                barCodeInput.value = product.barcode;
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
                productIdInput.value = product.product_id;
                productNameInput.value = product.name;
                productQtyInput.focus();
                suggestionsDiv.innerHTML = "";
            } else {
                productNameInput.value = '';
            }
        }
    });

    productNameInput.addEventListener('input', async function() {
        const query = productNameInput.value;
        const response = await fetch(`/api/products?query=${query}`);
        const products = await response.json();
        showAutocompleteSuggestions(products);
    });


    productNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('sideMenu').style.display = 'none';
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
    document.addEventListener('keydown', function(event) {
        if (event.key === 'End') {
            document.getElementById('createInvoiceBtn').focus();
        }
    });


    function addLineItem(product, quantity) {
        console.log(product);
        const newRow = lineItemsTable.insertRow();
        newRow.innerHTML = `
            <td>${product.product_id}</td>
            <td>${product.name}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${product.price.toFixed(2)}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${product.mrp.toFixed(2)}</td>
            <td contenteditable="true" oninput="updateLineItem(this)">${quantity}</td>
            <td contenteditable="true" oninput="updateLineItem(this)"></td>
            <td contenteditable="true" oninput="updateLineItem(this)"></td>
            <td><button type="button" onclick="removeLineItem(this)">Remove</button></td>
        `;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const lineItemsForPrint = Array.from(lineItemsTable.rows).map(row => ({
            barcode: products.find(p => p.product_id.toString() === row.cells[0].textContent).barcode,
            product_name: row.cells[1].textContent,
            unit_price: parseFloat(row.cells[2].textContent),
            mrp: parseInt(row.cells[3].textContent),
            qty: parseInt(row.cells[4].textContent),
            mf_date: row.cells[5].textContent,
            exp_date: row.cells[6].textContent
        }));
        try {
            const response = await fetch('/api/barcode/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(lineItemsForPrint)
            });

            const result = await response.json();
            if (response.ok) {
                console.log("Barcode print request successful:", result.message);
                alert('Barcode created successfully!');
                location.reload();
            } else {
                console.error("Error printing barcode:", result.error);
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
});

// Global function to remove line item (called from inline onclick)
function removeLineItem(button) {
    const row = button.closest('tr');
    row.parentNode.removeChild(row);
    document.getElementById('invoiceForm').dispatchEvent(new Event('input'));
}

function updateLineItem(cell) {
    const row = cell.closest('tr');
    const unitPrice = parseFloat(row.cells[2].textContent) || 0;
    const quantity = parseInt(row.cells[3].textContent) || 0;
}
document.querySelector("input").setAttribute("autocomplete", "off");