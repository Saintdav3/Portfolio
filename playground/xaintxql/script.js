const roles = ["Frontend Developer", "Backend Developer", "Full Stack Developer"];
const typedRole = document.querySelector("#typedRole");
const progress = document.querySelector(".scroll-progress");
const header = document.querySelector(".site-header");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const navPanel = document.querySelector("#navLinks");
const navToggle = document.querySelector(".nav-toggle");
const sections = [...document.querySelectorAll("main section[id]")];
const revealItems = [...document.querySelectorAll(".reveal")];
const counters = [...document.querySelectorAll(".counter")];
const skillCards = [...document.querySelectorAll(".skill-card")];
const magneticItems = [...document.querySelectorAll(".magnetic")];
const dot = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
const year = document.querySelector("#year");
const canvas = document.querySelector("#particleCanvas");
const ctx = canvas.getContext("2d");

year.textContent = new Date().getFullYear();

let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeRole() {
  const current = roles[roleIndex];
  typedRole.textContent = current.slice(0, charIndex);

  if (!deleting && charIndex < current.length) {
    charIndex += 1;
    setTimeout(typeRole, 70);
    return;
  }

  if (!deleting && charIndex === current.length) {
    deleting = true;
    setTimeout(typeRole, 1300);
    return;
  }

  if (deleting && charIndex > 0) {
    charIndex -= 1;
    setTimeout(typeRole, 38);
    return;
  }

  deleting = false;
  roleIndex = (roleIndex + 1) % roles.length;
  setTimeout(typeRole, 300);
}

typeRole();

function handleScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
  progress.style.width = `${percent}%`;
  header.classList.toggle("is-scrolled", window.scrollY > 24);

  let current = sections[0]?.id;
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 180) {
      current = section.id;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}

window.addEventListener("scroll", handleScroll, { passive: true });
handleScroll();

navToggle.addEventListener("click", () => {
  const isOpen = navPanel.classList.toggle("is-open");
  navToggle.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navPanel.classList.remove("is-open");
    navToggle.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.16, rootMargin: "0px 0px -50px 0px" });

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
  revealObserver.observe(item);
});

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.target);
    const duration = 1300;
    const start = performance.now();

    function update(now) {
      const progressValue = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progressValue, 3);
      element.textContent = Math.round(target * eased);
      if (progressValue < 1) requestAnimationFrame(update);
      else element.textContent = target;
    }

    requestAnimationFrame(update);
    counterObserver.unobserve(element);
  });
}, { threshold: 0.55 });

counters.forEach((counter) => counterObserver.observe(counter));

const skillObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const card = entry.target;
    const bar = card.querySelector(".progress span");
    bar.style.width = `${card.dataset.level}%`;
    skillObserver.unobserve(card);
  });
}, { threshold: 0.36 });

skillCards.forEach((card) => skillObserver.observe(card));

document.querySelectorAll(".skill-card, .project-card, .service-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `rotateX(${y * -8}deg) rotateY(${x * 10}deg) translateY(-8px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

window.addEventListener("pointermove", (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
});

function animateCursor() {
  ringX += (mouseX - ringX) * 0.18;
  ringY += (mouseY - ringY) * 0.18;
  ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
  requestAnimationFrame(animateCursor);
}

animateCursor();

magneticItems.forEach((item) => {
  item.addEventListener("pointerenter", () => ring.classList.add("is-hovering"));
  item.addEventListener("pointerleave", () => {
    ring.classList.remove("is-hovering");
    item.style.transform = "";
  });

  item.addEventListener("pointermove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    item.style.transform = `translate(${x * 0.16}px, ${y * 0.2}px)`;
  });
});

const track = document.querySelector("#testimonialTrack");
const prev = document.querySelector("#prevTestimonial");
const next = document.querySelector("#nextTestimonial");
let testimonialIndex = 0;
const testimonialCount = track.children.length;

function updateTestimonials() {
  track.style.transform = `translateX(-${testimonialIndex * 100}%)`;
}

prev.addEventListener("click", () => {
  testimonialIndex = (testimonialIndex - 1 + testimonialCount) % testimonialCount;
  updateTestimonials();
});

next.addEventListener("click", () => {
  testimonialIndex = (testimonialIndex + 1) % testimonialCount;
  updateTestimonials();
});

setInterval(() => {
  testimonialIndex = (testimonialIndex + 1) % testimonialCount;
  updateTestimonials();
}, 5200);

document.querySelector(".contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  const original = button.textContent;
  button.textContent = "Message Ready";
  setTimeout(() => {
    button.textContent = original;
    event.currentTarget.reset();
  }, 1500);
});

let particles = [];
let width = 0;
let height = 0;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.offsetWidth;
  height = canvas.offsetHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.max(38, Math.min(96, Math.floor(width / 18)));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.42,
    vy: (Math.random() - 0.5) * 0.42,
    r: Math.random() * 1.8 + 0.5
  }));
}

function drawParticles() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(56, 189, 248, 0.72)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.09)";

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();

    for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
      const next = particles[nextIndex];
      const dx = particle.x - next.x;
      const dy = particle.y - next.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 120) {
        ctx.globalAlpha = 1 - distance / 120;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  });

  if (!prefersReducedMotion) requestAnimationFrame(drawParticles);
}

resizeCanvas();
drawParticles();
window.addEventListener("resize", resizeCanvas);
