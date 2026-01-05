// My Events functionality

let currentFilter = 'all';
let myEvents = [];

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!utils.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initMyEvents();
});

async function initMyEvents() {
    try {
        // Load events
        await loadMyEvents();
        
        // Initialize filters
        initFilters();
        
        // Initialize modals
        initModals();
        
        // Update search functionality
        initSearch();
        
    } catch (error) {
        console.error('Error initializing my events:', error);
        notifications.error('Failed to load your events');
    }
}

async function loadMyEvents() {
    const loading = document.getElementById('loading');
    const eventsGrid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('emptyState');

    if (loading) loading.style.display = 'flex';
    if (eventsGrid) eventsGrid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
        myEvents = await api.user.getCreatedEvents();
        
        // Update stats
        updateStats(myEvents);
        
        // Display events
        displayEvents(filterEvents(myEvents));

    } catch (error) {
        console.error('Error loading events:', error);
        notifications.error('Failed to load your events');
        
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to load events</h3>
                    <p>Please try again later</p>
                    <button class="btn-primary" onclick="loadMyEvents()">Retry</button>
                </div>
            `;
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function updateStats(events) {
    const totalEventsElement = document.getElementById('totalEvents');
    const totalParticipantsElement = document.getElementById('totalParticipants');
    const upcomingEventsElement = document.getElementById('upcomingEvents');

    const totalEvents = events.length;
    const totalParticipants = events.reduce((sum, event) => sum + (event.participant_count || 0), 0);
    const upcomingEvents = events.filter(event => new Date(event.date) >= new Date()).length;

    if (totalEventsElement) {
        animateCounter(totalEventsElement, totalEvents);
    }
    if (totalParticipantsElement) {
        animateCounter(totalParticipantsElement, totalParticipants);
    }
    if (upcomingEventsElement) {
        animateCounter(upcomingEventsElement, upcomingEvents);
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
            displayEvents(filterEvents(myEvents));
        });
    });
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
        const debouncedSearch = utils.debounce(() => {
            displayEvents(filterEvents(myEvents));
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            displayEvents(filterEvents(myEvents));
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
    switch (currentFilter) {
        case 'upcoming':
            filtered = filtered.filter(event => new Date(event.date) >= now);
            break;
        case 'past':
            filtered = filtered.filter(event => new Date(event.date) < now);
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
    const isUpcoming = eventDate >= now;
    const isToday = eventDate.toDateString() === now.toDateString();
    
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
                        <span>${event.location}</span>
                    </div>
                    <div class="event-meta-item">
                        <i class="fas fa-users"></i>
                        <span class="participants-count">${event.participant_count || 0} registered</span>
                    </div>
                    ${event.is_paid ? `
                        <div class="event-meta-item">
                            <i class="fas fa-money-bill"></i>
                            <span>${utils.formatCurrency(event.price)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="event-actions">
                    <button class="btn-sm btn-edit" onclick="editEvent(${event.id})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn-sm btn-participants" onclick="viewParticipants(${event.id})">
                        <i class="fas fa-users"></i>
                        Participants
                    </button>
                    <button class="btn-sm btn-delete" onclick="deleteEvent(${event.id}, '${event.title}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function initModals() {
    const editModal = document.getElementById('editEventModal');
    const participantsModal = document.getElementById('participantsModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const closeParticipantsModal = document.getElementById('closeParticipantsModal');

    // Close modal handlers
    closeEditModal?.addEventListener('click', () => {
        editModal?.classList.remove('show');
    });

    closeParticipantsModal?.addEventListener('click', () => {
        participantsModal?.classList.remove('show');
    });

    // Close modals when clicking outside
    [editModal, participantsModal].forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });
}

