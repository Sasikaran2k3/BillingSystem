document.addEventListener("DOMContentLoaded", function() {
    loadInvoices();
});

function loadInvoices() {
    fetch("/api/invoices")
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById("invoiceTable").getElementsByTagName("tbody")[0];
            tbody.innerHTML = "";
            data.forEach(invoice => {
                const row = tbody.insertRow();
                row.insertCell().textContent = invoice.invoice_id;
                row.insertCell().textContent = invoice.customer_id;
                row.insertCell().textContent = invoice.invoice_date;
                row.insertCell().textContent = invoice.total_amount;
                row.insertCell().textContent = invoice.discount;
                row.insertCell().textContent = invoice.net_total;
                row.insertCell().textContent = invoice.created_at;

                const actionCell = row.insertCell();
                const updateButton = document.createElement("button");
                updateButton.textContent = "Update";
                updateButton.onclick = () => invoicePage(invoice.invoice_id);
                actionCell.appendChild(updateButton);
            });
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;
            // Set the date input value directly with the formatted date string
            document.getElementById("filterInvoiceDate").value = formattedDate;
            document.getElementById("filterInvoiceDate").dispatchEvent(new Event("input"));
        });

}

function applyFilters() {
    const filterInvoiceId = document.getElementById("filterInvoiceId").value.toLowerCase();
    const filterCustomerId = document.getElementById("filterCustomerId").value.toLowerCase();
    const filterInvoiceDate = document.getElementById("filterInvoiceDate").value;
    const filterTotalAmount = document.getElementById("filterTotalAmount").value.toLowerCase();
    const table = document.getElementById("invoiceTable");
    const rows = table.getElementsByTagName("tr");
    // Remove any existing total row if present
    const existingTotalRow = document.getElementById("totalRow");
    if (existingTotalRow) {
        existingTotalRow.remove();
    }

    let netTotalSum = 0; // To store sum of filtered net totals
    console.log("count:" + rows.length);
    for (let i = 1; i < rows.length; i++) {
        let showRow = true;
        const cells = rows[i].getElementsByTagName("td");

        if (filterInvoiceId && !cells[0].textContent.toLowerCase().includes(filterInvoiceId)) {
            showRow = false;
        }
        if (filterCustomerId && !cells[1].textContent.toLowerCase().includes(filterCustomerId)) {
            showRow = false;
        }

        const cellDateStr = cells[6].textContent;
        const cellDate = new Date(cellDateStr).setHours(0, 0, 0, 0);
        const filterDate = new Date(filterInvoiceDate).setHours(0, 0, 0, 0);

        if (filterInvoiceDate && !isNaN(cellDate) && cellDate !== filterDate) {
            showRow = false;
        }
        if (filterTotalAmount && !cells[3].textContent.toLowerCase().includes(filterTotalAmount)) {
            showRow = false;
        }

        rows[i].style.display = showRow ? "" : "none";

        // If row is visible, add its Net Total to sum
        if (showRow) {
            console.log(parseFloat(cells[5].textContent));
            netTotalSum += parseFloat(cells[5].textContent) || 0;
        }
    }
    // Add the total row at the end
    const tbody = table.getElementsByTagName("tbody")[0];
    const totalRow = tbody.insertRow();
    totalRow.id = "totalRow";
    totalRow.insertCell().textContent = ""; // Empty cell for Invoice ID
    totalRow.insertCell().textContent = ""; // Empty cell for Customer ID
    totalRow.insertCell().textContent = ""; // Empty cell for Invoice Date
    totalRow.insertCell().textContent = "Total"; // Label for Total in Total Amount col
    totalRow.insertCell().textContent = ""; // Empty cell for Discount
    totalRow.insertCell().textContent = netTotalSum.toFixed(2); // Sum of Net Total
    totalRow.insertCell().textContent = ""; // Empty cell for Created At

    // Styling for Total row
    totalRow.style.fontWeight = "bold";
}


function invoicePage(invoiceId) {
    window.location.href = `/?query=${encodeURIComponent(invoiceId)}`;
}

function resetFilters() {
    document.getElementById("filterInvoiceId").value = "";
    document.getElementById("filterCustomerId").value = "";
    document.getElementById("filterInvoiceDate").value = "";
    document.getElementById("filterTotalAmount").value = "";
    applyFilters();
}


function deleteInvoice() {
    const invoiceId = document.getElementById("updateInvoiceId").value;

    fetch(`/api/invoices/${invoiceId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                loadInvoices(); // Reload invoices after deletion
                closePopup();
            } else {
                console.error('Failed to delete invoice');
            }
        });
}