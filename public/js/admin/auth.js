document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            window.location.href = '/admin/dashboard.html';
        } else {
            showError(data.message || 'Login failed', 'email');
        }
    } catch (error) {
        showError('An error occurred. Please try again.', 'email');
    }
});

function showError(message, field) {
    const errorElement = document.getElementById(`${field}-error`);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.classList.add('error-message');
        errorElement.style.color = 'red';
        errorElement.style.marginTop = '0.25rem';
        errorElement.style.fontSize = '0.875rem';
    }
}
