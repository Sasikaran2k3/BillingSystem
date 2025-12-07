document.addEventListener("DOMContentLoaded", function() {
    loadMessages();
});

function loadMessages() {
    fetch("/api/messages")
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById("messageTable").getElementsByTagName("tbody")[0];
            tbody.innerHTML = "";
            data.forEach(message => {
                const row = tbody.insertRow();
                row.insertCell().textContent = message.id;
                row.insertCell().textContent = message.event;
                row.insertCell().textContent = message.message;
                const actionCell = row.insertCell();
                const statusCell = row.insertCell();
                const updateButton = document.createElement("button");
                const activateButton = document.createElement("button");
                updateButton.textContent = "Update";
                activateButton.textContent = message.status.charAt(0).toUpperCase() + message.status.slice(1);
                if (message.status === "inactive") {
                    activateButton.style.backgroundColor = "red";
                    activateButton.style.color = "white"; // Optional: Make text color white for better contrast
                }
                activateButton.onclick = () => activation(message);
                updateButton.onclick = () => showPopup(message);
                actionCell.appendChild(updateButton);
                statusCell.appendChild(activateButton);
            });
        });
}

function activation(message) {
    const newStatus = message.status === "active" ? "inactive" : "active";
    fetch(`/api/messages/activate/${message.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(response => {
            if (response.ok) {
                loadMessages(); // Reload messages after updating the status
            } else {
                console.error('Failed to update message status');
            }
        });
}


function applyFilters() {
    const filterMessageId = document.getElementById("filterMessageId").value.toLowerCase();
    const filterEvent = document.getElementById("filterEvent").value.toLowerCase();
    const filterMessage = document.getElementById("filterMessage").value.toLowerCase();
    const table = document.getElementById("messageTable");
    const rows = table.getElementsByTagName("tr");
    for (let i = 1; i < rows.length; i++) {
        let showRow = true;
        const cells = rows[i].getElementsByTagName("td");

        if (filterMessageId && !cells[0].textContent.toLowerCase().includes(filterMessageId)) {
            showRow = false;
        }
        if (filterEvent && !cells[1].textContent.toLowerCase().includes(filterEvent)) {
            showRow = false;
        }
        if (filterMessage && !cells[2].textContent.toLowerCase().includes(filterMessage)) {
            showRow = false;
        }

        rows[i].style.display = showRow ? "" : "none";
    }
}

function resetFilters() {
    document.getElementById("filterMessageId").value = "";
    document.getElementById("filterEvent").value = "";
    document.getElementById("filterMessage").value = "";
    applyFilters();
}

function showPopup(message) {
    document.getElementById("updateMessageId").value = message.id;
    document.getElementById("updateEvent").value = message.event;
    document.getElementById("updateMessage").value = message.message;

    document.getElementById("updatePopup").style.display = "flex";
}


function updatemessage() {
    const message = {
        id: document.getElementById("updateMessageId").value,
        event: document.getElementById("updateEvent").value,
        message: document.getElementById("updateMessage").value,
    };

    fetch(`/api/messages/${message.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        })
        .then(response => {
            if (response.ok) {
                loadMessages(); // Reload messages after update
                closePopup();
            } else {
                console.error('Failed to update message');
            }
        });
}

function deletemessage() {
    const messageId = document.getElementById("updateMessageId").value;

    fetch(`/api/messages/${messageId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                loadMessages(); // Reload messages after deletion
                closePopup();
            } else {
                console.error('Failed to delete message');
            }
        });
}

function showAddPopup() {
    document.getElementById("addPopup").style.display = "flex";
}

function addmessage() {
    const message = {
        event: document.getElementById("addEvent").value,
        message: document.getElementById("addMessage").value
    };

    if (message.event.length === 0) {
        showToast("Error: Event cannot be empty");
        return;
    }
    if (message.message.length === 0) {
        showToast("Error: Message cannot be empty");
        return;
    }

    fetch("/api/messages", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        })
        .then(response => {
            if (response.ok) {
                loadMessages(); // Reload messages after adding
                closePopup();
            } else {
                console.error('Failed to add message');
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