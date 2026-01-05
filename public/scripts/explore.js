// Explore events functionality

let currentEvents = [];
let currentFilters = {
    search: '',
    category: '',
    type: '',
    date: '',
    user: ''
};

// Mock function to fetch all users (replace with API call if endpoint is available)
async function fetchAllUsers() {
    // TODO: Replace with real API call, e.g. await api.user.getAll();
    return [
        { id: 1, username: 'alice', fullName: 'Alice Smith' },
        { id: 2, username: 'bob', fullName: 'Bob Johnson' },
        { id: 3, username: 'charlie', fullName: 'Charlie Lee' }
    ];
}

async function populateUserDropdown() {
    const userFilter = document.getElementById('userFilter');
    if (!userFilter) return;
    userFilter.innerHTML = '<option value="">All Users</option>';
    try {
        const users = await fetchAllUsers();
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = user.fullName || user.username;
            userFilter.appendChild(option);
        });
    } catch (e) {
        console.error('Failed to load users:', e);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initExploreEvents();
    navigation.updateAuthStatus();
    navigation.initDropdowns();
    updateUserDisplays();

    // Filters Modal Logic
    const openFiltersModalBtn = document.getElementById('openFiltersModal');
    const closeFiltersModalBtn = document.getElementById('closeFiltersModal');
    const filtersModal = document.getElementById('filtersModal');

    if (openFiltersModalBtn && closeFiltersModalBtn && filtersModal) {
        openFiltersModalBtn.addEventListener('click', () => {
            filtersModal.classList.add('active');
            // Trap focus
            setTimeout(() => { closeFiltersModalBtn.focus(); }, 100);
        });
        closeFiltersModalBtn.addEventListener('click', () => {
            filtersModal.classList.remove('active');
        });
        filtersModal.addEventListener('click', (e) => {
            if (e.target === filtersModal) {
                filtersModal.classList.remove('active');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && filtersModal.classList.contains('active')) {
                filtersModal.classList.remove('active');
            }
        });
    }
    // End Filters Modal Logic

    // Profile dropdown toggle (copied from dashboard.js)
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        });
        // Accessibility: close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                profileDropdown.classList.remove('active');
            }
        });
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.utils && typeof window.utils.logout === 'function') {
                    window.utils.logout();
                }
                window.location.href = '/login';
            });
        }
    }
    // Create Event button
    const createEventBtn = document.querySelector('.btn-primary[onclick*="/create-event"]');
    if (createEventBtn) {
        createEventBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/create-event';
        });
    }
    // Notification bell (if present)
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    if (notificationBtn && notificationDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!notificationDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                notificationDropdown.classList.remove('active');
            }
        });
    }
});

function updateUserDisplays() {
    const user = utils.getUser();
    if (!user) return;
    const userNameElements = document.querySelectorAll('#userName, #welcomeUserName');
    userNameElements.forEach(element => {
        if (element) {
            element.textContent = user.fullName || user.username;
        }
    });
}

async function initExploreEvents() {
    // Initialize filters
    initFilters();
    
    // Initialize view switcher
    initViewSwitcher();
    
    // Load initial events
    await loadEvents();
    
    // Update navigation based on auth status
    navigation.updateAuthStatus();
    
    // Initialize modals
    initModals();
    
    // Get search query from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        document.getElementById('searchInput').value = searchQuery;
        currentFilters.search = searchQuery;
        await loadEvents();
    }
}

