// Registered Events functionality

let currentFilter = 'all';
let registeredEvents = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!utils.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initRegisteredEvents();
});

async function initRegisteredEvents() {
    try {
        // Load events
        await loadRegisteredEvents();
        
        // Initialize filters
        initFilters();
        
        // Update search functionality
        initSearch();
        
    } catch (error) {
        console.error('Error initializing registered events:', error);
        notifications.error('Failed to load your registered events');
    }
}

async function loadRegisteredEvents() {
    const loading = document.getElementById('loading');
    const eventsGrid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('emptyState');

    if (loading) loading.style.display = 'flex';
    if (eventsGrid) eventsGrid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
        registeredEvents = await api.user.getRegisteredEvents();
        
        // Update stats
        updateStats(registeredEvents);
        
        // Display events
        displayEvents(filterEvents(registeredEvents));

    } catch (error) {
        console.error('Error loading registered events:', error);
        notifications.error('Failed to load your registered events');
        
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load events</h3>
                    <p>Please try again later</p>
                    <button class="btn-primary" onclick="loadRegisteredEvents()">Retry</button>
                </div>
            `;
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function updateStats(events) {
    const totalRegistrationsElement =   document.getElementById('totalRegistrations');
    const upcomingEventsElement = document.getElementById('upcomingEvents');
    const freeEventsElement = document.getElementById('freeEvents');

    const totalRegistrations = events.length;
    const upcomingEvents = events.filter(event => new Date(event.date) >= new Date()).length;
    const freeEvents = events.filter(event => !event.is_paid).length;

    if (totalRegistrationsElement) {
        animateCounter(totalRegistrationsElement, totalRegistrations);
    }
    if (upcomingEventsElement) {
        animateCounter(upcomingEventsElement, upcomingEvents);
    }
    if (freeEventsElement) {
        animateCounter(freeEventsElement, freeEvents);
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

function initFilters() {
    const filterTabs = document.querySelectorAll('.tab-btn');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update filter
            currentFilter = tab.dataset.filter;
            
            // Display filtered events
            displayEvents(filterEvents(registeredEvents));
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
        const debouncedSearch = utils.debounce(() => {
            displayEvents(filterEvents(registeredEvents));
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            displayEvents(filterEvents(registeredEvents));
        });
    }
}

function filterEvents(events) {
    let filtered = [...events];
    
    // Filter by search term
    const searchInput = document.getElementById('searchInput');
    if (searchInput?.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filtered = filtered.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.category.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by time period
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (currentFilter) {
        case 'upcoming':
            filtered = filtered.filter(event => new Date(event.date) >= today);
            break;
        case 'past':
            filtered = filtered.filter(event => new Date(event.date) < today);
            break;
        case 'today':
            filtered = filtered.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === today.toDateString();
            });
            break;
        case 'all':
        default:
            // No additional filtering
            break;
    }
    
    return filtered;
}

function displayEvents(events) {
    const eventsGrid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!eventsGrid || !emptyState) return;

    if (events.length === 0) {
        eventsGrid.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        eventsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        eventsGrid.innerHTML = events.map(event => createEventCard(event)).join('');
    }
}

function createEventCard(event) {
    const eventDate = new Date(event.date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isUpcoming = eventDate >= today;
    const isToday = eventDate.toDateString() === today.toDateString();
    
    let status = 'upcoming';
    if (isToday) status = 'today';
    else if (!isUpcoming) status = 'past';
    
    return `
        <div class="event-card">
            <div class="event-image ${!event.image_url ? 'placeholder' : ''}">
                ${event.image_url 
                    ? `<img src="${event.image_url}" alt="${event.title}">`
                    : `<i class="fas fa-calendar-alt"></i>`
                }
                <div class="event-status ${status}">
                    ${status === 'today' ? 'Today' : (isUpcoming ? 'Upcoming' : 'Past')}
                </div>
            </div>
            
            <div class="event-content">
                <div class="event-category">${event.category}</div>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${utils.truncateText(event.description, 120)}</p>
                
                <div class="registration-date">
                    Registered on: ${utils.formatDate(event.registered_at)}
                </div>
                
                <div class="event-meta">
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
                        <a href="${utils.getGoogleMapsUrl(event.location)}" 
                           target="_blank" 
                           class="event-location">
                            ${event.location}
                        </a>
                    </div>
                    ${event.is_paid ? `
                        <div class="event-meta-item">
                            <i class="fas fa-money-bill"></i>
                            <span>${utils.formatCurrency(event.price)}</span>
                        </div>
                    ` : `
                        <div class="event-meta-item">
                            <i class="fas fa-gift"></i>
                            <span>Free Event</span>
                        </div>
                    `}
                    <div class="event-meta-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Payment: ${event.payment_status}</span>
                    </div>
                </div>

                <div class="event-actions">
                    <button class="btn-sm btn-details" onclick="viewEventDetails(${event.id})">
                        <i class="fas fa-info-circle"></i>
                        View Details
                    </button>
                    <button class="btn-sm btn-discussion" onclick="showDiscussionModal(${event.id})">
                        <i class="fas fa-comments"></i>
                        Discussion
                    </button>
                    ${isUpcoming ? `
                        <button class="btn-sm btn-unregister" onclick="unregisterFromEvent(${event.id}, '${event.title}')">
                            <i class="fas fa-times"></i>
                            Unregister
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

async function viewEventDetails(eventId) {
    try {
        const event = await api.events.getById(eventId);
        
        // Create a modal or redirect to event details
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${event.title}</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="event-detail-content">
                        ${event.image_url ? `
                            <div class="event-detail-image">
                                <img src="${event.image_url}" alt="${event.title}">
                            </div>
                        ` : ''}
                        
                        <div class="event-detail-info">
                            <div class="event-category">${event.category}</div>
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
                                    <a href="${utils.getGoogleMapsUrl(event.location)}" target="_blank">
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
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error('Error loading event details:', error);
        notifications.error('Failed to load event details');
    }
}

async function showDiscussionModal(eventId) {
    // Reuse the discussion modal from explore.js
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Discussion Forum</h2>
                <button class="close-modal" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="discussion-list" id="discussionList-${eventId}">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        Loading discussions...
                    </div>
                </div>
                <div class="discussion-form">
                    <textarea placeholder="Join the discussion..." id="discussionMessage-${eventId}"></textarea>
                    <button class="btn-primary" onclick="postDiscussion(${eventId})">
                        <i class="fas fa-paper-plane"></i>
                        Post
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load discussions
    await loadDiscussions(eventId);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function loadDiscussions(eventId) {
    const discussionList = document.getElementById(`discussionList-${eventId}`);
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

async function postDiscussion(eventId) {
    const messageInput = document.getElementById(`discussionMessage-${eventId}`);
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) {
        notifications.error('Please enter a message');
        return;
    }

    try {
        await api.events.postDiscussion(eventId, message);
        messageInput.value = '';
        await loadDiscussions(eventId);
        notifications.success('Message posted successfully');
    } catch (error) {
        console.error('Error posting discussion:', error);
        notifications.error('Failed to post message');
    }
}

async function unregisterFromEvent(eventId, eventTitle) {
    const confirmed = confirm(`Are you sure you want to unregister from "${eventTitle}"?`);
    if (!confirmed) return;

    try {
        await api.events.unregister(eventId);
        notifications.success('Successfully unregistered from the event');
        await loadRegisteredEvents();
    } catch (error) {
        console.error('Error unregistering from event:', error);
        notifications.error(error.message || 'Failed to unregister from event');
    }
}

// Make functions globally available
window.viewEventDetails = viewEventDetails;
window.showDiscussionModal = showDiscussionModal;
window.postDiscussion = postDiscussion;
window.unregisterFromEvent = unregisterFromEvent;
window.loadRegisteredEvents = loadRegisteredEvents;