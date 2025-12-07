document.addEventListener("DOMContentLoaded", function() {
    // Define all columns in the table
    const columns = [
    { name: 'invoice_id', display: 'Invoice ID', visible: true },
    { name: 'customer_id', display: 'Customer ID', visible: true },
    { name: 'invoice_date', display: 'Invoice Date', visible: true },
    { name: 'total_amount', display: 'Total Amount', visible: true },
    { name: 'discount', display: 'Discount', visible: true },
    { name: 'net_total', display: 'Net Total', visible: true },
    { name: 'mode_of_payment', display: 'Payment Mode', visible: true },
    { name: 'GST', display: 'GST Number', visible: true },
    { name: 'invoice_item_id', display: 'Item ID', visible: true },
    { name: 'product_id', display: 'Product ID', visible: true },
    { name: 'product_name', display: 'Product Name', visible: true },
    { name: 'unit_price', display: 'Unit Price', visible: true },
    { name: 'quantity', display: 'Unit Qty', visible: true },
    { name: 'total_price', display: 'Total Price', visible: true },
    { name: 'profit', display: 'Total Profit', visible: true },
    { name: 'gst_price', display: 'GST Amount', visible: true },
    { name: 'cgst_price', display: 'CGST Amount', visible: true },
    { name: 'sales_ledger', display: 'Sales Ledger', visible: false },
    { name: 'basic_amount', display: 'Basic Amount', visible: false },
    { name: 'tax_type', display: 'Tax Type', visible: false },
    { name: 'subtype', display: 'Subtype', visible: false },
    { name: 'HSN', display: 'HSN Code', visible: false },
    { name: 'tax', display: 'Tax%', visible: false },
    { name: 'customer_name', display: 'Party Name', visible: false },
    { name: 'roundoff', display: 'RoundOff', visible: false },
    { name: 'net_amount', display: 'Net Amount', visible: false },
    { name: 'registration_type', display: 'Registration Type', visible: false },
    { name: 'narration', display: 'Narration', visible: false },
    { name: 'state', display: 'State', visible: false },
];

    const full_data = {};

    // Initialize the table structure
    initializeTable(columns);

    // Create filter controls
    createFilterControls(columns);

    // Load invoices
    loadInvoices(columns);

    // Add event listener for filter inputs
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', function() {
            applyFilters(columns);
        });
    });

    // Add event listener for date range filters
    document.getElementById('filterStartDate').addEventListener('input', function() {
        applyFilters(columns);
    });

    document.getElementById('filterEndDate').addEventListener('input', function() {
        applyFilters(columns);
    });

    // Add event listener for column visibility checkboxes
    document.querySelectorAll('.column-visibility').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const columnIndex = parseInt(this.dataset.columnIndex);
            columns[columnIndex].visible = this.checked;
            updateColumnVisibility(columns);
        });
    });

    // Add event listener for reset button
    document.getElementById('resetFiltersBtn').addEventListener('click', function() {
        resetFilters(columns);
    });
});

function initializeTable(columns) {
    // Get the table element
    const table = document.getElementById('invoiceTable');

    // Clear existing table content
    table.innerHTML = '';

    // Create thead and tbody
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Add them to the table
    table.appendChild(thead);
    table.appendChild(tbody);

    // Create the header row
    updateTableHeader(columns);
}

