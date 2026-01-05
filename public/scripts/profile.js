// Profile functionality

let currentSection = 'profile';

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!utils.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    // Sidebar logout button
    const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', () => {
            utils.removeToken();
            utils.removeUser();
            window.location.href = '/login';
        });
    }

    initProfile();
});

function initProfile() {
    // Initialize menu navigation
    initMenuNavigation();
    
    // Load user data
    loadUserData();
    
    // Initialize forms
    initProfileForm();
    initPasswordForm();
    initNotificationSettings();
    initPreferences();
}

function initMenuNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(cs => cs.classList.remove('active'));
            const targetSection = document.getElementById(`${section}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            currentSection = section;
        });
    });
}

function loadUserData() {
    const user = utils.getUser();
    if (!user) return;

    // Update profile card
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileName) profileName.textContent = user.fullName || user.username;
    if (profileEmail) profileEmail.textContent = user.email;

    // Populate form fields
    const fields = {
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        college: user.college || '',
        phone: user.phone || ''
    };

    Object.entries(fields).forEach(([fieldName, value]) => {
        const field = document.getElementById(fieldName);
        if (field) field.value = value;
    });

    // Load stats (simulated for now)
    loadUserStats();
}

async function loadUserStats() {
    try {
        const [createdEvents, registeredEvents] = await Promise.all([
            api.user.getCreatedEvents(),
            api.user.getRegisteredEvents()
        ]);

        const eventsCreated = document.getElementById('eventsCreated');
        const eventsAttended = document.getElementById('eventsAttended');

        if (eventsCreated) {
            animateCounter(eventsCreated, createdEvents.length);
        }
        if (eventsAttended) {
            animateCounter(eventsAttended, registeredEvents.length);
        }

    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

function animateCounter(element, targetValue) {
    let currentValue = 0;
    const increment = Math.ceil(targetValue / 20);
    const duration = 1000;
    const interval = duration / 20;

    const animate = () => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
        } else {
            element.textContent = currentValue;
            setTimeout(animate, interval);
        }
    };

    setTimeout(animate, 300);
}

function initProfileForm() {
    const form = document.getElementById('profileForm');
    const resetBtn = document.getElementById('resetProfileBtn');

    if (form) {
        form.addEventListener('submit', handleProfileSubmit);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            loadUserData(); // Reload original data
            notifications.success('Changes reset');
        });
    }

    // Real-time validation
    const fields = form?.querySelectorAll('input');
    fields?.forEach(field => {
        field.addEventListener('blur', () => validateProfileField(field));
        field.addEventListener('input', () => clearFieldValidation(field));
    });
}

async function handleProfileSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!validateProfileForm(form)) {
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const formData = new FormData(form);
        const userData = {
            fullName: formData.get('fullName'),
            username: formData.get('username'),
            email: formData.get('email'),
            college: formData.get('college'),
            phone: formData.get('phone')
        };

        // Simulate API call (you would implement this endpoint)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update local storage
        const currentUser = utils.getUser();
        const updatedUser = { ...currentUser, ...userData };
        utils.setUser(updatedUser);
        
        notifications.success('Profile updated successfully!');
        
        // Update displays
        loadUserData();

    } catch (error) {
        console.error('Error updating profile:', error);
        notifications.error('Failed to update profile');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

function validateProfileForm(form) {
    let isValid = true;
    const formData = new FormData(form);

    // Clear previous validations
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'success');
        const errorMsg = group.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    });

    // Validate required fields
    const requiredFields = ['fullName', 'username', 'email'];
    requiredFields.forEach(fieldName => {
        const value = formData.get(fieldName);
        if (!value || !value.toString().trim()) {
            showFieldError(fieldName, 'This field is required');
            isValid = false;
        }
    });

    // Validate email
    const email = formData.get('email');
    if (email && !validation.validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate phone (optional)
    const phone = formData.get('phone');
    if (phone && !validation.validatePhone(phone)) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }

    return isValid;
}

function validateProfileField(field) {
    const value = field.value.trim();
    const fieldName = field.name;

    clearFieldValidation(field);

    switch (fieldName) {
        case 'fullName':
        case 'username':
            if (!value) {
                showFieldError(fieldName, 'This field is required');
            } else {
                showFieldSuccess(fieldName);
            }
            break;
        case 'email':
            if (!value) {
                showFieldError(fieldName, 'Email is required');
            } else if (!validation.validateEmail(value)) {
                showFieldError(fieldName, 'Please enter a valid email address');
            } else {
                showFieldSuccess(fieldName);
            }
            break;
        case 'phone':
            if (value && !validation.validatePhone(value)) {
                showFieldError(fieldName, 'Please enter a valid phone number');
            } else if (value) {
                showFieldSuccess(fieldName);
            }
            break;
    }
}

function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    
    if (form) {
        form.addEventListener('submit', handlePasswordSubmit);
    }

    // Real-time validation
    const fields = form?.querySelectorAll('input');
    fields?.forEach(field => {
        field.addEventListener('blur', () => validatePasswordField(field));
        field.addEventListener('input', () => clearFieldValidation(field));
    });
}

async function handlePasswordSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (!validatePasswordForm(form)) {
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const formData = new FormData(form);
        const passwordData = {
            currentPassword: formData.get('currentPassword'),
            newPassword: formData.get('newPassword')
        };

        // Simulate API call (you would implement this endpoint)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        notifications.success('Password updated successfully!');
        
        // Clear form
        form.reset();

    } catch (error) {
        console.error('Error updating password:', error);
        notifications.error('Failed to update password');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

function validatePasswordForm(form) {
    let isValid = true;
    const formData = new FormData(form);

    // Clear previous validations
    form.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'success');
        const errorMsg = group.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    });

    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    // Validate current password
    if (!currentPassword) {
        showFieldError('currentPassword', 'Current password is required');
        isValid = false;
    }

    // Validate new password
    if (!newPassword) {
        showFieldError('newPassword', 'New password is required');
        isValid = false;
    } else if (!validation.validatePassword(newPassword)) {
        showFieldError('newPassword', 'Password must be at least 8 characters');
        isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Please confirm your new password');
        isValid = false;
    } else if (newPassword !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }

    return isValid;
}

function validatePasswordField(field) {
    const value = field.value;
    const fieldName = field.name;

    clearFieldValidation(field);

    switch (fieldName) {
        case 'currentPassword':
            if (!value) {
                showFieldError(fieldName, 'Current password is required');
            } else {
                showFieldSuccess(fieldName);
            }
            break;
        case 'newPassword':
            if (!value) {
                showFieldError(fieldName, 'New password is required');
            } else if (!validation.validatePassword(value)) {
                showFieldError(fieldName, 'Password must be at least 8 characters');
            } else {
                showFieldSuccess(fieldName);
            }
            break;
        case 'confirmPassword':
            const newPassword = document.getElementById('newPassword')?.value;
            if (!value) {
                showFieldError(fieldName, 'Please confirm your password');
            } else if (newPassword && value !== newPassword) {
                showFieldError(fieldName, 'Passwords do not match');
            } else if (value) {
                showFieldSuccess(fieldName);
            }
            break;
    }
}

function initNotificationSettings() {
    const saveBtn = document.getElementById('saveNotificationSettings');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveNotificationSettings);
    }

    // Load saved settings (simulated)
    loadNotificationSettings();
}

function loadNotificationSettings() {
    // Simulate loading saved settings
    const settings = {
        eventReminders: true,
        newEvents: true,
        eventUpdates: true,
        discussionReplies: false
    };

    Object.entries(settings).forEach(([setting, value]) => {
        const checkbox = document.getElementById(setting);
        if (checkbox) checkbox.checked = value;
    });
}

async function saveNotificationSettings() {
    const settings = {
        eventReminders: document.getElementById('eventReminders')?.checked || false,
        newEvents: document.getElementById('newEvents')?.checked || false,
        eventUpdates: document.getElementById('eventUpdates')?.checked || false,
        discussionReplies: document.getElementById('discussionReplies')?.checked || false
    };

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        notifications.success('Notification preferences saved!');
        
    } catch (error) {
        console.error('Error saving notification settings:', error);
        notifications.error('Failed to save notification preferences');
    }
}

function initPreferences() {
    const saveBtn = document.getElementById('savePreferences');
    
    if (saveBtn) {
        saveBtn.addEventListener('click', savePreferences);
    }

    // Load saved preferences (simulated)
    loadPreferences();
}

function loadPreferences() {
    // Simulate loading saved preferences
    const preferences = {
        theme: 'light',
        language: 'en',
        defaultLocation: 'Hyderabad, India',
        preferredCategories: ['workshop', 'hackathon']
    };

    // Set theme
    const themeSelect = document.getElementById('theme');
    if (themeSelect) themeSelect.value = preferences.theme;

    // Set language
    const languageSelect = document.getElementById('language');
    if (languageSelect) languageSelect.value = preferences.language;

    // Set default location
    const locationInput = document.getElementById('defaultLocation');
    if (locationInput) locationInput.value = preferences.defaultLocation;

    // Set preferred categories
    preferences.preferredCategories.forEach(category => {
        const checkbox = document.querySelector(`input[value="${category}"]`);
        if (checkbox) checkbox.checked = true;
    });
}

async function savePreferences() {
    const preferences = {
        theme: document.getElementById('theme')?.value || 'light',
        language: document.getElementById('language')?.value || 'en',
        defaultLocation: document.getElementById('defaultLocation')?.value || '',
        preferredCategories: Array.from(document.querySelectorAll('.category-tags input:checked')).map(cb => cb.value)
    };

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        notifications.success('Preferences saved!');
        
    } catch (error) {
        console.error('Error saving preferences:', error);
        notifications.error('Failed to save preferences');
    }
}

function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    const formGroup = field?.closest('.form-group');
    
    if (formGroup) {
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }
}

function showFieldSuccess(fieldName) {
    const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
    const formGroup = field?.closest('.form-group');
    
    if (formGroup) {
        formGroup.classList.add('success');
        formGroup.classList.remove('error');
        
        const errorMsg = formGroup.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    }
}

function clearFieldValidation(field) {
    const formGroup = field.closest('.form-group');
    
    if (formGroup) {
        formGroup.classList.remove('error', 'success');
        
        const errorMsg = formGroup.querySelector('.error-message');
        if (errorMsg) errorMsg.remove();
    }
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}