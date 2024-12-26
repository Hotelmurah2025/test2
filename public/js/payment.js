// Get booking ID from URL
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('booking_id');

document.addEventListener('DOMContentLoaded', () => {
    loadBookingDetails();
    setupEventListeners();
    setupPaymentMethodToggle();
});

function setupEventListeners() {
    document.getElementById('paymentForm').addEventListener('submit', handlePayment);
    
    // Card number formatting
    document.getElementById('cardNumber').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(.{4})/g, '$1 ').trim();
        e.target.value = value;
    });
    
    // Expiry date formatting
    document.getElementById('expiryDate').addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });
}

function setupPaymentMethodToggle() {
    const paymentMethods = document.getElementsByName('paymentMethod');
    const creditCardForm = document.getElementById('creditCardForm');
    const ovoForm = document.getElementById('ovoForm');
    const bankTransferForm = document.getElementById('bankTransferForm');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            creditCardForm.classList.add('d-none');
            ovoForm.classList.add('d-none');
            bankTransferForm.classList.add('d-none');
            
            switch(this.value) {
                case 'credit_card':
                    creditCardForm.classList.remove('d-none');
                    break;
                case 'ovo':
                    ovoForm.classList.remove('d-none');
                    break;
                case 'bank_transfer':
                    bankTransferForm.classList.remove('d-none');
                    break;
            }
        });
    });
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
        displayBookingSummary(booking);
        
    } catch (error) {
        console.error('Error loading booking details:', error);
        alert('Failed to load booking details');
    }
}

function displayBookingSummary(booking) {
    const summaryContainer = document.getElementById('bookingSummary');
    summaryContainer.innerHTML = `
        <div class="mb-3">
            <h6>${booking.hotel_name}</h6>
            <p class="mb-1">${booking.room_type}</p>
            <p class="mb-1">Check-in: ${formatDate(booking.check_in)}</p>
            <p class="mb-1">Check-out: ${formatDate(booking.check_out)}</p>
            <p class="mb-1">Guests: ${booking.guests}</p>
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

async function handlePayment(e) {
    e.preventDefault();
    
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    let paymentDetails = {};
    
    switch(paymentMethod) {
        case 'credit_card':
            paymentDetails = {
                card_number: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expiry_date: document.getElementById('expiryDate').value,
                cvv: document.getElementById('cvv').value,
                card_name: document.getElementById('cardName').value
            };
            break;
        case 'ovo':
            paymentDetails = {
                ovo_number: document.getElementById('ovoNumber').value
            };
            break;
        case 'bank_transfer':
            paymentDetails = {
                transfer_reference: generateTransferReference()
            };
            break;
    }
    
    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                booking_id: bookingId,
                payment_method: paymentMethod,
                payment_details: paymentDetails,
                amount: parseFloat(document.getElementById('totalPrice').textContent.replace('$', ''))
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = `/confirmation.html?booking_id=${bookingId}&transaction_id=${data.transaction_id}`;
        } else {
            alert(data.error || 'Payment failed');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('An error occurred during payment processing');
    }
}

function generateTransferReference() {
    return 'TRF' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}