function createFilterControls(columns) {
    const filterRow = document.getElementById('filterRow') || document.createElement('div');
    filterRow.id = 'filterRow';
    filterRow.className = 'filter-controls';

    // Create column visibility controls
    const visibilityControls = document.createElement('div');
    visibilityControls.className = 'visibility-controls';
    visibilityControls.innerHTML = '<h4>Column Visibility</h4>';

    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';

    columns.forEach((column, index) => {
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'checkbox-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'column-visibility';
        checkbox.dataset.columnIndex = index;
        checkbox.checked = column.visible;

        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(` ${column.display}`));
        checkboxContainer.appendChild(checkboxLabel);
    });

    visibilityControls.appendChild(checkboxContainer);

    // Create filter inputs
    const filterInputs = document.createElement('div');
    filterInputs.className = 'filter-inputs';
    filterInputs.innerHTML = '<h4>Filter by:</h4>';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';

    // Create date range filters separately
    const dateRangeGroup = document.createElement('div');
    dateRangeGroup.className = 'date-range-group';

    const dateRangeLabel = document.createElement('label');
    dateRangeLabel.textContent = 'Invoice Date Range:';
    dateRangeGroup.appendChild(dateRangeLabel);

    const dateRangeContainer = document.createElement('div');
    dateRangeContainer.className = 'date-range-container';

    // Start date input
    const startDateLabel = document.createElement('label');
    startDateLabel.textContent = 'From:';
    startDateLabel.className = 'date-range-label';

    const startDateInput = document.createElement('input');
    startDateInput.type = 'date';
    startDateInput.id = 'filterStartDate';
    startDateInput.className = 'filter-input date-input';

    // End date input
    const endDateLabel = document.createElement('label');
    endDateLabel.textContent = 'To:';
    endDateLabel.className = 'date-range-label';

    const endDateInput = document.createElement('input');
    endDateInput.type = 'date';
    endDateInput.id = 'filterEndDate';
    endDateInput.className = 'filter-input date-input';

    dateRangeContainer.appendChild(startDateLabel);
    dateRangeContainer.appendChild(startDateInput);
    dateRangeContainer.appendChild(endDateLabel);
    dateRangeContainer.appendChild(endDateInput);

    dateRangeGroup.appendChild(dateRangeContainer);
    inputContainer.appendChild(dateRangeGroup);

    // Add other filter inputs (except invoice_date which is now handled by the date range)
    columns.forEach((column, index) => {

        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group';

        const label = document.createElement('label');
        label.textContent = column.display;

        const input = document.createElement('input');
        input.type = column.name === 'created_at' ? 'date' : 'text';
        input.id = `filter${column.name.charAt(0).toUpperCase() + column.name.slice(1)}`;
        input.className = 'filter-input';
        input.dataset.columnIndex = index;

        filterGroup.appendChild(label);
        filterGroup.appendChild(input);
        inputContainer.appendChild(filterGroup);
    });

    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.id = 'resetFiltersBtn';
    resetButton.textContent = 'Reset Filters';
    resetButton.className = 'reset-button';
    inputContainer.appendChild(resetButton);

    filterInputs.appendChild(inputContainer);

    filterRow.innerHTML = '';
    filterRow.appendChild(visibilityControls);
    filterRow.appendChild(filterInputs);

    // Insert filter controls before the table
    const table = document.getElementById('invoiceTable');
    table.parentNode.insertBefore(filterRow, table);
}

function updateTableHeader(columns) {
    const thead = document.getElementById('invoiceTable').getElementsByTagName('thead')[0];
    thead.innerHTML = '';

    const headerRow = thead.insertRow();

    columns.forEach(column => {
        if (column.visible) {
            const th = document.createElement('th');
            th.textContent = column.display;
            headerRow.appendChild(th);
        }
    });
}

function loadInvoices(columns) {
    
    fetch("/api/fulldata")
        .then(response => response.json())
        .then(data => {
            full_data = data;
            const tbody = document.getElementById("invoiceTable").getElementsByTagName("tbody")[0];
            tbody.innerHTML = "";
            console.log("Loaded Invoices:", data);
            data.forEach(invoice => {
                // Set additional fields based on conditions
                
                // 1. Sales Ledger based on customer name
                if (invoice.customer_name && invoice.customer_name.toLowerCase() === 'cash') {
                    invoice.sales_ledger = 'POS-Sale';
                } else {
                    invoice.sales_ledger = 'GST-Sale';
                }
                
                // 2. Tax Type - always GST
                invoice.tax_type = 'GST';
                
                // 3. Subtype - always CGST/SGST
                invoice.subtype = 'CGST/SGST';
                
                // 4. Registration Type based on GST number availability
                if (invoice.gst_number && invoice.gst_number.trim() !== '') {
                    invoice.registration_type = 'Regular';
                } else {
                    invoice.registration_type = 'Unregistered/Consumer';
                }
                
                // 5. Narration same as invoice_id
                invoice.narration = invoice.invoice_id;
                
                // 6. State always Tamilnadu
                invoice.state = 'Tamilnadu';

                // 7. Basic Amount - Total / 1 + Tax / 100
                invoice.basic_amount = (invoice.total_price / (1 + (invoice.tax || 5) / 100)).toFixed(2) * 1;

                // 8. RoundOff - Sum of gst + cgst + basic_amount - net_total
                invoice.roundoff = (parseFloat(invoice.gst_price || 0).toFixed(2) * 1 + 
                                   parseFloat(invoice.cgst_price || 0).toFixed(2) * 1 + 
                                   parseFloat(invoice.basic_amount || 0) - 
                                   parseFloat(invoice.total_price || 0)).toFixed(2);

                const row = tbody.insertRow();

                // Add cells based on column visibility
                columns.forEach(column => {
                    if (column.visible) {
                        const cell = row.insertCell();
                        cell.textContent = invoice[column.name] || '';
                    }
                });
            });

            // Set today's date in date filters
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // Set default date range to last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const startYear = thirtyDaysAgo.getFullYear();
            const startMonth = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0');
            const startDay = String(thirtyDaysAgo.getDate()).padStart(2, '0');
            const formattedStartDate = `${startYear}-${startMonth}-${startDay}`;

            const startDateFilter = document.getElementById("filterStartDate");
            const endDateFilter = document.getElementById("filterEndDate");

            if (startDateFilter && endDateFilter) {
                startDateFilter.value = formattedStartDate;
                endDateFilter.value = formattedDate;
                // Trigger filters
                startDateFilter.dispatchEvent(new Event("input"));
                endDateFilter.dispatchEvent(new Event("input"));
            }
            // Apply initial filters
            applyFilters(columns);
        })
        .catch(error => {
            console.error("Error loading invoices:", error);
        });
}

