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
                row.insertCell().textContent = product.product_id;
                row.insertCell().textContent = product.name;
                row.insertCell().textContent = product.category;
                row.insertCell().textContent = product.price;
                row.insertCell().textContent = product.stock;
                row.insertCell().textContent = product.barcode || "N/A";

                const actionCell = row.insertCell();
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

        if (filterBarcode && !cells[5].textContent.toLowerCase().startsWith(filterBarcode)) {
            showRow = false;
        }
        if (filterCode && !cells[0].textContent.toLowerCase().startsWith(filterCode)) {
            showRow = false;
        }
        if (filterName && !cells[1].textContent.toLowerCase().startsWith(filterName)) {
            showRow = false;
        }
        if (filterCategory && !cells[2].textContent.toLowerCase().startsWith(filterCategory)) {
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
    document.getElementById("updateProductId").value = product.product_id;
    document.getElementById("updateName").value = product.name;
    document.getElementById("updateCategory").value = product.category;
    document.getElementById("updatePrice").value = product.price;
    document.getElementById("updateStock").value = product.stock;
    document.getElementById("updateBarcode").value = product.barcode;
    
    document.getElementById("updatePopup").style.display = "flex";
}

function closePopup() {
    document.getElementById("updatePopup").style.display = "none";
}

function updateProduct() {
    const product = {
        product_id: document.getElementById("updateProductId").value,
        name: document.getElementById("updateName").value,
        category: document.getElementById("updateCategory").value,
        price: document.getElementById("updatePrice").value,
        stock: document.getElementById("updateStock").value,
        barcode: document.getElementById("updateBarcode").value
    };

    fetch(`/api/products/${product.product_id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
    })
    .then(response => {
        if (response.ok) {
            loadProducts(); // Reload products after update
            closePopup();
        } else {
            console.error('Failed to update product');
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
        name: document.getElementById("addName").value,
        category: document.getElementById("addCategory").value,
        price: document.getElementById("addPrice").value,
        stock: document.getElementById("addStock").value,
        barcode: document.getElementById("addBarcode").value
    };

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
            console.error('Failed to add product');
        }
    });
}

function closePopup() {
    document.getElementById("addPopup").style.display = "none";
    document.getElementById("updatePopup").style.display = "none";
}

