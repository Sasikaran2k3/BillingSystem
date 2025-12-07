document.addEventListener("DOMContentLoaded", function() {
    loadProducts();
});

function loadProducts() {
    fetch("/api/products")
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
            tbody.innerHTML = "";
            data.forEach(product => {
                const row = tbody.insertRow();
                row.insertCell().textContent = product.product_id;        // Index 0
                row.insertCell().textContent = product.name;              // Index 1
                row.insertCell().textContent = product.category;          // Index 2
                row.insertCell().textContent = product.price;             // Index 3
                row.insertCell().textContent = product.purchase_cost;     // Index 4
                row.insertCell().textContent = product.mrp;               // Index 5
                row.insertCell().textContent = product.stock;             // Index 6
                row.insertCell().textContent = product.barcode || "N/A";  // Index 7
                row.insertCell().textContent = product.tax || "5";        // Index 8 - Tax%
                row.insertCell().textContent = product.HSN || "";         // Index 9 - HSN Code

                const actionCell = row.insertCell();                       // Index 10 - Actions
                const updateButton = document.createElement("button");
                updateButton.textContent = "Update";
                updateButton.onclick = () => showPopup(product);
                actionCell.appendChild(updateButton);
            });
        });
}

function applyFilters() {
    const filterBarcode = document.getElementById("filterBarcode").value.toLowerCase();
    const filterCode = document.getElementById("filterCode").value.toLowerCase();
    const filterName = document.getElementById("filterName").value.toLowerCase();
    const filterCategory = document.getElementById("filterCategory").value.toLowerCase();
    const table = document.getElementById("productTable");
    const rows = table.getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        let showRow = true;
        const cells = rows[i].getElementsByTagName("td");

        if (filterBarcode && !cells[7].textContent.toLowerCase().includes(filterBarcode)) {
            showRow = false;
        }
        if (filterCode && !cells[0].textContent.toLowerCase().includes(filterCode)) {
            showRow = false;
        }
        if (filterName && !cells[1].textContent.toLowerCase().includes(filterName)) {
            showRow = false;
        }
        if (filterCategory && !cells[2].textContent.toLowerCase().includes(filterCategory)) {
            showRow = false;
        }

        rows[i].style.display = showRow ? "" : "none";
    }
}

function resetFilters() {
    document.getElementById("filterBarcode").value = "";
    document.getElementById("filterCode").value = "";
    document.getElementById("filterName").value = "";
    document.getElementById("filterCategory").value = "";
    applyFilters();
}

function showPopup(product) {
    document.getElementById("originalProductId").value = product.product_id;
    document.getElementById("updateProductId").value = product.product_id;
    document.getElementById("updateName").value = product.name;
    document.getElementById("updateCategory").value = product.category;
    document.getElementById("updatePrice").value = product.price;
    document.getElementById("updatePurchaseCost").value = product.purchase_cost;
    document.getElementById("updateMrp").value = product.mrp;
    document.getElementById("updateStock").value = product.stock;
    document.getElementById("updateBarcode").value = product.barcode;
    document.getElementById("updateTax").value = product.tax || "5"; // Default tax if not provided
    document.getElementById("updateHSN").value = product.HSN || ""; // Default HSN if not provided

    document.getElementById("updatePopup").style.display = "flex";
}

function closePopup() {
    document.getElementById("updatePopup").style.display = "none";
}


function updateProduct() {
    const updateButton = document.querySelectorAll('button[id="update"]');
    const product = {
        original_product_id: document.getElementById("originalProductId").value,
        product_id: document.getElementById("updateProductId").value,
        name: document.getElementById("updateName").value,
        category: document.getElementById("updateCategory").value,
        price: document.getElementById("updatePrice").value,
        mrp: document.getElementById("updateMrp").value,
        stock: document.getElementById("updateStock").value,
        barcode: document.getElementById("updateBarcode").value,
        purchase_cost: document.getElementById("updatePurchaseCost").value,
        tax: document.getElementById("updateTax").value.trim() || "5", // Default tax if not 
        HSN: document.getElementById("updateHSN").value.trim() || "" // Default HSN if not provided
    };
    // Validation
    if (product.name.length === 0) {
        showToast("Error: Name cannot be empty");
        return;
    }

    if (isNaN(parseFloat(product.price)) || product.price.trim() === "") {
        showToast("Error: Price must be a number");
        return;
    }

    if (isNaN(parseFloat(product.mrp)) || product.mrp.trim() === "") {
        showToast("Error: MRP must be a number");
        return;
    }
    // Barcode validation: Can be empty or an integer
    if (product.barcode.trim() === "" ) {
        showToast("Error: Barcode must be a number or empty");
        return;
    }

    // Stock validation: Can be empty, integer, or float, but not text
    if (product.stock.trim() !== "" && isNaN(parseFloat(product.stock))) {
        showToast("Error: Stock must be a number (integer or float) or empty");
        return;
    }

    // Convert price and MRP to numbers
    product.price = parseFloat(product.price);
    product.mrp = parseFloat(product.mrp);

    fetch(`/api/products/${product.product_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        }, updateButton.disable = true)
        .then(response => {
            updateButton.disable = false;
            if (response.ok) {
                loadProducts(); // Reload products after update
                closePopup();
            } else {
                console.error(response.json());
            }
        });
}

function deleteProduct() {
    const productId = document.getElementById("updateProductId").value;

    fetch(`/api/products/${productId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                loadProducts(); // Reload products after deletion
                closePopup();
            } else {
                console.error('Failed to delete product');
            }
        });
}

function showAddPopup() {
    document.getElementById("addPopup").style.display = "flex";
}

function addProduct() {
    const product = {
        name: document.getElementById("addName").value.trim(),
        category: document.getElementById("addCategory").value.trim(),
        price: document.getElementById("addPrice").value.trim(),
        purchase_cost: document.getElementById("addPurchaseCost").value.trim(),
        mrp: document.getElementById("addMrp").value.trim(),
        stock: document.getElementById("addStock").value.trim(),
        barcode: document.getElementById("addBarcode").value.trim(),
        tax: document.getElementById("addTax").value.trim() || "5", // Default tax if not provided
        HSN: document.getElementById("addHSN").value.trim() || ""
    };

    // Validation
    if (product.name.length === 0) {
        showToast("Error: Name cannot be empty");
        return;
    }

    if (isNaN(parseFloat(product.price)) || product.price.trim() === "") {
        showToast("Error: Price must be a number");
        return;
    }

    if (isNaN(parseFloat(product.mrp)) || product.mrp.trim() === "") {
        showToast("Error: MRP must be a number");
        return;
    }


    // Stock validation: Can be empty, integer, or float, but not text
    if (product.stock.trim() !== "" && isNaN(parseFloat(product.stock))) {
        showToast("Error: Stock must be a number (integer or float) or empty");
        return;
    }

    // Convert price and MRP to numbers
    product.price = parseFloat(product.price);
    product.mrp = parseFloat(product.mrp);

    // Send the product data to the server
    fetch("/api/products", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        })
        .then(response => {
            if (response.ok) {
                loadProducts(); // Reload products after adding
                closePopup();
            } else {
                showToast('Error: Failed to add product');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error: Network or server issue');
        });
}

function closePopup() {
    document.getElementById("addPopup").style.display = "none";
    document.getElementById("updatePopup").style.display = "none";
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape')
        closePopup();
});

document.getElementById('showToast').addEventListener('click', function() {
    showToast('This is an error message!');
});

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000); // Hide the toast after 3 seconds
}