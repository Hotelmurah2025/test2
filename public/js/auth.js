// Login form validation and submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous error messages
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');
    emailError.style.display = 'none';
    passwordError.style.display = 'none';
    emailError.classList.remove('error-message');
    passwordError.classList.remove('error-message');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid email address', 'email');
        return;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long', 'password');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Successful login
            localStorage.setItem('token', data.token);
            window.location.href = '/dashboard.html';
        } else {
            // Login failed
            showError(data.message || 'Invalid email or password', 'password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.', 'password');
    }
});

// Registration form validation and submission
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    // Clear previous error messages
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(el => el.style.display = 'none');
    
    // Validation
    if (!name) {
        showError('Please enter your name', 'name');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid email address', 'email');
        return;
    }
    
    if (!password || password.length < 6) {
        showError('Password must be at least 6 characters long', 'password');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match', 'confirm_password');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Successful registration
            alert('Registration successful! Please login.');
            window.location.href = '/login.html';
        } else {
            showError(data.message || 'Registration failed', 'email');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred. Please try again.', 'email');
    }
});

// Helper function to show error messages
function showError(message, fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('text-danger');
        errorElement.style.color = 'red';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.fontSize = '0.875rem';
    }
}
