// ===================================
// DOM Elements
// ===================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

// ===================================
// Navbar Scroll Effect
// ===================================
function handleScroll() {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Update active nav link based on scroll position
    updateActiveNavLink();
}

window.addEventListener('scroll', handleScroll);

// ===================================
// Mobile Navigation Toggle
// ===================================
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
});

// Close menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target) && navMenu.classList.contains('active')) {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ===================================
// Active Navigation Link
// ===================================
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 150;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ===================================
// Smooth Scroll for Navigation Links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// Scroll Animations (Intersection Observer)
// ===================================
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Animate skill bars when visible
            if (entry.target.classList.contains('skill-progress')) {
                entry.target.style.width = entry.target.style.getPropertyValue('--progress');
            }
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.project-card, .detail-card, .skill-category, .certification-card, .contact-card').forEach(el => {
    el.classList.add('animate-on-scroll');
    observer.observe(el);
});

// Observe skill progress bars
document.querySelectorAll('.skill-progress').forEach(el => {
    observer.observe(el);
});

// ===================================
// Typewriter Effect (Optional)
// ===================================
class Typewriter {
    constructor(element, words, delay = 2000) {
        this.element = element;
        this.words = words;
        this.delay = delay;
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.type();
    }
    
    type() {
        const currentWord = this.words[this.currentWordIndex];
        
        if (this.isDeleting) {
            this.currentCharIndex--;
            this.element.textContent = currentWord.substring(0, this.currentCharIndex);
        } else {
            this.currentCharIndex++;
            this.element.textContent = currentWord.substring(0, this.currentCharIndex);
        }
        
        let typeSpeed = this.isDeleting ? 50 : 100;
        
        if (!this.isDeleting && this.currentCharIndex === currentWord.length) {
            typeSpeed = this.delay;
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            this.isDeleting = false;
            this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
            typeSpeed = 500;
        }
        
        setTimeout(() => this.type(), typeSpeed);
    }
}

// Initialize typewriter if element exists
const typewriterElement = document.querySelector('.hero-role');
if (typewriterElement) {
    // Uncomment below to enable typewriter effect
    // const roles = ['Fullstack Developer', 'Software Engineer', 'UI/UX Designer'];
    // new Typewriter(typewriterElement, roles);
}

// ===================================
// Parallax Effect for Hero Stripes
// ===================================
window.addEventListener('scroll', () => {
    const stripes = document.querySelector('.hero-stripes');
    if (stripes) {
        const scrolled = window.scrollY;
        stripes.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Initial scroll check
    handleScroll();
    
    // Add loaded class to body for initial animations
    document.body.classList.add('loaded');
    
    console.log('Portfolio loaded successfully! 🚀');
});
