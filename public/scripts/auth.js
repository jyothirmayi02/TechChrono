// Authentication functionality

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        initLoginForm();
    }

    if (signupForm) {
        initSignupForm();
    }

    // Check if user is already logged in
    if (utils.isAuthenticated()) {
        window.location.href = '/dashboard';
    }
});

function initLoginForm() {
    const form = document.getElementById('loginForm');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        // Validate form
        if (!validateLoginForm(credentials)) {
            return;
        }

        // Show loading state
        setButtonLoading(submitButton, true);

        try {
            const response = await api.auth.login(credentials);
            
            // Store token and user data
            utils.setToken(response.token);
            utils.setUser(response.user);
            
            notifications.success('Login successful! Redirecting...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error) {
            notifications.error(error.message || 'Login failed');
            setButtonLoading(submitButton, false);
        }
    });

    // Real-time validation
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');

    usernameField?.addEventListener('blur', () => {
        if (!usernameField.value.trim()) {
            validation.showFieldError('username', 'Username or email is required');
        } else {
            validation.clearFieldValidation('username');
        }
    });

    passwordField?.addEventListener('blur', () => {
        if (!passwordField.value) {
            validation.showFieldError('password', 'Password is required');
        } else {
            validation.clearFieldValidation('password');
        }
    });
}

function initSignupForm() {
    const form = document.getElementById('signupForm');
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const userData = {
            fullName: formData.get('fullName'),
            username: formData.get('username'),
            email: formData.get('email'),
            college: formData.get('college'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };

        // Validate form
        if (!validateSignupForm(userData)) {
            return;
        }

        // Show loading state
        setButtonLoading(submitButton, true);

        try {
            const response = await api.auth.register(userData);
            
            // Store token and user data
            utils.setToken(response.token);
            utils.setUser(response.user);
            
            notifications.success('Account created successfully! Redirecting...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);

        } catch (error) {
            notifications.error(error.message || 'Registration failed');
            setButtonLoading(submitButton, false);
        }
    });

    // Real-time validation
    setupSignupValidation();
}

function validateLoginForm(credentials) {
    let isValid = true;

    // Clear previous validations
    validation.clearFieldValidation('username');
    validation.clearFieldValidation('password');

    // Validate username/email
    if (!credentials.username.trim()) {
        validation.showFieldError('username', 'Username or email is required');
        isValid = false;
    }

    // Validate password
    if (!credentials.password) {
        validation.showFieldError('password', 'Password is required');
        isValid = false;
    }

    return isValid;
}