function applyFilters(columns) {
    // Get all filter values
    const filterValues = [];
    document.querySelectorAll('.filter-input').forEach(input => {
        if (input.id !== 'filterStartDate' && input.id !== 'filterEndDate') {
            const columnIndex = parseInt(input.dataset.columnIndex);
            if (!isNaN(columnIndex)) {
                filterValues[columnIndex] = input.value.toLowerCase();
            }
        }
    });

    // Get date range values
    const startDateElement = document.getElementById('filterStartDate');
    const endDateElement = document.getElementById('filterEndDate');
    const startDate = startDateElement ? startDateElement.value : '';
    const endDate = endDateElement ? endDateElement.value : '';

    const table = document.getElementById("invoiceTable");
    const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");

    // Remove any existing total row
    const existingTotalRow = document.getElementById("totalRow");
    if (existingTotalRow) {
        existingTotalRow.remove();
    }

    let netTotalSum = 0;
    let qty = 0;
    let profit = 0;
    let visibleRowCount = 0;

    // Check each row against filters
    for (let i = 0; i < rows.length; i++) {
        let showRow = true;
        const cells = rows[i].getElementsByTagName("td");
        const cellsData = {};

        // Map cell data to column names for easier filtering
        let visibleColIndex = 0;
        for (let j = 0; j < columns.length; j++) {
            if (columns[j].visible) {
                if (visibleColIndex < cells.length) {
                    cellsData[columns[j].name] = cells[visibleColIndex].textContent;
                }
                visibleColIndex++;
            }
        }

        // Apply filters
        for (let j = 0; j < columns.length; j++) {
            // Special handling for invoice_date (date range)
            if (columns[j].name === 'invoice_date') {
                const cellDateStr = cellsData[columns[j].name];
                try {
                    // Custom parsing: 13/04/2025 - 14:42:02 => DD/MM/YYYY
                    const datePart = cellDateStr.split(' - ')[0]; // Get '13/04/2025'
                    const [day, month, year] = datePart.split('/').map(Number);
                    const cellDate = new Date(year, month - 1, day).setHours(0, 0, 0, 0);

                    // Check if cell date is within range
                    if (startDate && endDate) {
                        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

                        const startFilterDate = new Date(startYear, startMonth - 1, startDay).setHours(0, 0, 0, 0);
                        const endFilterDate = new Date(endYear, endMonth - 1, endDay).setHours(0, 0, 0, 0);

                        if (!isNaN(startFilterDate) && !isNaN(endFilterDate) &&
                            (cellDate < startFilterDate || cellDate > endFilterDate)) {
                            showRow = false;
                        }
                    } else if (startDate) {
                        const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
                        const startFilterDate = new Date(startYear, startMonth - 1, startDay).setHours(0, 0, 0, 0);

                        if (!isNaN(startFilterDate) && cellDate < startFilterDate) {
                            showRow = false;
                        }
                    } else if (endDate) {
                        const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
                        const endFilterDate = new Date(endYear, endMonth - 1, endDay).setHours(0, 0, 0, 0);

                        if (!isNaN(endFilterDate) && cellDate > endFilterDate) {
                            showRow = false;
                        }
                    }
                } catch (e) {
                    console.warn("Date parsing failed for:", cellDateStr);
                }
                continue;
            }


            // Handle created_at date filter specially
            if (columns[j].name === 'created_at' && filterValues[j]) {
                const cellDateStr = cellsData[columns[j].name];
                try {
                    const cellDate = new Date(cellDateStr).setHours(0, 0, 0, 0);
                    const filterDate = new Date(filterValues[j]).setHours(0, 0, 0, 0);

                    if (!isNaN(filterDate) && cellDate !== filterDate) {
                        showRow = false;
                    }
                } catch (e) {
                    if (!cellsData[columns[j].name] || !cellsData[columns[j].name].toLowerCase().includes(filterValues[j])) {
                        showRow = false;
                    }
                }
            }
            // Normal text filter
            else if (filterValues[j] && (!cellsData[columns[j].name] || !cellsData[columns[j].name].toLowerCase().includes(filterValues[j]))) {
                showRow = false;
            }
        }

        rows[i].style.display = showRow ? "" : "none";

        // Calculate total for visible rows
        if (showRow) {
            visibleRowCount++;
            // Variable to find bottom Total Calc
            const netTotal = parseFloat(cellsData['total_price']) || 0;
            const netQty = parseFloat(cellsData['quantity']) || 0;
            const netProfit = parseFloat(cellsData['profit']) || 0;
            qty += netQty;
            netTotalSum += netTotal;
            profit += netProfit;
        }
    }

    // Add total row if we have visible rows
    if (visibleRowCount > 0) {
        const tbody = table.getElementsByTagName("tbody")[0];
        const totalRow = tbody.insertRow();
        totalRow.id = "totalRow";

        let visibleColumnCount = 0;
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].visible) {
                const cell = totalRow.insertCell();
                // Bottom Total in the Table
                if (columns[i].name === 'total_price') {
                    cell.textContent = "Total: " + netTotalSum.toFixed(2);
                    cell.style.fontWeight = "bold";
                } else if (columns[i].name === 'quantity') {
                    cell.textContent = "Qty: " + qty.toFixed(2);
                    cell.style.fontWeight = "bold";
                } else if (columns[i].name === 'profit') {
                    cell.textContent = "Profit: " + profit.toFixed(2);
                    cell.style.fontWeight = "bold";
                } else {
                    cell.textContent = "";
                }
                visibleColumnCount++;
            }
        }

        // Styling for total row
        totalRow.style.fontWeight = "bold";
        totalRow.style.backgroundColor = "#f5f5f5";
    }
}

