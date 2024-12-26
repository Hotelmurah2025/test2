// Get hotel ID from URL
const urlParams = new URLSearchParams(window.location.search);
const hotelId = urlParams.get('id');

// Initialize date pickers
document.addEventListener('DOMContentLoaded', () => {
    initializeDatePickers();
    loadHotelDetails();
    setupEventListeners();
});

function initializeDatePickers() {
    flatpickr('.datepicker', {
        minDate: 'today',
        dateFormat: 'Y-m-d'
    });
}

function setupEventListeners() {
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('roomType').addEventListener('change', updatePriceSummary);
}

async function loadHotelDetails() {
    try {
        const response = await fetch(`/api/hotels/${hotelId}`);
        const hotel = await response.json();
        
        if (!response.ok) {
            throw new Error(hotel.error || 'Failed to load hotel details');
        }
        
        displayHotelDetails(hotel);
        populateRoomTypes(hotel.rooms);
        
    } catch (error) {
        console.error('Error loading hotel details:', error);
        alert('Failed to load hotel details');
    }
}

function displayHotelDetails(hotel) {
    // Set hotel name and location
    document.getElementById('hotelName').textContent = hotel.name;
    document.getElementById('hotelLocation').textContent = hotel.location;
    
    // Set rating
    document.getElementById('hotelRating').innerHTML = createRatingStars(hotel.rating);
    
    // Set description
    document.getElementById('hotelDescription').textContent = hotel.description;
    
    // Set facilities
    const facilitiesContainer = document.getElementById('hotelFacilities');
    facilitiesContainer.innerHTML = hotel.facilities.map(facility => `
        <div class="col-md-4 mb-2">
            <div class="d-flex align-items-center">
                <i class="fas fa-check text-success me-2"></i>
                <span>${facility}</span>
            </div>
        </div>
    `).join('');
    
    // Set images in carousel
    const imagesContainer = document.getElementById('hotelImages');
    imagesContainer.innerHTML = hotel.images.map((image, index) => `
        <div class="carousel-item ${index === 0 ? 'active' : ''}">
            <img src="${image}" class="d-block w-100" alt="Hotel Image ${index + 1}">
        </div>
    `).join('');
    
    // Set reviews
    const reviewsContainer = document.getElementById('hotelReviews');
    reviewsContainer.innerHTML = hotel.reviews.map(review => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between mb-2">
                    <div>
                        <h6 class="mb-0">${review.user_name}</h6>
                        <div class="rating">${createRatingStars(review.rating)}</div>
                    </div>
                    <small class="text-muted">${new Date(review.created_at).toLocaleDateString()}</small>
                </div>
                <p class="card-text">${review.comment}</p>
            </div>
        </div>
    `).join('');
}

function populateRoomTypes(rooms) {
    const roomTypeSelect = document.getElementById('roomType');
    roomTypeSelect.innerHTML = '<option value="">Select a room type</option>' +
        rooms.map(room => `
            <option value="${room.id}" data-price="${room.price}">
                ${room.room_type} - $${room.price}/night
            </option>
        `).join('');
}

function updatePriceSummary() {
    const roomTypeSelect = document.getElementById('roomType');
    const selectedOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
    
    if (selectedOption.value) {
        const roomPrice = parseFloat(selectedOption.dataset.price);
        const checkIn = new Date(document.getElementById('checkInDate').value);
        const checkOut = new Date(document.getElementById('checkOutDate').value);
        
        if (!isNaN(checkIn) && !isNaN(checkOut)) {
            const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
            const subtotal = roomPrice * nights;
            const taxes = subtotal * 0.1; // 10% tax
            const total = subtotal + taxes;
            
            document.getElementById('roomRate').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('taxesFees').textContent = `$${taxes.toFixed(2)}`;
            document.getElementById('totalPrice').textContent = `$${total.toFixed(2)}`;
        }
    }
}

async function handleBooking(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const response = await fetch('/api/auth/check');
    if (!response.ok) {
        window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.href)}`;
        return;
    }
    
    const formData = {
        hotel_id: hotelId,
        room_id: document.getElementById('roomType').value,
        check_in: document.getElementById('checkInDate').value,
        check_out: document.getElementById('checkOutDate').value,
        guests: document.getElementById('guests').value,
        total_price: parseFloat(document.getElementById('totalPrice').textContent.replace('$', ''))
    };
    
    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            window.location.href = `/payment.html?booking_id=${data.booking_id}`;
        } else {
            alert(data.error || 'Booking failed');
        }
    } catch (error) {
        console.error('Booking error:', error);
        alert('An error occurred while processing your booking');
    }
}

function createRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}
