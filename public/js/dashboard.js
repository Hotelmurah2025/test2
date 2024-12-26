document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserData();
    loadBookings('upcoming');
    setupEventListeners();
});

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('[data-bs-toggle="list"]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            switchTab(target);
        });
    });
    
    // Booking filters
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadBookings(e.target.getAttribute('data-filter'));
        });
    });
    
    // Account form
    document.getElementById('accountForm').addEventListener('submit', handleAccountUpdate);
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
}

function switchTab(target) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('d-none'));
    document.getElementById(`${target}Section`).classList.remove('d-none');
    
    document.querySelectorAll('[data-bs-toggle="list"]').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-target') === target) {
            tab.classList.add('active');
        }
    });
}

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
    }
}

async function loadUserData() {
    try {
        const response = await fetch('/api/user/profile', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user data');
        }
        
        const user = await response.json();
        document.getElementById('userName').textContent = user.full_name;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('fullName').value = user.full_name;
        document.getElementById('email').value = user.email;
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function loadBookings(filter) {
    try {
        const response = await fetch(`/api/user/bookings?status=${filter}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load bookings');
        }
        
        const data = await response.json();
        displayBookings(data.bookings);
        
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

function displayBookings(bookings) {
    const container = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No bookings found.</div>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <h5 class="card-title">${booking.hotel_name}</h5>
                        <p class="card-text mb-1">
                            <strong>Room:</strong> ${booking.room_type}
                        </p>
                        <p class="card-text mb-1">
                            <strong>Check-in:</strong> ${formatDate(booking.check_in)}
                        </p>
                        <p class="card-text mb-1">
                            <strong>Check-out:</strong> ${formatDate(booking.check_out)}
                        </p>
                        <p class="card-text mb-1">
                            <strong>Status:</strong> 
                            <span class="badge bg-${getStatusColor(booking.status)}">
                                ${booking.status}
                            </span>
                        </p>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <p class="card-text">
                            <strong>Total:</strong> $${booking.total_price}
                        </p>
                        ${booking.status === 'confirmed' ? `
                            <a href="/api/user/bookings/${booking.id}/voucher" 
                               class="btn btn-outline-primary btn-sm" target="_blank">
                                Download Voucher
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusColor(status) {
    switch(status) {
        case 'confirmed':
            return 'success';
        case 'pending':
            return 'warning';
        case 'cancelled':
            return 'danger';
        default:
            return 'secondary';
    }
}

async function handleAccountUpdate(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                full_name: fullName,
                current_password: currentPassword,
                new_password: newPassword
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Profile updated successfully');
            loadUserData();
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            alert(data.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        alert('An error occurred while updating your profile');
    }
}

async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}
