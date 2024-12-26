document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadDashboardData();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

async function checkAdminAuth() {
    try {
        const response = await fetch('/api/auth/check-admin', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Admin auth check failed:', error);
        window.location.href = '/login.html';
    }
}

async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        const data = await response.json();
        updateDashboardStats(data.stats);
        displayRecentBookings(data.recent_bookings);
        initializeRevenueChart(data.revenue_trend);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardStats(stats) {
    document.getElementById('totalBookings').textContent = stats.total_bookings;
    document.getElementById('totalRevenue').textContent = `$${stats.total_revenue.toLocaleString()}`;
    document.getElementById('activeHotels').textContent = stats.active_hotels;
    document.getElementById('pendingBookings').textContent = stats.pending_bookings;
}

function displayRecentBookings(bookings) {
    const tbody = document.getElementById('recentBookings');
    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.guest_name}</td>
            <td>${booking.hotel_name}</td>
            <td>${formatDate(booking.check_in)}</td>
            <td>
                <span class="status-badge status-${booking.status.toLowerCase()}">
                    ${booking.status}
                </span>
            </td>
            <td>$${booking.amount.toLocaleString()}</td>
        </tr>
    `).join('');
}

function initializeRevenueChart(data) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Revenue',
                data: data.values,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}