function validateSignupForm(userData) {
    let isValid = true;

    // Clear previous validations
    ['fullName', 'username', 'email', 'password', 'confirmPassword'].forEach(field => {
        validation.clearFieldValidation(field);
    });

    // Validate full name
    if (!userData.fullName.trim()) {
        validation.showFieldError('fullName', 'Full name is required');
        isValid = false;
    }

    // Validate username
    if (!userData.username.trim()) {
        validation.showFieldError('username', 'Username is required');
        isValid = false;
    } else if (userData.username.length < 3) {
        validation.showFieldError('username', 'Username must be at least 3 characters');
        isValid = false;
    }

    // Validate email
    if (!userData.email.trim()) {
        validation.showFieldError('email', 'Email is required');
        isValid = false;
    } else if (!validation.validateEmail(userData.email)) {
        validation.showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate password
    if (!userData.password) {
        validation.showFieldError('password', 'Password is required');
        isValid = false;
    } else if (!validation.validatePassword(userData.password)) {
        validation.showFieldError('password', 'Password must be at least 8 characters');
        isValid = false;
    }

    // Validate confirm password
    if (!userData.confirmPassword) {
        validation.showFieldError('confirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (userData.password !== userData.confirmPassword) {
        validation.showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    // Validate phone (optional)
    if (userData.phone && !validation.validatePhone(userData.phone)) {
        validation.showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }

    // Validate terms checkbox
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox && !termsCheckbox.checked) {
        notifications.error('Please accept the terms of service and privacy policy');
        isValid = false;
    }

    return isValid;
}

function setupSignupValidation() {
    const fields = {
        fullName: document.getElementById('fullName'),
        username: document.getElementById('username'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword')
    };

    // Full name validation
    fields.fullName?.addEventListener('blur', () => {
        if (!fields.fullName.value.trim()) {
            validation.showFieldError('fullName', 'Full name is required');
        } else {
            validation.showFieldSuccess('fullName');
        }
    });

    // Username validation
    fields.username?.addEventListener('blur', () => {
        const value = fields.username.value.trim();
        if (!value) {
            validation.showFieldError('username', 'Username is required');
        } else if (value.length < 3) {
            validation.showFieldError('username', 'Username must be at least 3 characters');
        } else {
            validation.showFieldSuccess('username');
        }
    });

    // Email validation
    fields.email?.addEventListener('blur', () => {
        const value = fields.email.value.trim();
        if (!value) {
            validation.showFieldError('email', 'Email is required');
        } else if (!validation.validateEmail(value)) {
            validation.showFieldError('email', 'Please enter a valid email address');
        } else {
            validation.showFieldSuccess('email');
        }
    });

    // Phone validation (optional)
    fields.phone?.addEventListener('blur', () => {
        const value = fields.phone.value.trim();
        if (value && !validation.validatePhone(value)) {
            validation.showFieldError('phone', 'Please enter a valid phone number');
        } else if (value) {
            validation.showFieldSuccess('phone');
        }
    });

    // Password validation
    fields.password?.addEventListener('blur', () => {
        const value = fields.password.value;
        if (!value) {
            validation.showFieldError('password', 'Password is required');
        } else if (!validation.validatePassword(value)) {
            validation.showFieldError('password', 'Password must be at least 8 characters');
        } else {
            validation.showFieldSuccess('password');
        }
    });

    // Confirm password validation
    fields.confirmPassword?.addEventListener('blur', () => {
        const password = fields.password?.value;
        const confirmPassword = fields.confirmPassword.value;
        
        if (!confirmPassword) {
            validation.showFieldError('confirmPassword', 'Please confirm your password');
        } else if (password !== confirmPassword) {
            validation.showFieldError('confirmPassword', 'Passwords do not match');
        } else {
            validation.showFieldSuccess('confirmPassword');
        }
    });

    // Real-time password match validation
    fields.password?.addEventListener('input', () => {
        const confirmPassword = fields.confirmPassword?.value;
        if (confirmPassword && fields.password.value !== confirmPassword) {
            validation.showFieldError('confirmPassword', 'Passwords do not match');
        } else if (confirmPassword) {
            validation.showFieldSuccess('confirmPassword');
        }
    });
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        const originalText = button.innerHTML;
        button.dataset.originalText = originalText;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Please wait...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Social login functionality (if needed in future)
function initSocialLogin() {
    const socialButtons = document.querySelectorAll('.social-login-btn');
    
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = button.dataset.provider;
            notifications.warning(`${provider} login will be available soon`);
        });
    });
}

// Password strength indicator
function initPasswordStrength() {
    const passwordField = document.getElementById('password');
    if (!passwordField) return;

    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength';
    strengthIndicator.innerHTML = `
        <div class="strength-bar">
            <div class="strength-fill"></div>
        </div>
        <div class="strength-text">Password strength</div>
    `;

    passwordField.parentNode.insertBefore(strengthIndicator, passwordField.nextSibling);

    passwordField.addEventListener('input', () => {
        const password = passwordField.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrength(strengthIndicator, strength);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.match(/[a-z]/)) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;
    
    return score;
}

function updatePasswordStrength(indicator, strength) {
    const fill = indicator.querySelector('.strength-fill');
    const text = indicator.querySelector('.strength-text');
    
    const strengthLevels = [
        { width: '0%', color: '#e5e7eb', text: 'Password strength' },
        { width: '20%', color: '#ef4444', text: 'Very weak' },
        { width: '40%', color: '#f97316', text: 'Weak' },
        { width: '60%', color: '#eab308', text: 'Fair' },
        { width: '80%', color: '#22c55e', text: 'Good' },
        { width: '100%', color: '#16a34a', text: 'Strong' }
    ];
    
    const level = strengthLevels[strength];
    fill.style.width = level.width;
    fill.style.backgroundColor = level.color;
    text.textContent = level.text;
    text.style.color = level.color;
}

// Initialize password strength on signup page
if (window.location.pathname === '/signup') {
    document.addEventListener('DOMContentLoaded', initPasswordStrength);
}