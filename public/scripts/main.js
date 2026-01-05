// Main JavaScript utilities and shared functions

// Utility functions
const utils = {
    // Get authentication token
    getToken() {
        return localStorage.getItem('token');
    },

    // Set authentication token
    setToken(token) {
        localStorage.setItem('token', token);
    },

    // Remove authentication token
    removeToken() {
        localStorage.removeItem('token');
    },

    // Get user data
    getUser() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },

    // Set user data
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Remove user data
    removeUser() {
        localStorage.removeItem('user');
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Format time
    formatTime(timeString) {
        const time = new Date(`2000-01-01T${timeString}`);
        return time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    },

    // Truncate text
    truncateText(text, length = 100) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Generate Google Maps URL
    getGoogleMapsUrl(location) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    }
};

// API utilities
const api = {
    // Base URL for API calls
    baseUrl: window.location.origin,

    // Make authenticated request
    async request(url, options = {}) {
        const token = utils.getToken();
        let headers = { ...options.headers };

        // Only set Content-Type for JSON requests
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${url}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired or invalid
            utils.removeToken();
            utils.removeUser();
            window.location.href = '/login';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }

        return data;
    },

    // Auth endpoints
    auth: {
        login(credentials) {
            return api.request('/api/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
        },

        register(userData) {
            return api.request('/api/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        }
    },

    // Events endpoints
    events: {
        getAll(params = {}) {
            const searchParams = new URLSearchParams(params);
            return api.request(`/api/events?${searchParams}`);
        },

        getById(id) {
            return api.request(`/api/events/${id}`);
        },

        create(formData) {
            return api.request('/api/events', {
                method: 'POST',
                body: formData,
                headers: {} // Remove Content-Type for FormData
            });
        },

        update(id, formData) {
            return api.request(`/api/events/${id}`, {
                method: 'PUT',
                body: formData,
                headers: {}
            });
        },

        delete(id) {
            return api.request(`/api/events/${id}`, {
                method: 'DELETE'
            });
        },

        register(id) {
            return api.request(`/api/events/${id}/register`, {
                method: 'POST'
            });
        },

        unregister(id) {
            return api.request(`/api/events/${id}/register`, {
                method: 'DELETE'
            });
        },

        getDiscussions(id) {
            return api.request(`/api/events/${id}/discussions`);
        },

        postDiscussion(id, message) {
            return api.request(`/api/events/${id}/discussions`, {
                method: 'POST',
                body: JSON.stringify({ message })
            });
        }
    },

    // User endpoints
    user: {
        getCreatedEvents() {
            return api.request('/api/user/created-events');
        },

        getRegisteredEvents() {
            return api.request('/api/user/registered-events');
        },

        getNotifications() {
            return api.request('/api/notifications');
        }
    }
};

// Notification system
const notifications = {
    container: null,

    init() {
        this.container = document.getElementById('notification');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification';
            this.container.className = 'notification';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'success', duration = 5000) {
        if (!this.container) this.init();

        this.container.textContent = message;
        this.container.className = `notification ${type} show`;

        setTimeout(() => {
            this.container.classList.remove('show');
        }, duration);
    },

    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }
};

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(`${inputId}-eye`);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Navigation utilities
const navigation = {
    updateAuthStatus() {
        const isAuthenticated = utils.isAuthenticated();
        const user = utils.getUser();
        const navActions = document.getElementById('navActions');
        
        if (!navActions) return;

        if (isAuthenticated && user) {
            // Show authenticated navigation
            navActions.innerHTML = `
                <button class="btn-primary" onclick="window.location.href='/create-event'">
                    <i class="fas fa-plus"></i>
                    Create Event
                </button>
                <div class="nav-notifications">
                    <button class="notification-btn" id="notificationBtn">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge" id="notificationBadge">0</span>
                    </button>
                    <div class="notification-dropdown" id="notificationDropdown">
                        <div class="notification-header">
                            <h3>Notifications</h3>
                            <button class="mark-all-read" id="markAllRead">Mark all as read</button>
                        </div>
                        <div class="notification-list" id="notificationList"></div>
                    </div>
                </div>
                <div class="profile-dropdown">
                    <button class="profile-btn" id="profileBtn">
                        <i class="fas fa-user-circle"></i>
                        <span id="userName">${user.fullName || user.username}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="profileDropdown">
                        <a href="/registered-events">
                            <i class="fas fa-ticket-alt"></i>
                            Registered Events
                        </a>
                        <a href="/my-events">
                            <i class="fas fa-calendar-plus"></i>
                            Created Events
                        </a>
                        <a href="/profile">
                            <i class="fas fa-user-cog"></i>
                            Profile Settings
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" id="logoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </a>
                    </div>
                </div>
            `;
            
            this.initDropdowns();
        } else {
            // Show guest navigation
            navActions.innerHTML = `
                <button class="btn-primary" onclick="window.location.href='/login'">
                    <i class="fas fa-sign-in-alt"></i>
                    Login
                </button>
            `;
        }
    },

    initDropdowns() {
        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        const logoutBtn = document.getElementById('logoutBtn');

        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                profileDropdown.classList.remove('show');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Notifications dropdown
        const notificationBtn = document.getElementById('notificationBtn');
        const notificationDropdown = document.getElementById('notificationDropdown');

        if (notificationBtn && notificationDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationDropdown.classList.toggle('show');
                this.loadNotifications();
            });

            document.addEventListener('click', () => {
                notificationDropdown.classList.remove('show');
            });
        }
    },

    async loadNotifications() {
        try {
            const notifications = await api.user.getNotifications();
            const notificationList = document.getElementById('notificationList');
            const notificationBadge = document.getElementById('notificationBadge');

            if (notificationList) {
                if (notifications.length === 0) {
                    notificationList.innerHTML = '<p class="empty-notifications">No notifications</p>';
                } else {
                    notificationList.innerHTML = notifications.map(notification => `
                        <div class="notification-item ${notification.is_read ? '' : 'unread'}">
                            <h4>${notification.title}</h4>
                            <p>${notification.message}</p>
                            <small>${utils.formatDate(notification.created_at)}</small>
                        </div>
                    `).join('');
                }
            }

            if (notificationBadge) {
                const unreadCount = notifications.filter(n => !n.is_read).length;
                notificationBadge.textContent = unreadCount;
                notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    },

    logout() {
        utils.removeToken();
        utils.removeUser();
        notifications.success('Logged out successfully');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
};

// Search functionality
const search = {
    init() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        if (searchInput && searchBtn) {
            const debouncedSearch = utils.debounce(this.handleSearch.bind(this), 300);
            
            searchInput.addEventListener('input', debouncedSearch);
            searchBtn.addEventListener('click', () => this.handleSearch());
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
    },

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput?.value.trim();
        
        if (query) {
            // Navigate to explore page with search query
            const url = new URL('/explore', window.location.origin);
            url.searchParams.set('search', query);
            window.location.href = url.toString();
        }
    }
};

// Form validation utilities
const validation = {
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePassword(password) {
        return password.length >= 8;
    },

    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/\s/g, ''));
    },

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.add('error');
            formGroup.classList.remove('success');
            
            // Remove existing error message
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Add new error message
            if (message) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                formGroup.appendChild(errorDiv);
            }
        }
    },

    showFieldSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.add('success');
            formGroup.classList.remove('error');
            
            // Remove existing error message
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }
    },

    clearFieldValidation(fieldId) {
        const field = document.getElementById(fieldId);
        const formGroup = field?.closest('.form-group');
        
        if (formGroup) {
            formGroup.classList.remove('error', 'success');
            
            // Remove existing error message
            const existingError = formGroup.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
        }
    }
};

// Initialize common functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure dropdowns are initialized (profile/logout)
    if (window.navigation && typeof navigation.initDropdowns === 'function') {
        navigation.initDropdowns();
    }
    // Logout button in dashboard profile dropdown
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            utils.removeToken();
            utils.removeUser();
            window.location.href = '/login';
        });
    }
    // Initialize notifications system
    notifications.init();
    
    // Update navigation based on auth status
    navigation.updateAuthStatus();
    
    // Initialize search functionality
    search.init();
    
    // Initialize tooltips and other common UI elements
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', function() {
            // Add tooltip implementation if needed
        });
    });
});

// Export utilities for use in other scripts
window.utils = utils;
window.api = api;
window.notifications = notifications;
window.navigation = navigation;
window.search = search;
window.validation = validation;