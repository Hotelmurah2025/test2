// Login form validation and submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous error messages
    document.getElementById('email-error').style.display = 'none';
    document.getElementById('password-error').style.display = 'none';
    
    // Email validation
    if (!email || !email.includes('@')) {
        const errorElement = document.getElementById('email-error');
        errorElement.textContent = 'Please enter a valid email address';
        errorElement.style.display = 'block';
        errorElement.classList.add('text-danger');
        return;
    }
    
    // Password validation
    if (!password || password.length < 6) {
        const errorElement = document.getElementById('password-error');
        errorElement.textContent = 'Password must be at least 6 characters long';
        errorElement.style.display = 'block';
        errorElement.classList.add('text-danger');
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
            const errorElement = document.getElementById('password-error');
            errorElement.textContent = data.message || 'Invalid email or password';
            errorElement.style.display = 'block';
            errorElement.classList.add('text-danger');
        }
    } catch (error) {
        console.error('Login error:', error);
        const errorElement = document.getElementById('password-error');
        errorElement.textContent = 'An error occurred. Please try again.';
        errorElement.style.display = 'block';
        errorElement.classList.add('text-danger');
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
    
    if (!email || !email.includes('@')) {
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
    }
}
