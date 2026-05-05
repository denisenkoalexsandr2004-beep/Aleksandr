const root = document.documentElement;
const revealItems = document.querySelectorAll(".reveal, .intro-grid article, .cards article, .timeline article, .faq-list article");

function updateProgress() {
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.round((window.scrollY / maxScroll) * 100) : 0;
  root.style.setProperty("--progress", Math.min(100, Math.max(0, progress)));
}

window.addEventListener("pointermove", (event) => {
  const x = (event.clientX / window.innerWidth - 0.5).toFixed(3);
  const y = (event.clientY / window.innerHeight - 0.5).toFixed(3);
  root.style.setProperty("--mx", x);
  root.style.setProperty("--my", y);
});

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  }
}, {
  threshold: 0.14,
});

for (const item of revealItems) {
  observer.observe(item);
}

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);
updateProgress();