function initFilters() {
    const userFilter = document.getElementById('userFilter');
    if (userFilter) {
        userFilter.addEventListener('change', async () => {
            currentFilters.user = userFilter.value;
            await loadEvents();
        });
    }
    populateUserDropdown();
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    // Category filter
    categoryFilter?.addEventListener('change', async () => {
        currentFilters.category = categoryFilter.value;
        await loadEvents();
    });

    // Type filter
    typeFilter?.addEventListener('change', async () => {
        currentFilters.type = typeFilter.value;
        await loadEvents();
    });

    // Date filter
    dateFilter?.addEventListener('change', async () => {
        currentFilters.date = dateFilter.value;
        await loadEvents();
    });

    // Search functionality
    const debouncedSearch = utils.debounce(async () => {
        currentFilters.search = searchInput?.value.trim() || '';
        await loadEvents();
    }, 300);

    searchInput?.addEventListener('input', debouncedSearch);
    searchBtn?.addEventListener('click', async () => {
        currentFilters.search = searchInput?.value.trim() || '';
        await loadEvents();
    });

    // Clear filters
    clearFiltersBtn?.addEventListener('click', async () => {
        currentFilters = { search: '', category: '', type: '', date: '' };
        
        if (categoryFilter) categoryFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        if (dateFilter) dateFilter.value = '';
        if (searchInput) searchInput.value = '';
        
        await loadEvents();
    });
}

function initViewSwitcher() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const eventsGrid = document.getElementById('eventsGrid');

    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update grid class
            const view = btn.dataset.view;
            if (eventsGrid) {
                eventsGrid.className = view === 'list' ? 'events-grid list-view' : 'events-grid';
            }
        });
    });
}

