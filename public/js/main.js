// Global variables
let currentUser = null;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeDatePickers();
    setupEventListeners();
});

// Initialize date pickers
function initializeDatePickers() {
    flatpickr('.datepicker', {
        minDate: 'today',
        dateFormat: 'Y-m-d'
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search form submission
    document.getElementById('searchForm')?.addEventListener('submit', handleSearch);
    
    // Filter application
    document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
    
    // Sorting change
    document.getElementById('sortBy')?.addEventListener('change', handleSort);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/check', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateNavigation(true);
        } else {
            updateNavigation(false);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        updateNavigation(false);
    }
}

// Update navigation based on auth status
function updateNavigation(isAuthenticated) {
    const loginNav = document.getElementById('loginNav');
    const registerNav = document.getElementById('registerNav');
    const dashboardNav = document.getElementById('dashboardNav');
    const logoutNav = document.getElementById('logoutNav');
    
    if (isAuthenticated) {
        loginNav.classList.add('d-none');
        registerNav.classList.add('d-none');
        dashboardNav.classList.remove('d-none');
        logoutNav.classList.remove('d-none');
    } else {
        loginNav.classList.remove('d-none');
        registerNav.classList.remove('d-none');
        dashboardNav.classList.add('d-none');
        logoutNav.classList.add('d-none');
    }
}

// Handle search form submission
async function handleSearch(e) {
    e.preventDefault();
    
    const searchParams = new URLSearchParams({
        location: document.getElementById('location').value,
        check_in: document.getElementById('checkIn').value,
        check_out: document.getElementById('checkOut').value,
        guests: document.getElementById('guests').value,
        rooms: document.getElementById('rooms').value
    });
    
    try {
        const response = await fetch(`/api/hotels/search?${searchParams}`);
        const data = await response.json();
        displaySearchResults(data.hotels);
    } catch (error) {
        console.error('Search failed:', error);
        showError('Failed to fetch search results');
    }
}

// Display search results
function displaySearchResults(hotels) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (hotels.length === 0) {
        resultsContainer.innerHTML = '<div class="col-12"><p class="text-center">No hotels found matching your criteria</p></div>';
        return;
    }
    
    hotels.forEach(hotel => {
        const hotelCard = createHotelCard(hotel);
        resultsContainer.appendChild(hotelCard);
    });
}

// Create hotel card element
function createHotelCard(hotel) {
    const div = document.createElement('div');
    div.className = 'col-md-6 col-lg-4';
    div.innerHTML = `
        <div class="card hotel-card h-100">
            <img src="${hotel.thumbnail || '/images/default-hotel.jpg'}" class="card-img-top hotel-image" alt="${hotel.name}">
            <div class="card-body">
                <h5 class="card-title">${hotel.name}</h5>
                <p class="card-text">${hotel.location}</p>
                <div class="rating mb-2">
                    ${createRatingStars(hotel.rating)}
                </div>
                <p class="facilities-list text-muted">
                    ${hotel.facilities.join(' • ')}
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="price">
                        From $${hotel.price_range.min}
                    </div>
                    <a href="/hotel.html?id=${hotel.id}" class="btn btn-outline-primary">View Details</a>
                </div>
            </div>
        </div>
    `;
    return div;
}

// Create rating stars
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

// Apply filters
function applyFilters() {
    const filters = {
        price_min: document.getElementById('priceMin').value,
        price_max: document.getElementById('priceMax').value,
        rating: document.getElementById('rating').value,
        facilities: getSelectedFacilities()
    };
    
    // Re-fetch search results with filters
    handleSearch(new Event('submit'));
}

// Get selected facilities
function getSelectedFacilities() {
    const facilities = [];
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        facilities.push(checkbox.value);
    });
    return facilities;
}

// Handle sorting
function handleSort() {
    const sortBy = document.getElementById('sortBy').value;
    // Re-order current results based on sorting preference
    const results = Array.from(document.getElementById('searchResults').children);
    
    results.sort((a, b) => {
        const priceA = parseFloat(a.querySelector('.price').textContent.replace('From $', ''));
        const priceB = parseFloat(b.querySelector('.price').textContent.replace('From $', ''));
        
        
        if (sortBy === 'price_asc') {
            return priceA - priceB;
        } else if (sortBy === 'price_desc') {
            return priceB - priceA;
        }
        // Add other sorting options as needed
    });
    
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    results.forEach(result => container.appendChild(result));
}

// Handle logout
async function handleLogout(e) {
    e.preventDefault();
    
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            currentUser = null;
            updateNavigation(false);
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout failed:', error);
        showError('Failed to logout');
    }
}

// Show error message
function showError(message) {
    // Implement error notification system
    alert(message); // Replace with better UI notification
}
