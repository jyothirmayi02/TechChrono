// Home page functionality

document.addEventListener('DOMContentLoaded', () => {
    // Initialize home page features
    initHeroAnimations();
    initFeatureHovers();
    initScrollEffects();
});

function initHeroAnimations() {
    // Add entrance animations for hero elements
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroActions = document.querySelector('.hero-actions');
    const heroGraphic = document.querySelector('.hero-graphic');

    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroTitle.style.transition = 'all 0.8s ease';
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 200);
    }

    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        heroSubtitle.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroSubtitle.style.transition = 'all 0.8s ease';
            heroSubtitle.style.opacity = '1';
            heroSubtitle.style.transform = 'translateY(0)';
        }, 400);
    }

    if (heroActions) {
        heroActions.style.opacity = '0';
        heroActions.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            heroActions.style.transition = 'all 0.8s ease';
            heroActions.style.opacity = '1';
            heroActions.style.transform = 'translateY(0)';
        }, 600);
    }

    if (heroGraphic) {
        heroGraphic.style.opacity = '0';
        heroGraphic.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            heroGraphic.style.transition = 'all 1s ease';
            heroGraphic.style.opacity = '1';
            heroGraphic.style.transform = 'scale(1)';
        }, 800);
    }
}

function initFeatureHovers() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach((card, index) => {
        // Stagger initial animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 1000 + (index * 200));

        // Enhanced hover effects
        card.addEventListener('mouseenter', () => {
            const icon = card.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', () => {
            const icon = card.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        });
    });
}

function initScrollEffects() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe sections for scroll animations
    const sections = document.querySelectorAll('.features, .cta');
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        observer.observe(section);
    });

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: all 0.8s ease !important;
        }
    `;
    document.head.appendChild(style);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroGraphic = document.querySelector('.hero-graphic');
    
    if (heroGraphic && scrolled < window.innerHeight) {
        const rate = scrolled * -0.5;
        heroGraphic.style.transform = `translateY(${rate}px)`;
    }
});

// Dynamic text animation for hero title
function initTypewriterEffect() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    const originalText = heroTitle.innerHTML;
    const words = ['Amazing', 'Exciting', 'Innovative', 'Inspiring'];
    let currentWordIndex = 0;

    function updateWord() {
        const newText = originalText.replace('Amazing', words[currentWordIndex]);
        heroTitle.innerHTML = newText;
        currentWordIndex = (currentWordIndex + 1) % words.length;
    }

    // Change word every 3 seconds
    setInterval(updateWord, 3000);
}

// Initialize typewriter effect after page load
setTimeout(initTypewriterEffect, 2000);