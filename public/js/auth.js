// Login form validation and submission
document.addEventListener('DOMContentLoaded', () => {
    // Login Form Handling
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailInput = loginForm.querySelector('#email');
        const passwordInput = loginForm.querySelector('#password');
        const emailError = loginForm.querySelector('#email-error');
        const passwordError = loginForm.querySelector('#password-error');

        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return email && emailRegex.test(email);
        }

        function showError(element, message) {
            element.textContent = message;
            element.style.display = 'block';
            element.classList.add('error-message');
        }

        function hideError(element) {
            element.style.display = 'none';
            element.classList.remove('error-message');
        }

        // Email validation on input
        emailInput?.addEventListener('input', () => {
            const email = emailInput.value;
            if (!validateEmail(email)) {
                showError(emailError, 'Please enter a valid email address');
            } else {
                hideError(emailError);
            }
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value;
            const password = passwordInput.value;
            
            // Clear previous error messages
            hideError(emailError);
            hideError(passwordError);
            
            // Validate email immediately and ensure error is visible
            if (!validateEmail(email)) {
                showError(emailError, 'Please enter a valid email address');
                // Force a reflow to ensure the error is immediately visible
                emailError.offsetHeight;
                return;
            }
            
            // Validate password length
            if (!password || password.length < 6) {
                showError(passwordError, 'Password must be at least 6 characters long');
                // Force a reflow to ensure the error is immediately visible
                passwordError.offsetHeight;
                return;
            }
        
            // Password validation
            if (!password || password.length < 6) {
                passwordError.textContent = 'Password must be at least 6 characters long';
                passwordError.style.display = 'block';
                passwordError.classList.add('error-message');
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
                    localStorage.setItem('token', data.token);
                    window.location.href = '/dashboard.html';
                } else {
                    const errorMessage = data.message || 'Login failed';
                    emailError.textContent = errorMessage;
                    emailError.style.display = 'block';
                    emailError.classList.add('error-message');
                }
            } catch (error) {
                emailError.textContent = 'An error occurred. Please try again.';
                emailError.style.display = 'block';
                emailError.classList.add('error-message');
            }
        });
    }

    // Registration Form Handling
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const nameInput = registerForm.querySelector('#name');
        const emailInput = registerForm.querySelector('#email');
        const passwordInput = registerForm.querySelector('#password');
        const confirmPasswordInput = registerForm.querySelector('#confirm_password');
        const nameError = registerForm.querySelector('#name-error');
        const emailError = registerForm.querySelector('#email-error');
        const passwordError = registerForm.querySelector('#password-error');
        const confirmPasswordError = registerForm.querySelector('#confirm_password-error');

        // Real-time validation for name
        nameInput?.addEventListener('input', () => {
            const name = nameInput.value;
            if (!name || name.length < 2) {
                showError(nameError, 'Name must be at least 2 characters long');
            } else {
                hideError(nameError);
            }
        });

        // Real-time validation for email
        emailInput?.addEventListener('input', () => {
            const email = emailInput.value;
            if (!validateEmail(email)) {
                showError(emailError, 'Please enter a valid email address');
            } else {
                hideError(emailError);
            }
        });

        // Real-time validation for password
        passwordInput?.addEventListener('input', () => {
            const password = passwordInput.value;
            if (!password || password.length < 6) {
                showError(passwordError, 'Password must be at least 6 characters long');
            } else {
                hideError(passwordError);
            }
            // Check confirm password match if it has a value
            if (confirmPasswordInput.value) {
                if (password !== confirmPasswordInput.value) {
                    showError(confirmPasswordError, 'Passwords do not match');
                } else {
                    hideError(confirmPasswordError);
                }
            }
        });

        // Real-time validation for confirm password
        confirmPasswordInput?.addEventListener('input', () => {
            const confirmPassword = confirmPasswordInput.value;
            const password = passwordInput.value;
            if (password !== confirmPassword) {
                showError(confirmPasswordError, 'Passwords do not match');
            } else {
                hideError(confirmPasswordError);
            }
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous errors
            [nameError, emailError, passwordError, confirmPasswordError].forEach(error => {
                if (error) hideError(error);
            });

            const name = nameInput.value;
            const email = emailInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validation
            let hasError = false;


            if (!name || name.length < 2) {
                showError(nameError, 'Name must be at least 2 characters long');
                hasError = true;
            }

            if (!validateEmail(email)) {
                showError(emailError, 'Please enter a valid email address');
                hasError = true;
            }

            if (!password || password.length < 6) {
                showError(passwordError, 'Password must be at least 6 characters long');
                hasError = true;
            }

            if (password !== confirmPassword) {
                showError(confirmPasswordError, 'Passwords do not match');
                hasError = true;
            }

            if (hasError) return;

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
                    alert('Registration successful! Please login.');
                    window.location.href = '/login.html';
                } else {
                    const errorMessage = data.message || 'Registration failed';
                    emailError.textContent = errorMessage;
                    emailError.style.display = 'block';
                    emailError.classList.add('error-message');
                }
            } catch (error) {
                emailError.textContent = 'An error occurred. Please try again.';
                emailError.style.display = 'block';
                emailError.classList.add('error-message');
            }
        });
    }
});
    
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
