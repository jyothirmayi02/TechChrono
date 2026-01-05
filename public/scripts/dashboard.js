// Dashboard functionality

document.addEventListener('DOMContentLoaded', () => {
    // Profile dropdown toggle
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
    }

    // Check authentication
    if (!utils.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    initDashboard();

    // Add hover effects to action cards
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.action-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.action-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });

    // Add entrance animations for sections
    const sections = document.querySelectorAll('.welcome-section, .quick-actions, .my-created-events, .recent-activity');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });
});

async function initDashboard() {
    try {
        // Load user data and stats
        await loadUserStats();
        await loadRecentActivity();
        await loadCreatedEvents();
        
        // Update user name displays
        updateUserDisplays();
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        notifications.error('Failed to load dashboard data');
    }
}

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

async function loadUserStats() {
    try {
        // Load created events count
        const createdEvents = await api.user.getCreatedEvents();
        const createdCountElement = document.getElementById('createdCount');
        if (createdCountElement) {
            createdCountElement.textContent = createdEvents.length;
        }

        // Load registered events count
        const registeredEvents = await api.user.getRegisteredEvents();
        const registeredCountElement = document.getElementById('registeredCount');
        if (registeredCountElement) {
            registeredCountElement.textContent = registeredEvents.length;
        }

        // Add loading animation
        animateCounter('createdCount', createdEvents.length);
        animateCounter('registeredCount', registeredEvents.length);

    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

async function loadRecentActivity() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    try {
        // Get recent events and registrations
        const [createdEvents, registeredEvents] = await Promise.all([
            api.user.getCreatedEvents(),
            api.user.getRegisteredEvents()
        ]);

        // Combine and sort activities
        const activities = [];

        // Add created events
        createdEvents.slice(0, 3).forEach(event => {
            activities.push({
                type: 'created',
                title: `Created event "${event.title}"`,
                time: event.created_at,
                icon: 'fa-calendar-plus',
                color: 'var(--primary)'
            });
        });

        // Add registered events
        registeredEvents.slice(0, 3).forEach(event => {
            activities.push({
                type: 'registered',
                title: `Registered for "${event.title}"`,
                time: event.registered_at,
                icon: 'fa-ticket-alt',
                color: 'var(--secondary)'
            });
        });

        // Sort by time (most recent first)
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));

        // Display activities
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-activity">
                    <i class="fas fa-calendar"></i>
                    <p>No recent activity</p>
                </div>
            `;
        } else {
            activityList.innerHTML = activities.slice(0, 5).map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${activity.title}</h4>
                        <p>${getRelativeTime(activity.time)}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1500; // 1.5 seconds
    const frameRate = 1000 / 60; // 60 fps
    const totalFrames = Math.round(duration / frameRate);
    const increment = targetValue / totalFrames;
    let currentValue = 0;

    const counter = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(counter);
        }
        element.textContent = Math.ceil(currentValue);
    }, frameRate);
}

async function loadCreatedEvents() {
    const createdEventsList = document.getElementById('createdEventsList');
    if (!createdEventsList) return;

    try {
        const events = await api.user.getCreatedEvents();

        if (events.length === 0) {
            createdEventsList.innerHTML = '<div class="empty-state"><p>You have not created any events yet.</p></div>';
            return;
        }

        createdEventsList.innerHTML = events.map(event => `
            <div class="created-event-card">
                <div class="event-card-header">
                    <h4>${event.title}</h4>
                    <span class="participant-count"><i class="fas fa-users"></i> ${event.participant_count} registered</span>
                </div>
                <div class="participants-list">
                    <h5>Participants:</h5>
                    ${event.participants && event.participants.length > 0 
                        ? `<ul>${event.participants.map(p => `<li>${p.username}</li>`).join('')}</ul>`
                        : '<p>No one has registered yet.</p>'}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading created events:', error);
        createdEventsList.innerHTML = '<div class="error-state"><p>Could not load your created events.</p></div>';
    }
}

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) ago`;
    if (hours > 0) return `${hours} hour(s) ago`;
    if (minutes > 0) return `${minutes} minute(s) ago`;
    return `${seconds} second(s) ago`;
}

// Refresh dashboard data periodically
setInterval(async () => {
    try {
        await loadUserStats();
        await navigation.loadNotifications();
    } catch (error) {
        console.error('Error refreshing dashboard data:', error);
    }
}, 60000); // Refresh every minute