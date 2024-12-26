document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    loadHotels();
    setupEventListeners();
    initializeFacilities();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('hotelForm').addEventListener('submit', handleHotelSubmit);
    document.getElementById('addRoomType').addEventListener('click', addRoomTypeForm);
    document.getElementById('saveHotel').addEventListener('click', () => {
        document.getElementById('hotelForm').dispatchEvent(new Event('submit'));
    });
    document.getElementById('confirmDelete').addEventListener('click', handleDeleteHotel);
}

function initializeFacilities() {
    const facilities = [
        'WiFi', 'Parking', 'Pool', 'Gym', 'Restaurant', 'Bar',
        'Room Service', 'Spa', 'Beach Access', 'Airport Shuttle',
        'Business Center', 'Conference Room'
    ];
    
    const container = document.getElementById('facilitiesList');
    container.innerHTML = facilities.map(facility => `
        <div class="col-md-4">
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${facility.toLowerCase()}" 
                       id="${facility.toLowerCase()}">
                <label class="form-check-label" for="${facility.toLowerCase()}">
                    ${facility}
                </label>
            </div>
        </div>
    `).join('');
}

async function loadHotels() {
    try {
        const response = await fetch('/api/admin/hotels', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load hotels');
        }
        
        const hotels = await response.json();
        displayHotels(hotels);
        
    } catch (error) {
        console.error('Error loading hotels:', error);
        alert('Failed to load hotels');
    }
}

function displayHotels(hotels) {
    const tbody = document.getElementById('hotelsList');
    tbody.innerHTML = hotels.map(hotel => `
        <tr>
            <td>${hotel.id}</td>
            <td>
                <img src="${hotel.thumbnail || '/images/default-hotel.jpg'}" 
                     alt="${hotel.name}" class="hotel-image-preview">
            </td>
            <td>${hotel.name}</td>
            <td>${hotel.location}</td>
            <td>${hotel.room_count}</td>
            <td>${createRatingStars(hotel.rating)}</td>
            <td>
                <span class="badge ${hotel.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                    ${hotel.status}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="editHotel(${hotel.id})">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="showDeleteModal(${hotel.id})">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function createRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-warning"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-warning"></i>';
    }
    
    return stars;
}

function addRoomTypeForm() {
    const roomTypes = document.getElementById('roomTypes');
    const roomTypeId = Date.now();
    
    const roomTypeHtml = `
        <div class="room-type-form mb-3" data-id="${roomTypeId}">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h6 class="mb-0">Room Type</h6>
                        <button type="button" class="btn btn-sm btn-outline-danger"
                                onclick="removeRoomType(${roomTypeId})">
                            Remove
                        </button>
                    </div>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Room Type Name</label>
                            <input type="text" class="form-control" name="room_type_name" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Price per Night</label>
                            <input type="number" class="form-control" name="price" min="0" step="0.01" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Max Occupancy</label>
                            <input type="number" class="form-control" name="max_occupancy" min="1" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Number of Rooms</label>
                            <input type="number" class="form-control" name="room_count" min="1" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Room Facilities</label>
                            <textarea class="form-control" name="facilities" rows="2" required></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    roomTypes.insertAdjacentHTML('beforeend', roomTypeHtml);
}

function removeRoomType(id) {
    document.querySelector(`.room-type-form[data-id="${id}"]`).remove();
}

async function handleHotelSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('hotelName').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('description', document.getElementById('description').value);
    
    // Add facilities
    const facilities = [];
    document.querySelectorAll('#facilitiesList input:checked').forEach(checkbox => {
        facilities.push(checkbox.value);
    });
    formData.append('facilities', JSON.stringify(facilities));
    
    // Add images
    const images = document.getElementById('images').files;
    for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
    }
    
    // Add room types
    const roomTypes = [];
    document.querySelectorAll('.room-type-form').forEach(form => {
        roomTypes.push({
            name: form.querySelector('[name="room_type_name"]').value,
            price: parseFloat(form.querySelector('[name="price"]').value),
            max_occupancy: parseInt(form.querySelector('[name="max_occupancy"]').value),
            room_count: parseInt(form.querySelector('[name="room_count"]').value),
            facilities: form.querySelector('[name="facilities"]').value
        });
    });
    formData.append('room_types', JSON.stringify(roomTypes));
    
    const hotelId = document.getElementById('hotelId').value;
    const method = hotelId ? 'PUT' : 'POST';
    const url = hotelId ? `/api/admin/hotels/${hotelId}` : '/api/admin/hotels';
    
    try {
        const response = await fetch(url, {
            method: method,
            body: formData,
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to save hotel');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('hotelModal')).hide();
        loadHotels();
        
    } catch (error) {
        console.error('Error saving hotel:', error);
        alert('Failed to save hotel');
    }
}

async function editHotel(id) {
    try {
        const response = await fetch(`/api/admin/hotels/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to load hotel details');
        }
        
        const hotel = await response.json();
        
        
        document.getElementById('modalTitle').textContent = 'Edit Hotel';
        document.getElementById('hotelId').value = hotel.id;
        document.getElementById('hotelName').value = hotel.name;
        document.getElementById('location').value = hotel.location;
        document.getElementById('description').value = hotel.description;
        
        // Set facilities
        document.querySelectorAll('#facilitiesList input').forEach(checkbox => {
            checkbox.checked = hotel.facilities.includes(checkbox.value);
        });
        
        // Clear existing room types
        document.getElementById('roomTypes').innerHTML = '';
        
        // Add existing room types
        hotel.room_types.forEach(roomType => {
            addRoomTypeForm();
            const form = document.querySelector('.room-type-form:last-child');
            form.querySelector('[name="room_type_name"]').value = roomType.name;
            form.querySelector('[name="price"]').value = roomType.price;
            form.querySelector('[name="max_occupancy"]').value = roomType.max_occupancy;
            form.querySelector('[name="room_count"]').value = roomType.room_count;
            form.querySelector('[name="facilities"]').value = roomType.facilities;
        });
        
        // Show modal
        new bootstrap.Modal(document.getElementById('hotelModal')).show();
        
    } catch (error) {
        console.error('Error loading hotel details:', error);
        alert('Failed to load hotel details');
    }
}

function showDeleteModal(id) {
    document.getElementById('confirmDelete').dataset.hotelId = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function handleDeleteHotel() {
    const hotelId = document.getElementById('confirmDelete').dataset.hotelId;
    
    try {
        const response = await fetch(`/api/admin/hotels/${hotelId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete hotel');
        }
        
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        loadHotels();
        
    } catch (error) {
        console.error('Error deleting hotel:', error);
        alert('Failed to delete hotel');
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
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('An error occurred during logout');
    }
}