function updateColumnVisibility(columns) {
    // Update table header
    updateTableHeader(columns);

    const table = document.getElementById("invoiceTable");
    const tbody = table.getElementsByTagName("tbody")[0];
    const rows = tbody.getElementsByTagName("tr");

    // Step 2: Clear tbody
    const totalRow = document.getElementById("totalRow");
    if (totalRow) totalRow.remove();
    tbody.innerHTML = "";

    // Step 3: Rebuild rows
    full_data.forEach(rowData => {
        const row = tbody.insertRow();
        columns.forEach(col => {
            if (col.visible) {
                const cell = row.insertCell();
                cell.textContent = rowData[col.name] || "";
            }
        });
    });

    // Step 4: Re-add total row
    if (totalRow) {
        tbody.appendChild(totalRow);
    }

    // Step 5: Re-apply filters
    applyFilters(columns);
}


function resetFilters(columns) {
    // Reset text filters
    document.querySelectorAll('.filter-input').forEach(input => {
        if (input.id !== 'filterStartDate' && input.id !== 'filterEndDate') {
            input.value = "";
        }
    });

    // Reset date range filters
    document.getElementById('filterStartDate').value = "";
    document.getElementById('filterEndDate').value = "";

    // Reset column visibility to default
    document.querySelectorAll('.column-visibility').forEach((checkbox, index) => {
        checkbox.checked = true;
        columns[parseInt(checkbox.dataset.columnIndex)].visible = true;
    });

    updateColumnVisibility(columns);
}

function invoicePage(invoiceId) {
    window.location.href = `/?query=${encodeURIComponent(invoiceId)}`;
}