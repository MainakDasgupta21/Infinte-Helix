// Infinite Helix Demo Script.js

let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function nextSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % totalSlides;
    slides[currentSlide].classList.add('active');
}

function prevSlide() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    slides[currentSlide].classList.add('active');
}

// Auto-advance carousel every 8 seconds
setInterval(nextSlide, 8000);

// Smooth scroll
function scrollTo(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Mock Journal Analysis
function analyzeJournal() {
    const input = document.getElementById('journalInput');
    const result = document.getElementById('emotionResult');
    
    if (input.value.trim().length < 10) {
        alert('Please write at least 10 characters about your feelings 😊');
        return;
    }
    
    // Mock emotion detection
    const emotions = ['joy', 'sad', 'anger', 'fear', 'surprise'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const badge = result.querySelector('.emotion-badge');
    badge.textContent = randomEmotion.toUpperCase() + ' ' + (Math.floor(Math.random() * 20) + 80) + '%';
    badge.className = 'emotion-badge ' + randomEmotion;
    
    // Mock AI response
    const responses = {
        joy: '🌟 Wonderful to sense your joy! Let this positive energy flow into creative tasks today.',
        sad: '💙 Feeling down? That\'s okay. Take 3 deep breaths and hydrate - small steps help.',
        anger: '🔥 Frustration detected. 30-second stretch break suggested. You\'ve got this!',
        fear: '🫂 Anxiety noted. Confidence breath exercise in 2 minutes. You are capable.',
        surprise: '😲 Unexpected emotion! Journal more to understand - progress is happening.'
    };
    
    result.querySelector('.ai-response').textContent = responses[randomEmotion];
    result.style.display = 'block';
    
    input.style.borderColor = 'var(--accent)';
    result.scrollIntoView({ behavior: 'smooth' });
}

// Mock Nudge Generator
function generateNudge() {
    const result = document.getElementById('nudgeResult');
    
    const contexts = [
        { screen: '4h 12m', breaks: '2/6', meeting: '8min', nudge: '🧘‍♀️ Meeting in 8min. Take confidence breath now. Water nearby?' },
        { screen: '2h 45m', breaks: '5/5', meeting: '45min', nudge: '💧 Perfect breaks! Long screen session - hydrate and 1min stretch?' },
        { screen: '5h 30m', breaks: '1/6', meeting: 'none', nudge: '⏸️ Deep focus marathon! 5min walk nudge - legs need it 💜' },
        { screen: '1h 15m', breaks: '0/2', meeting: '22min', nudge: '🌿 Steady morning. Pre-meeting calm nudge: shoulders down, deep breath.' }
    ];
    
    const context = contexts[Math.floor(Math.random() * contexts.length)];
    
    document.getElementById('screenTime').textContent = context.screen;
    document.getElementById('breaks').textContent = context.breaks;
    document.getElementById('meeting').textContent = context.meeting;
    
    result.innerHTML = `<div class="nudge-card">${context.nudge}</div>`;
    result.classList.add('mock-active');
    
    setTimeout(() => result.classList.remove('mock-active'), 1000);
}

// Mock Dashboard API
function mockApi(endpoint) {
    const demos = {
        dashboard: {
            productivity: Math.floor(Math.random() * 20) + 75 + '%',
            screenTime: Math.floor(Math.random() * 3 + 2) + 'h ' + Math.floor(Math.random() * 60) + 'm',
            hydration: Math.floor(Math.random() * 4) + 4 + '/8'
        }
    };
    
    const data = demos[endpoint];
    if (data) {
        document.querySelector('.metric:nth-child(1) .value').textContent = data.productivity;
        document.querySelector('.metric:nth-child(2) .value').textContent = data.screenTime;
        document.querySelector('.metric:nth-child(3) .value').textContent = data.hydration;
        
        // Animate refresh
        document.querySelector('.dashboard-demo').classList.add('mock-active');
        setTimeout(() => document.querySelector('.dashboard-demo').classList.remove('mock-active'), 1000);
    }
}

// Particle background (subtle helix effect)
function createParticles() {
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 20 + 's';
        particle.style.animationDuration = (Math.random() * 20 + 20) + 's';
        document.body.appendChild(particle);
    }
}

// Intersection Observer for scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
});

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Init
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    mockApi('dashboard'); // Initial data
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Enter' && document.activeElement.tagName !== 'TEXTAREA') {
            analyzeJournal();
        }
    });
});

// Add helix CSS for particles
const helixCSS = `
.particle {
    position: fixed;
    top: -10px;
    width: 4px;
    height: 4px;
    background: radial-gradient(circle, var(--accent) 20%, transparent);
    border-radius: 50%;
    animation: helixFloat linear infinite;
    z-index: 0;
    pointer-events: none;
}

@keyframes helixFloat {
    0% { 
        transform: translateY(100vh) rotate(0deg); 
        opacity: 0;
    }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { 
        transform: translateY(-100px) rotate(720deg); 
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = helixCSS;
document.head.appendChild(style);