async function loadEvents() {
    console.log('loadEvents called');
    const loading = document.getElementById('loading');
    const eventsGrid = document.getElementById('eventsGrid');
    if (loading) loading.style.display = 'flex';
    if (eventsGrid) eventsGrid.innerHTML = '';
    try {
        const params = {};
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.category) params.category = currentFilters.category;
        // Add more filters as needed
        const events = await api.events.getAll(params);
        let filteredEvents = events;
        if (currentFilters.user) {
            filteredEvents = filteredEvents.filter(event => event.creator && (event.creator.username === currentFilters.user));
        }
        currentEvents = filterEvents(filteredEvents);
        console.log('Calling displayEvents with', currentEvents);
        displayEvents(currentEvents);
    } catch (error) {
        console.error('Error loading events:', error);
        notifications.error('Failed to load events');
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load events</h3>
                    <p>Please try again later</p>
                    <button class="btn-primary" onclick="loadEvents()">Retry</button>
                </div>
            `;
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// (Removed unreachable duplicate loadEvents function that caused SyntaxError)


function filterEvents(events) {
    let filtered = [...events];

    // Filter by type (free/paid)
    if (currentFilters.type === 'free') {
        filtered = filtered.filter(event => !event.is_paid);
    } else if (currentFilters.type === 'paid') {
        filtered = filtered.filter(event => event.is_paid);
    }

    // Filter by date
    if (currentFilters.date) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        const monthFromNow = new Date(today);
        monthFromNow.setMonth(monthFromNow.getMonth() + 1);

        filtered = filtered.filter(event => {
            const eventDate = new Date(event.date);
            
            switch (currentFilters.date) {
                case 'today':
                    return eventDate.toDateString() === today.toDateString();
                case 'tomorrow':
                    return eventDate.toDateString() === tomorrow.toDateString();
                case 'week':
                    return eventDate >= today && eventDate <= weekFromNow;
                case 'month':
                    return eventDate >= today && eventDate <= monthFromNow;
                default:
                    return true;
            }
        });
    }

    return filtered;
}

function displayEvents(events) {
    console.log('displayEvents called with', events);
    // Always hide loading spinner immediately
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>No events found</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button class="btn-primary" onclick="clearAllFilters()">
                    <i class="fas fa-refresh"></i>
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }

    eventsGrid.innerHTML = events.map(event => createEventCard(event)).join('');

    // Add click handlers for event cards
    events.forEach(event => {
        const card = document.getElementById(`event-${event.id}`);
        if (card) {
            card.addEventListener('click', () => selectEvent(event));
            const btn = card.querySelector('.view-details-btn');
            if (btn) btn.addEventListener('click', e => {
                e.stopPropagation();
                selectEvent(event);
            });
        }
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.id = `event-${event.id}`;
    card.innerHTML = `
        <div class="event-image${event.image_url ? '' : ' placeholder'}">
            ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}">` : `<div class="event-image-placeholder"><i class="fas fa-image"></i></div>`}
        </div>
        <div class="event-main">
            <h3 class="event-title">${event.title}</h3>
            <div class="event-meta">
                <span><i class="fas fa-calendar"></i> ${utils.formatDate(event.date)}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                <span><i class="fas fa-tag"></i> ${event.category}</span>
            </div>
            <div class="event-description">${event.description ? event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '') : 'No description.'}</div>
        </div>
        <div class="event-actions">
            <button class="btn-sm btn-primary view-details-btn">
                <i class="fas fa-info-circle"></i>
                View Event
            </button>
            <button class="btn-sm btn-discussion" onclick="showDiscussionModal(${event.id})">
                <i class="fas fa-comments"></i>
                Discussion
            </button>
        </div>
    `;
    card.addEventListener('click', () => selectEvent(event));
    card.querySelector('.view-details-btn').addEventListener('click', e => {
        e.stopPropagation();
        selectEvent(event);
    });
    return card.outerHTML;
}

function selectEvent(event) {
    // Highlight selected card
    document.querySelectorAll('.event-card.selected').forEach(card => card.classList.remove('selected'));
    const selectedCard = document.getElementById(`event-${event.id}`);
    if (selectedCard) selectedCard.classList.add('selected');
    showEventDetails(event);
}

function showEventDetails(event) {
    const panel = document.getElementById('eventDetailsPanel');
    const panelContent = document.getElementById('panelContent');
    
    if (!panel || !panelContent) return;

    const isAuthenticated = utils.isAuthenticated();
    const isPaid = event.is_paid;
    
    panelContent.innerHTML = `
        <div class="event-detail-content">
            ${event.image_url ? `
                <div class="event-detail-image">
                    <img src="${event.image_url}" alt="${event.title}">
                </div>
            ` : ''}
            
            <div class="event-detail-info">
                <div class="event-category">${event.category}</div>
                <h3>${event.title}</h3>
                <p class="event-detail-description">${event.description}</p>
                
                <div class="event-detail-meta">
                    <div class="event-meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${utils.formatDate(event.date)}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${utils.formatTime(event.time)}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <a href="${utils.getGoogleMapsUrl(event.location)}" target="_blank" class="event-location">
                            ${event.location}
                        </a>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-user"></i>
                        <span>Organized by ${event.creator_full_name || event.creator_name}</span>
                    </div>
                    ${event.contact_email ? `
                        <div class="event-meta-item">
                            <i class="fas fa-envelope"></i>
                            <a href="mailto:${event.contact_email}">${event.contact_email}</a>
                        </div>
                    ` : ''}
                    ${event.contact_phone ? `
                        <div class="event-meta-item">
                            <i class="fas fa-phone"></i>
                            <a href="tel:${event.contact_phone}">${event.contact_phone}</a>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="event-registration">
                <div class="registration-fee ${isPaid ? '' : 'free'}">
                    ${isPaid ? utils.formatCurrency(event.price) : 'Free Event'}
                </div>
                <div class="participants-count">
                    ${event.participant_count || 0} people registered
                    ${event.max_participants ? ` (${event.max_participants} max)` : ''}
                </div>
                
                ${isAuthenticated ? `
                    <button class="btn-primary btn-full" onclick="registerForEvent(${event.id}, ${isPaid})">
                        <i class="fas fa-ticket-alt"></i>
                        ${isPaid ? 'Register & Pay' : 'Register Now'}
                    </button>
                ` : `
                    <button class="btn-primary btn-full" onclick="window.location.href='/login'">
                        <i class="fas fa-sign-in-alt"></i>
                        Login to Register
                    </button>
                `}
            </div>
        </div>
    `;
}

