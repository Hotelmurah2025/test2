// Get booking details from URL
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('booking_id');

document.addEventListener('DOMContentLoaded', () => {
    loadBookingDetails();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('bookingForm').addEventListener('submit', handleProceedToPayment);
}

async function loadBookingDetails() {
    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load booking details');
        }
        
        const booking = await response.json();
        displayBookingDetails(booking);
        
    } catch (error) {
        console.error('Error loading booking details:', error);
        alert('Failed to load booking details');
    }
}

function displayBookingDetails(booking) {
    const detailsContainer = document.getElementById('bookingDetails');
    detailsContainer.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-6">
                <h5>Hotel Information</h5>
                <p class="mb-1"><strong>${booking.hotel_name}</strong></p>
                <p class="mb-1">${booking.location}</p>
                <p class="mb-3">Room Type: ${booking.room_type}</p>
            </div>
            <div class="col-md-6">
                <h5>Stay Details</h5>
                <p class="mb-1">Check-in: ${formatDate(booking.check_in)}</p>
                <p class="mb-1">Check-out: ${formatDate(booking.check_out)}</p>
                <p class="mb-1">Guests: ${booking.guests}</p>
            </div>
        </div>
    `;
    
    // Update price summary
    document.getElementById('roomRate').textContent = `$${(booking.total_price * 0.9).toFixed(2)}`;
    document.getElementById('taxesFees').textContent = `$${(booking.total_price * 0.1).toFixed(2)}`;
    document.getElementById('totalPrice').textContent = `$${booking.total_price.toFixed(2)}`;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function handleProceedToPayment(e) {
    e.preventDefault();
    
    const specialRequests = document.getElementById('specialRequests').value;
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                special_requests: specialRequests
            }),
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to update booking');
        }
        
        // Redirect to payment page
        window.location.href = `/payment.html?booking_id=${bookingId}`;
        
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Failed to proceed to payment');
    }
}
