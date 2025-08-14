// === Slider ===
let slideIndex = 0;
const slides = document.querySelectorAll(".slide");
function showSlide() {
  slides.forEach((slide, i) => slide.classList.remove("active"));
  slides[slideIndex].classList.add("active");
  slideIndex = (slideIndex + 1) % slides.length;
}
setInterval(showSlide, 4000);

// === Daily Verse ===
fetch('verses.json')
  .then(res => res.json())
  .then(verses => {
    const verseEl = document.getElementById("verse");
    const dayIndex = (new Date().getDate() - 1) % verses.length;
    verseEl.textContent = verses[dayIndex];
  })
  .catch(() => document.getElementById("verse").textContent = "Unable to load today's verse.");

// === Event Cards ===
fetch('events.json')
  .then(res => res.json())
  .then(events => {
    const container = document.getElementById('event-list');
    container.innerHTML = '';
    events.forEach(event => {
      const div = document.createElement('div');
      div.className = 'event-card';
      div.innerHTML = `
        <h3>${event.title}</h3>
        <p>Date: ${event.date}</p>
        <div class="event-img">
          <img src="${event.image}" alt="${event.title}" />
        </div>`;
      container.appendChild(div);
    });
  });

// === Popup Announcement ===
const popup = document.getElementById('announcementPopup');
window.addEventListener('load', () => {
  setTimeout(() => popup.classList.add('show'), 1000);
});

document.querySelectorAll('.close-btn').forEach(btn => {
  btn.addEventListener('click', () => popup.classList.remove('show'));
});

// === Smooth Scroll for Navbar Links ===
document.querySelectorAll('.navbar a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    target.scrollIntoView({ behavior: 'smooth' });
  });
});