async function registerForEvent(eventId, isPaid) {
    if (!utils.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    try {
        if (isPaid) {
            // For paid events, show payment simulation
            const confirmed = confirm('This will redirect you to the payment page. Continue?');
            if (!confirmed) return;
            
            // Simulate payment process
            notifications.warning('Payment simulation: Processing payment...');
            
            setTimeout(async () => {
                try {
                    await api.events.register(eventId);
                    notifications.success('Payment successful! You are now registered for this event.');
                    await loadEvents(); // Refresh events to update participant count
                    window.location.href = '/dashboard.html';
                } catch (error) {
                    notifications.error(error.message || 'Registration failed');
                }
            }, 2000);
        } else {
            await api.events.register(eventId);
            notifications.success('Successfully registered for the event!');
            await loadEvents(); // Refresh events to update participant count
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        notifications.error(error.message || 'Registration failed');
    }
}

function initModals() {
    const eventModal = document.getElementById('eventModal');
    const discussionModal = document.getElementById('discussionModal');
    const closeModal = document.getElementById('closeModal');
    const closeDiscussionModal = document.getElementById('closeDiscussionModal');
    const closePanelBtn = document.getElementById('closePanelBtn');

    // Close modal handlers
    closeModal?.addEventListener('click', () => {
        eventModal?.classList.remove('show');
    });

    closeDiscussionModal?.addEventListener('click', () => {
        discussionModal?.classList.remove('show');
    });

    closePanelBtn?.addEventListener('click', () => {
        const panel = document.getElementById('eventDetailsPanel');
        panel?.classList.add('hidden');
    });

    // Close modals when clicking outside
    [eventModal, discussionModal].forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Discussion form handler
    const postDiscussionBtn = document.getElementById('postDiscussion');
    postDiscussionBtn?.addEventListener('click', postDiscussionMessage);
}

async function showDiscussionModal(eventId) {
    const modal = document.getElementById('discussionModal');
    if (!modal) return;

    // Store event ID for posting discussions
    modal.dataset.eventId = eventId;
    
    await loadDiscussions(eventId);
    modal.classList.add('show');
}

async function loadDiscussions(eventId) {
    const discussionList = document.getElementById('discussionList');
    if (!discussionList) return;

    try {
        const discussions = await api.events.getDiscussions(eventId);
        
        if (discussions.length === 0) {
            discussionList.innerHTML = `
                <div class="empty-discussions">
                    <i class="fas fa-comments"></i>
                    <p>No discussions yet. Be the first to start the conversation!</p>
                </div>
            `;
        } else {
            discussionList.innerHTML = discussions.map(discussion => `
                <div class="discussion-item">
                    <div class="discussion-header">
                        <span class="discussion-author">${discussion.full_name || discussion.username}</span>
                        <span class="discussion-time">${utils.formatDate(discussion.created_at)}</span>
                    </div>
                    <div class="discussion-message">${discussion.message}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading discussions:', error);
        discussionList.innerHTML = `
            <div class="error-discussions">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load discussions</p>
            </div>
        `;
    }
}

async function postDiscussionMessage() {
    const modal = document.getElementById('discussionModal');
    const messageInput = document.getElementById('discussionMessage');
    const eventId = modal?.dataset.eventId;
    
    if (!eventId || !messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) {
        notifications.error('Please enter a message');
        return;
    }

    if (!utils.isAuthenticated()) {
        notifications.error('Please login to join the discussion');
        return;
    }

    const typeFilter = document.getElementById('typeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('searchInput');
    
    if (categoryFilter) categoryFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    loadEvents();
}

// Define clearAllFilters globally
function clearAllFilters() {
    currentFilters = { search: '', category: '', type: '', date: '', user: '' };
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const userFilter = document.getElementById('userFilter');
    const searchInput = document.getElementById('searchInput');
    if (categoryFilter) categoryFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    if (userFilter) userFilter.value = '';
    if (searchInput) searchInput.value = '';
    loadEvents();
}

// Make functions globally available
// No modal for event details, do not export showEventModal
window.showDiscussionModal = showDiscussionModal;
window.registerForEvent = registerForEvent;
window.clearAllFilters = clearAllFilters;

// Only keep discussion modal and post button logic
const discussionModal = document.getElementById('discussionModal');
const closeDiscussionBtn = document.getElementById('closeDiscussionModal');
if (discussionModal && closeDiscussionBtn) {
    closeDiscussionBtn.onclick = () => discussionModal.classList.remove('show');
}
const postDiscussionBtn = document.getElementById('postDiscussion');
if (postDiscussionBtn) {
    postDiscussionBtn.onclick = postDiscussionMessage;
}