async function editEvent(eventId) {
    const modal = document.getElementById('editEventModal');
    const modalBody = modal?.querySelector('.modal-body');
    
    if (!modal || !modalBody) return;

    try {
        const event = await api.events.getById(eventId);
        
        modalBody.innerHTML = `
            <form id="editEventForm">
                <input type="hidden" name="eventId" value="${event.id}">
                
                <div class="form-group">
                    <label for="editTitle">Event Title *</label>
                    <input type="text" id="editTitle" name="title" value="${event.title}" required>
                </div>
                
                <div class="form-group">
                    <label for="editDescription">Description *</label>
                    <textarea id="editDescription" name="description" rows="4" required>${event.description}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editCategory">Category *</label>
                        <select id="editCategory" name="category" required>
                            <option value="workshop" ${event.category === 'workshop' ? 'selected' : ''}>Workshop</option>
                            <option value="seminar" ${event.category === 'seminar' ? 'selected' : ''}>Seminar</option>
                            <option value="hackathon" ${event.category === 'hackathon' ? 'selected' : ''}>Hackathon</option>
                            <option value="conference" ${event.category === 'conference' ? 'selected' : ''}>Conference</option>
                            <option value="meetup" ${event.category === 'meetup' ? 'selected' : ''}>Meetup</option>
                            <option value="webinar" ${event.category === 'webinar' ? 'selected' : ''}>Webinar</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editLocation">Location *</label>
                        <input type="text" id="editLocation" name="location" value="${event.location}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editDate">Date *</label>
                        <input type="date" id="editDate" name="date" value="${event.date}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editTime">Time *</label>
                        <input type="time" id="editTime" name="time" value="${event.time}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editContactEmail">Contact Email *</label>
                        <input type="email" id="editContactEmail" name="contactEmail" value="${event.contact_email}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="editContactPhone">Contact Phone</label>
                        <input type="tel" id="editContactPhone" name="contactPhone" value="${event.contact_phone || ''}">
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('editEventModal').classList.remove('show')">
                        Cancel
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i>
                        Save Changes
                    </button>
                </div>
            </form>
        `;
        
        // Handle form submission
        const form = document.getElementById('editEventForm');
        form.addEventListener('submit', handleEditSubmit);
        
        modal.classList.add('show');
        
    } catch (error) {
        console.error('Error loading event for editing:', error);
        notifications.error('Failed to load event details');
    }
}

async function handleEditSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const eventId = form.querySelector('[name="eventId"]').value;
    
    // Show loading state
    setButtonLoading(submitButton, true);

    try {
        const formData = new FormData(form);
        
        await api.events.update(eventId, formData);
        
        notifications.success('Event updated successfully!');
        
        // Close modal
        document.getElementById('editEventModal').classList.remove('show');
        
        // Reload events
        await loadMyEvents();
        
    } catch (error) {
        console.error('Error updating event:', error);
        notifications.error(error.message || 'Failed to update event');
        setButtonLoading(submitButton, false);
    }
}

async function viewParticipants(eventId) {
    const modal = document.getElementById('participantsModal');
    const participantsList = document.getElementById('participantsList');
    
    if (!modal || !participantsList) return;

    // Show modal with loading state
    participantsList.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Loading participants...
        </div>
    `;
    modal.classList.add('show');

    try {
        // Fetch real participants from backend
        try {
            const response = await fetch(`/api/events/${eventId}/participants`, {
                headers: {
                    'Authorization': `Bearer ${utils.getToken()}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch participants');
            const participants = await response.json();

            if (!participants || participants.length === 0) {
                participantsList.innerHTML = `
                    <div class="participants-empty">
                        <i class="fas fa-users"></i>
                        <p>No participants yet</p>
                    </div>
                `;
            } else {
                participantsList.innerHTML = participants.map(participant => `
                    <div class="participant-item">
                        <div class="participant-avatar">
                            ${participant.username ? participant.username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div class="participant-info">
                            <h4>${participant.username || 'Unknown'}</h4>
                            <p>${participant.email || ''}</p>
                            <small>Registered: ${participant.registered_at ? utils.formatDate(participant.registered_at) : ''}</small>
                        </div>
                    </div>
                `).join('');
            }
        } catch(fetchError) {
            participantsList.innerHTML = `
                <div class="participants-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to load participants</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error loading participants:', error);
        participantsList.innerHTML = `
            <div class="participants-empty">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load participants</p>
            </div>
        `;
    }
}

async function deleteEvent(eventId, eventTitle) {
    const confirmed = confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
        await api.events.delete(eventId);
        notifications.success('Event deleted successfully');
        await loadMyEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        notifications.error(error.message || 'Failed to delete event');
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

// Make functions globally available
window.editEvent = editEvent;
window.viewParticipants = viewParticipants;
window.deleteEvent = deleteEvent;
window.loadMyEvents = loadMyEvents;