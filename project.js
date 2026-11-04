const works = window.PORTFOLIO_WORKS || [];
const requestedId = new URLSearchParams(window.location.search).get('work') || '01';
const foundIndex = works.findIndex((item) => item.id === requestedId);
const currentIndex = foundIndex >= 0 ? foundIndex : 0;
const work = works[currentIndex];
const previousWork = works[(currentIndex - 1 + works.length) % works.length];
const nextWork = works[(currentIndex + 1) % works.length];
const galleryItems = work ? [{ src: work.cover, caption: '项目封面', alt: `${work.title}项目封面` }, ...work.images] : [];
let activeImage = 0;

const setText = (id, value) => {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
};

if (work) {
  document.title = `${work.title} · ${work.subtitle} | 主立红`;
  document.querySelector('meta[name="description"]').setAttribute('content', `${work.title}——${work.subtitle}，主立红设计作品详情。`);
  document.documentElement.style.setProperty('--project-accent', work.color);
  setText('project-number', work.id);
  setText('project-category', work.category);
  setText('project-year', work.year);
  setText('project-title', work.title);
  setText('project-subtitle', work.subtitle);
  setText('project-english', work.english);
  setText('project-intro', work.description);
  setText('project-fact', work.fact);
  setText('project-scope', work.scope);
  setText('project-cover-number', `${work.id} — 06`);
  setText('project-prev-title', previousWork.title);
  setText('project-next-title', nextWork.title);
  document.querySelector('#project-prev').href = `./project.html?work=${previousWork.id}`;
  document.querySelector('#project-next').href = `./project.html?work=${nextWork.id}`;
  const cover = document.querySelector('#project-cover');
  cover.src = work.cover;
  cover.alt = `${work.title}${work.subtitle}项目封面`;
  work.tags.forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    document.querySelector('#project-tags').appendChild(span);
  });
  work.images.forEach((image, index) => {
    const figure = document.createElement('figure');
    figure.className = 'gallery-item reveal';
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `放大查看：${image.caption}`);
    button.innerHTML = `<img src="${image.src}" alt="${image.alt}" width="${image.w}" height="${image.h}" loading="lazy"><span>CLICK TO ZOOM ＋</span>`;
    button.addEventListener('click', () => openLightbox(index + 1));
    const caption = document.createElement('figcaption');
    caption.innerHTML = `<span><strong>${image.caption}</strong><small>${image.label}</small></span><span>${String(index + 1).padStart(2, '0')} / ${String(work.images.length).padStart(2, '0')}</span>`;
    figure.append(button, caption);
    document.querySelector('#project-gallery').appendChild(figure);
  });
}

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
function renderLightbox() {
  const image = galleryItems[activeImage];
  lightboxImage.src = image.src;
  lightboxImage.alt = image.alt;
  lightboxCaption.textContent = `${image.caption} · ${activeImage + 1} / ${galleryItems.length}`;
}
function openLightbox(index) {
  activeImage = index;
  renderLightbox();
  lightbox.showModal();
}
document.querySelector('#project-cover-button').addEventListener('click', () => openLightbox(0));
document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.close());
document.querySelector('.lightbox-prev').addEventListener('click', () => {
  activeImage = (activeImage - 1 + galleryItems.length) % galleryItems.length;
  renderLightbox();
});
document.querySelector('.lightbox-next').addEventListener('click', () => {
  activeImage = (activeImage + 1) % galleryItems.length;
  renderLightbox();
});
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') document.querySelector('.lightbox-prev').click();
  if (event.key === 'ArrowRight') document.querySelector('.lightbox-next').click();
});

const backTop = document.querySelector('.back-top');
if (backTop) {
  const updateBackTop = () => backTop.classList.toggle('is-visible', window.scrollY > 140);
  updateBackTop();
  window.addEventListener('scroll', updateBackTop, { passive: true });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.06 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

function updateTime() {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date());
  document.querySelector('#local-time').textContent = `CN ${time}`;
}
updateTime();
setInterval(updateTime, 1000);
