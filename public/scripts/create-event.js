// Create event functionality

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!utils.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initCreateEventForm();
});

function initCreateEventForm() {
    const form = document.getElementById('createEventForm');
    const isPaidCheckbox = document.getElementById('isPaid');
    const paidEventDetails = document.getElementById('paidEventDetails');
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');

    // Handle paid event toggle
    isPaidCheckbox?.addEventListener('change', () => {
        if (isPaidCheckbox.checked) {
            paidEventDetails.style.display = 'block';
            document.getElementById('price').required = true;
        } else {
            paidEventDetails.style.display = 'none';
            document.getElementById('price').required = false;
            document.getElementById('price').value = '';
        }
    });

    // Handle image upload
    imageInput?.addEventListener('change', handleImageUpload);

    // Handle form submission
    form?.addEventListener('submit', handleFormSubmit);

    // Initialize file upload drag and drop
    initFileUpload();

    // Set minimum date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // Auto-populate contact email with user email
    const user = utils.getUser();
    const contactEmailInput = document.getElementById('contact_email');
    if (contactEmailInput && user?.email) {
        contactEmailInput.value = user.email;
    }
}

function initFileUpload() {
    const fileUpload = document.querySelector('.file-upload');
    const fileInput = document.getElementById('image');

    if (!fileUpload || !fileInput) return;

    // Drag and drop handlers
    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.classList.add('dragover');
    });

    fileUpload.addEventListener('dragleave', () => {
        fileUpload.classList.remove('dragover');
    });

    fileUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUpload.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleImageUpload({ target: fileInput });
        }
    });

    // Click to upload
    fileUpload.addEventListener('click', () => {
        fileInput.click();
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    const imagePreview = document.getElementById('imagePreview');
    
    if (!file || !imagePreview) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        notifications.error('Please select a valid image file');
        event.target.value = '';
        return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        notifications.error('Image size must be less than 5MB');
        event.target.value = '';
        return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.innerHTML = `
            <div style="position: relative; display: inline-block;">
                <img src="${e.target.result}" alt="Preview" class="preview-image">
                <button type="button" class="preview-remove" onclick="removeImagePreview()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        imagePreview.classList.add('show');
    };
    reader.readAsDataURL(file);
}

function removeImagePreview() {
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('show');
    }
}

async function handleFormSubmit(event) {
    console.log('Submitting form!');
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Validate form
    if (!validateEventForm(form)) {
        console.log('Validation failed!');
        return;
    }
    console.log('Validation passed!');

    // Show loading state
    setButtonLoading(submitButton, true);

    try {
        // Prepare form data
        const formData = new FormData(form);

        // Set all fields explicitly in snake_case
        formData.set('title', form.title.value);
        formData.set('description', form.description.value);
        formData.set('location', form.location.value);
        formData.set('date', form.date.value);
        formData.set('time', form.time.value);
        formData.set('is_paid', document.getElementById('isPaid').checked.toString());
        formData.set('category', form.category.value);
        formData.set('contact_email', form.contact_email.value);
        formData.set('contact_phone', form.contact_phone.value);
        // Optional fields
        formData.set('price', form.price.value || '0');
        formData.set('max_participants', form.max_participants.value || '');
        // Image is handled by FormData automatically if selected

        // Create event
        const response = await api.events.create(formData);
        
        notifications.success('Event created successfully!');
        
        // Redirect to event details or dashboard
        setTimeout(() => {
            window.location.href = '/my-events';
        }, 1500);

    } catch (error) {
        console.error('Error creating event:', error);
        notifications.error(error.message || 'Failed to create event');
        setButtonLoading(submitButton, false);
    }
}

function validateEventForm(form) {
    let isValid = true;
    const formData = new FormData(form);

    // Clear previous validations
    const requiredFields = [
        'title', 'description', 'location', 'date', 'time', 'category', 'contact_email'
    ];
    requiredFields.forEach(field => {
        const value = formData.get(field);
        if (!value || value.trim() === '') {
            showFieldError(field, 'This field is required');
            if (!firstError) firstError = `${field.replace('_', ' ')} is required.`;
            isValid = false;
        }
    });

    // Email validation
    const email = formData.get('contact_email');
    if (email && !validation.validateEmail(email)) {
        showFieldError('contact_email', 'Please enter a valid email address');
        if (!firstError) firstError = 'Please enter a valid email address.';
        isValid = false;
    }

    // Phone validation (optional)
    const phone = formData.get('contact_phone');
    if (phone && !validation.validatePhone(phone)) {
        showFieldError('contact_phone', 'Please enter a valid phone number');
        if (!firstError) firstError = 'Please enter a valid phone number.';
        isValid = false;
    }

    // Date validation
    const date = formData.get('date');
    if (date) {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            showFieldError('date', 'Event date cannot be in the past');
            if (!firstError) firstError = 'Event date cannot be in the past.';
            isValid = false;
        }
    }

    // Paid event validation
    const isPaid = document.getElementById('isPaid').checked;
    if (isPaid) {
        const price = formData.get('price');
        if (!price || parseFloat(price) <= 0) {
            showFieldError('price', 'Please enter a valid price');
            if (!firstError) firstError = 'Please enter a valid price.';
            isValid = false;
        }
    }

    // Max participants validation
    const maxParticipants = formData.get('max_participants');
    if (maxParticipants && parseInt(maxParticipants) <= 0) {
        showFieldError('max_participants', 'Maximum participants must be greater than 0');
        if (!firstError) firstError = 'Maximum participants must be greater than 0.';
        isValid = false;
    }

    if (!isValid && firstError) {
        notifications.error(firstError);
    }

    return isValid;
}

function showFieldError(fieldName, message) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    const formGroup = field?.closest('.form-group');
    
    if (formGroup) {
        formGroup.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }
}

function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Event...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

// Real-time validation
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createEventForm');
    if (!form) return;

    // Add event listeners for real-time validation
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        field.addEventListener('blur', () => {
            validateField(field);
        });

        field.addEventListener('input', () => {
            clearFieldValidation(field);
        });
    });
});

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    const isRequired = field.hasAttribute('required');

    // Clear previous validation
    clearFieldValidation(field);

    // Required field validation
    if (isRequired && !value) {
        showFieldError(fieldName, 'This field is required');
        return;
    }

    // Specific field validations
    switch (fieldName) {
        case 'contact_email':
            if (value && !validation.validateEmail(value)) {
                showFieldError(fieldName, 'Please enter a valid email address');
            }
            break;
        case 'contact_phone':
            if (value && !validation.validatePhone(value)) {
                showFieldError(fieldName, 'Please enter a valid phone number');
            }
            break;
        case 'date':
            if (value) {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    showFieldError(fieldName, 'Event date cannot be in the past');
                }
            }
            break;
        case 'price':
            if (value && parseFloat(value) <= 0) {
                showFieldError(fieldName, 'Price must be greater than 0');
            }
            break;
        case 'maxParticipants':
            if (value && parseInt(value) <= 0) {
                showFieldError(fieldName, 'Must be greater than 0');
            }
            break;
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

// Make functions globally available
window.removeImagePreview = removeImagePreview;