document.addEventListener("DOMContentLoaded", function() {
    loadCustomers();
});

function loadCustomers() {
    fetch("/api/customers")
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById("customerTable").getElementsByTagName("tbody")[0];
            tbody.innerHTML = "";
            data.forEach(customer => {
                const row = tbody.insertRow();
                row.insertCell().textContent = customer.id;
                row.insertCell().textContent = customer.name;
                row.insertCell().textContent = customer.phone;
                row.insertCell().textContent = customer.address;
                row.insertCell().textContent = customer.created_at;
                const actionCell = row.insertCell();
                const updateButton = document.createElement("button");
                updateButton.textContent = "Update";
                updateButton.onclick = () => showPopup(customer);
                actionCell.appendChild(updateButton);
            });
        });
}

function applyFilters() {
    const filterCustomerId = document.getElementById("filterCustomerId").value.toLowerCase();
    const filterName = document.getElementById("filterName").value.toLowerCase();
    const filterPhone = document.getElementById("filterPhone").value.toLowerCase();
    const filterAddress = document.getElementById("filterAddress").value.toLowerCase();
    const table = document.getElementById("customerTable");
    const rows = table.getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        let showRow = true;
        const cells = rows[i].getElementsByTagName("td");

        if (filterCustomerId && !cells[0].textContent.toLowerCase().includes(filterCustomerId)) {
            showRow = false;
        }
        if (filterName && !cells[1].textContent.toLowerCase().includes(filterName)) {
            showRow = false;
        }
        if (filterPhone && !cells[2].textContent.toLowerCase().includes(filterPhone)) {
            showRow = false;
        }
        if (filterAddress && !cells[3].textContent.toLowerCase().includes(filterAddress)) {
            showRow = false;
        }

        rows[i].style.display = showRow ? "" : "none";
    }
}

function resetFilters() {
    document.getElementById("filterCustomerId").value = "";
    document.getElementById("filterName").value = "";
    document.getElementById("filterPhone").value = "";
    document.getElementById("filterAddress").value = "";
    applyFilters();
}

function showPopup(customer) {
    document.getElementById("updateCustomerId").value = customer.id;
    document.getElementById("updateName").value = customer.name;
    document.getElementById("updatePhone").value = customer.phone;
    document.getElementById("updateAddress").value = customer.address;

    document.getElementById("updatePopup").style.display = "flex";
}

function closePopup() {
    document.getElementById("updatePopup").style.display = "none";
}

function updateCustomer() {
    const customer = {
        id: document.getElementById("updateCustomerId").value,
        name: document.getElementById("updateName").value,
        phone: document.getElementById("updatePhone").value,
        address: document.getElementById("updateAddress").value,
    };
    if (customer.name.length === 0) {
        showToast("Error: Name cannot be empty");
        return;
    }
    fetch(`/api/customers/${customer.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customer)
        })
        .then(response => {
            if (response.ok) {
                loadCustomers(); // Reload customers after update
                closePopup();
            } else {
                console.error('Failed to update customer');
            }
        });
}

function deleteCustomer() {
    const customerId = document.getElementById("updateCustomerId").value;

    fetch(`/api/customers/${customerId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                loadCustomers(); // Reload customers after deletion
                closePopup();
            } else {
                console.error('Failed to delete customer');
            }
        });
}

function showAddPopup() {
    document.getElementById("addPopup").style.display = "flex";
}

function addCustomer() {
    const customer = {
        name: document.getElementById("addName").value,
        phone: document.getElementById("addPhone").value,
        address: document.getElementById("addAddress").value,
    };
    if (customer.name.length === 0) {
        showToast("Error: Name cannot be empty");
        return;
    }
    fetch("/api/customers", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customer)
        })
        .then(response => {
            if (response.ok) {
                loadCustomers(); // Reload customers after adding
                closePopup();
            } else {
                console.error('Failed to add customer');
            }
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

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = toast.querySelector('.toast-message');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(function() {
        toast.classList.remove('show');
    }, 3000); // Hide the toast after 3 seconds
}