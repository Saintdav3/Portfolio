/* ===== NAVBAR SCROLL ===== */
window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

/* ===== HERO PARTICLES ===== */
const canvas = document.getElementById('hero-canvas');
const ctx    = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x       = Math.random() * canvas.width;
        this.y       = Math.random() * canvas.height;
        this.size    = Math.random() * 1.4 + 0.3;
        this.speedX  = (Math.random() - 0.5) * 0.38;
        this.speedY  = (Math.random() - 0.5) * 0.38;
        this.opacity = Math.random() * 0.55 + 0.1;
        this.color   = Math.random() > 0.5 ? '153,69,255' : '20,241,149';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
        ctx.fill();
    }
}

const particles = Array.from({ length: 130 }, () => new Particle());

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const d  = Math.sqrt(dx * dx + dy * dy);
            if (d < 100) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(153,69,255,${0.07 * (1 - d / 100)})`;
                ctx.lineWidth   = 0.5;
                ctx.stroke();
            }
        }
    }
}

(function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animateParticles);
})();

/* ===== SCROLL REVEAL ===== */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
        .forEach(el => revealObserver.observe(el));

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el) {
    const target   = parseFloat(el.dataset.target);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const isFloat  = target % 1 !== 0;
    const start    = performance.now();
    const duration = 2000;

    (function tick(now) {
        const p    = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        const cur  = ease * target;
        let display;
        if      (target >= 1e9)  display = (cur / 1e9).toFixed(1) + 'B';
        else if (target >= 1e6)  display = (cur / 1e6).toFixed(1) + 'M';
        else if (target >= 1000) display = Math.floor(cur).toLocaleString();
        else if (isFloat)        display = cur.toFixed(1);
        else                     display = Math.floor(cur);
        el.textContent = prefix + display + suffix;
        if (p < 1) requestAnimationFrame(tick);
    })(start);
}

new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.querySelectorAll('[data-target]').forEach(animateCounter);
            _statsObs.unobserve(e.target);
        }
    });
}, { threshold: 0.3 }).observe(document.getElementById('stats'));
const _statsObs = new IntersectionObserver(() => {}, {});

/* ===== TOKENOMICS DONUT CHART ===== */
const chartCanvas  = document.getElementById('tokenomics-chart');
chartCanvas.width  = 280;
chartCanvas.height = 280;
const cCtx = chartCanvas.getContext('2d');
const cx = 140, cy = 140, outerR = 120, innerR = 75, gap = 0.045;

const segments = [
    { value: 40, color: '#9945FF' },
    { value: 25, color: '#14F195' },
    { value: 15, color: '#00C2FF' },
    { value: 12, color: '#FF6B6B' },
    { value: 8,  color: '#FFD700' },
];
const total = segments.reduce((s, d) => s + d.value, 0);

function drawDonut(progress) {
    cCtx.clearRect(0, 0, 280, 280);
    let angle = -Math.PI / 2;
    segments.forEach((seg, i) => {
        const sweep = (seg.value / total) * Math.PI * 2 * progress;
        const end   = angle + sweep - (i < segments.length - 1 ? gap : 0);
        cCtx.shadowColor = seg.color;
        cCtx.shadowBlur  = 14;
        cCtx.beginPath();
        cCtx.moveTo(cx, cy);
        cCtx.arc(cx, cy, outerR, angle, end);
        cCtx.closePath();
        cCtx.fillStyle = seg.color;
        cCtx.fill();
        cCtx.shadowBlur = 0;
        angle += sweep;
    });
    cCtx.beginPath();
    cCtx.arc(cx, cy, innerR, 0, Math.PI * 2);
    cCtx.fillStyle = '#060818';
    cCtx.fill();
    cCtx.beginPath();
    cCtx.arc(cx, cy, innerR, 0, Math.PI * 2);
    cCtx.strokeStyle = 'rgba(153,69,255,0.14)';
    cCtx.lineWidth   = 1;
    cCtx.stroke();
}

drawDonut(0);

new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            const t0 = performance.now();
            (function animate(now) {
                const prog = Math.min((now - t0) / 1200, 1);
                drawDonut(1 - Math.pow(1 - prog, 3));
                if (prog < 1) requestAnimationFrame(animate);
                else document.querySelectorAll('.token-bar-fill').forEach(b => b.classList.add('animated'));
            })(t0);
            _chartObs.unobserve(e.target);
        }
    });
}, { threshold: 0.3 }).observe(chartCanvas);
const _chartObs = new IntersectionObserver(() => {}, {});

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});
