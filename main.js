const works = window.PORTFOLIO_WORKS || [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const documentRoot = document.documentElement;
const workList = document.querySelector('#work-list');
const previewImage = document.querySelector('#preview-image');
const previewLink = document.querySelector('#preview-link');
const previewTitle = document.querySelector('#preview-title');
const previewNumber = document.querySelector('#preview-number');
const previewCategory = document.querySelector('#preview-category');
let previewTimer;

function selectWork(index) {
  const work = works[index];
  if (!work || previewNumber.textContent.startsWith(work.id)) return;
  document.querySelectorAll('.work-row').forEach((row, rowIndex) => {
    row.classList.toggle('is-active', rowIndex === index);
    row.setAttribute('aria-current', rowIndex === index ? 'true' : 'false');
  });
  clearTimeout(previewTimer);
  previewLink.classList.add('is-changing');
  previewTimer = setTimeout(() => {
    previewImage.src = work.cover;
    previewImage.alt = `${work.title}${work.subtitle}主图预览`;
    previewLink.href = `./project.html?work=${work.id}`;
    previewLink.setAttribute('aria-label', `查看${work.title}作品详情`);
    previewTitle.textContent = work.title;
    previewNumber.textContent = `${work.id} / ${String(works.length).padStart(2, '0')}`;
    previewCategory.textContent = work.category;
    previewLink.classList.remove('is-changing');
  }, reducedMotion ? 0 : 140);
}

works.forEach((work, index) => {
  const row = document.createElement('a');
  row.className = `work-row reveal${index === 0 ? ' is-active' : ''}`;
  row.href = `./project.html?work=${work.id}`;
  row.setAttribute('aria-current', index === 0 ? 'true' : 'false');
  row.innerHTML = `
    <span class="work-index">${work.id}.</span>
    <span class="work-info"><strong>${work.title}</strong><small>${work.subtitle} / ${work.category}</small></span>
    <span class="work-category">${work.category}</span>
    <span class="work-year">/${work.year}</span>
    <span class="work-arrow" aria-hidden="true">↗</span>
    <span class="work-mobile-image"><img src="${work.cover}" alt="${work.title}主图" loading="lazy"></span>`;
  row.addEventListener('mouseenter', () => selectWork(index));
  row.addEventListener('focus', () => selectWork(index));
  workList.appendChild(row);
});

const loader = document.querySelector('.loader');
const loaderCount = document.querySelector('#loader-count');
const loaderProgress = document.querySelector('#loader-progress');
const loadDuration = reducedMotion ? 50 : 950;
const loadStart = performance.now();
function updateLoader(now) {
  const progress = Math.min((now - loadStart) / loadDuration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const percent = `${Math.round(eased * 100)}%`;
  loaderCount.textContent = percent;
  if (loaderProgress) loaderProgress.textContent = percent;
  if (progress < 1) {
    requestAnimationFrame(updateLoader);
  } else {
    loader.classList.add('is-finished');
    document.body.classList.remove('is-loading');
    if (documentRoot.classList.contains('hero-locked')) window.scrollTo(0, 0);
    setTimeout(() => loader.remove(), 850);
  }
}
requestAnimationFrame(updateLoader);

function updateTime() {
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: true
  }).format(new Date());
  const timeElement = document.querySelector('#local-time');
  if (timeElement) timeElement.textContent = `CN ${time}`;
}
updateTime();
setInterval(updateTime, 1000);

const heroScroll = document.querySelector('.hero-scroll');
heroScroll.addEventListener('click', (event) => {
  event.preventDefault();
  documentRoot.classList.remove('hero-locked');
  document.querySelector('#about').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
});
document.querySelectorAll('.page-tabs a, .hero-callout, .main-nav a').forEach((link) => {
  link.addEventListener('click', () => documentRoot.classList.remove('hero-locked'));
});

document.querySelectorAll('.about-cards .card').forEach((card) => {
  const toggle = () => card.classList.toggle('flipped');
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); }
  });
});

const pageTabs = document.querySelector('.page-tabs');
if (pageTabs) {
  const updatePageTabs = () => pageTabs.classList.toggle('is-hero-hidden', window.scrollY < window.innerHeight * 0.6);
  updatePageTabs();
  window.addEventListener('scroll', updatePageTabs, { passive: true });
}

const backTop = document.querySelector('.back-top');
if (backTop) {
  const updateBackTop = () => backTop.classList.toggle('is-visible', window.scrollY > 140);
  updateBackTop();
  window.addEventListener('scroll', updateBackTop, { passive: true });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
}
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
function closeMenu() {
  nav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('is-open', !open);
  document.body.style.overflow = open ? '' : 'hidden';
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu();
});

const visualWorks = [
  { src: 'assets/img/extracted/visual-01-bridge.jpg', title: '夜色 · 桥与倒影', label: 'NIGHT BRIDGE', category: 'PHOTOGRAPHY', year: '2025', w: 1237, h: 2200, description: '夜色中的铁路桥，灯光与水面倒影形成对称的节奏。', alt: '夜色中的铁路桥与水面倒影摄影' },
  { src: 'assets/img/extracted/visual-02-sunset.jpg', title: '桥畔 · 落日', label: 'SUNDOWN', category: 'PHOTOGRAPHY', year: '2025', w: 1440, h: 2172, description: '松花江畔的黄昏，桥体与落日共同构成画面重心。', alt: '桥畔黄昏与落日摄影' },
  { src: 'assets/img/extracted/visual-03-wintersweet.jpg', title: '花影 · 古建新春', label: 'WINTERSWEET', category: 'PHOTOGRAPHY', year: '2025', w: 1080, h: 1920, description: '古建檐角与蜡梅，传统色彩在冬日光线中形成对照。', alt: '古建筑旁的蜡梅摄影' },
  { src: 'assets/img/extracted/visual-04-ship.jpg', title: '航行 · 海天一色', label: 'AT SEA', category: 'PHOTOGRAPHY', year: '2025', w: 1279, h: 1706, description: '海面、货轮与远处工业岸线，记录航行中的开阔视野。', alt: '海面上的货轮与工业岸线摄影' },
  { src: 'assets/img/extracted/visual-05-chongqing.jpg', title: '山城 · 重庆', label: 'CHONGQING', category: 'CITY POSTER', year: '2024', w: 1555, h: 2200, description: '以重庆的城市层次为题，将传统建筑与当代天际线叠合。', alt: '重庆城市旅行海报' },
  { src: 'assets/img/extracted/visual-06-kashgar.jpg', title: '大美新疆 · 喀什', label: 'KASHGAR', category: 'CITY POSTER', year: '2024', w: 1555, h: 2200, description: '喀什古城与昆仑塔，几何框架中的城市旅行叙事。', alt: '大美新疆喀什城市旅行海报' },
  { src: 'assets/img/extracted/visual-07-towers.jpg', title: '双城地标', label: 'TWO TOWERS', category: 'CITY POSTER', year: '2024', w: 1555, h: 2200, description: '哈尔滨龙塔与东方明珠并置，讨论两座城市的地标记忆。', alt: '哈尔滨龙塔与上海东方明珠城市海报' },
  { src: 'assets/img/extracted/visual-08-singer.jpg', title: '艺苑好声音', label: 'CAMPUS SINGER', category: 'EVENT POSTER', year: '2024', w: 762, h: 2000, description: '校园十佳歌手大赛主视觉，以明快色彩和人物插画构成。', alt: '艺苑好声音校园歌手大赛海报' },
  { src: 'assets/img/extracted/visual-09-race.jpg', title: '燃动青春', label: 'TEAM CHALLENGE', category: 'EVENT POSTER', year: '2025', w: 900, h: 383, description: '多人多足挑战赛海报，用运动场景与暖色块组织信息。', alt: '燃动青春多人多足挑战赛海报' }
];

const visualGrid = document.querySelector('#visual-grid');
const lensDialog = document.querySelector('#lens-dialog');
const lensImage = document.querySelector('#lens-image');
const lensCategory = document.querySelector('#lens-category');
const lensTitle = document.querySelector('#lens-title');
const lensDescription = document.querySelector('#lens-description');
const lensCounter = document.querySelector('#lens-counter');
let activeVisual = 0;

function renderLens(index) {
  activeVisual = (index + visualWorks.length) % visualWorks.length;
  const item = visualWorks[activeVisual];
  lensImage.src = item.src;
  lensImage.alt = item.alt;
  lensCategory.textContent = item.category;
  lensTitle.textContent = item.title;
  lensDescription.textContent = item.description;
  lensCounter.textContent = `${String(activeVisual + 1).padStart(2, '0')} / ${String(visualWorks.length).padStart(2, '0')} · USE ← → KEYS`;
}

function mountLensCursor(inDialog) {
  const cursorRing = document.querySelector('.cursor-ring');
  const cursorDot = document.querySelector('.cursor-dot');
  if (!cursorRing || !cursorDot) return;
  const target = inDialog ? lensDialog : document.body;
  target.append(cursorRing, cursorDot);
}

function openLens(index) {
  renderLens(index);
  document.body.classList.add('lens-open');
  documentRoot.classList.add('cursor-lens');
  lensDialog.showModal();
  mountLensCursor(true);
}

function createVisualCard(item, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'visual-card';
  card.dataset.workIndex = String(index);
  card.setAttribute('aria-label', `查看作品：${item.title}`);
  card.innerHTML = `<span class="visual-folder"><span class="visual-card-image"><img src="${item.src}" alt="${item.alt}" width="${item.w}" height="${item.h}" loading="lazy"></span></span><span class="visual-card-meta"><span>${String(index + 1).padStart(2, '0')} / ${item.label}</span><span>${item.year}</span></span><span class="visual-card-title">${item.title}</span>`;
  card.addEventListener('click', () => openLens(index));
  return card;
}

const visualSection = document.querySelector('#visual-notes');
const visualThemeObserver = new IntersectionObserver(([entry]) => {
  if (entry.intersectionRatio >= 0.32) {
    visualSection.classList.add('is-dark');
  } else if (entry.intersectionRatio < 0.15) {
    visualSection.classList.remove('is-dark');
  }
}, { threshold: [0, 0.15, 0.32, 0.6] });
visualThemeObserver.observe(visualSection);

const visualRow = document.createElement('div');
visualRow.className = 'visual-row';
const visualTrack = document.createElement('div');
visualTrack.className = 'visual-track';
visualWorks.forEach((item, index) => visualTrack.append(createVisualCard(item, index)));
visualRow.appendChild(visualTrack);
visualGrid.appendChild(visualRow);

if (!reducedMotion) {
  let visualOffset = 0;
  let visualPaused = false;
  let lastFrameTime = performance.now();

  const pauseVisual = () => { visualPaused = true; };
  const resumeVisual = () => { visualPaused = false; };
  visualTrack.addEventListener('mouseenter', pauseVisual);
  visualTrack.addEventListener('mouseleave', resumeVisual);
  visualTrack.addEventListener('focusin', pauseVisual);
  visualTrack.addEventListener('focusout', resumeVisual);

  const slideVisual = (now) => {
    const delta = Math.min(now - lastFrameTime, 50);
    lastFrameTime = now;
    if (!visualPaused) {
      visualOffset -= delta * 0.03;
      const firstCard = visualTrack.firstElementChild;
      if (firstCard) {
        const cardGap = Number.parseFloat(getComputedStyle(visualTrack).columnGap) || 0;
        const cardStep = firstCard.getBoundingClientRect().width + cardGap;
        if (cardStep > 0 && visualOffset <= -cardStep) {
          visualOffset += cardStep;
          visualTrack.appendChild(firstCard);
        }
      }
      visualTrack.style.transform = `translate3d(${visualOffset}px, 0, 0)`;
    }
    requestAnimationFrame(slideVisual);
  };
  requestAnimationFrame(slideVisual);
}

document.querySelector('#lens-close').addEventListener('click', () => lensDialog.close());
document.querySelector('#lens-prev').addEventListener('click', () => renderLens(activeVisual - 1));
document.querySelector('#lens-next').addEventListener('click', () => renderLens(activeVisual + 1));
document.querySelector('#lens-next-frame').addEventListener('click', () => renderLens(activeVisual + 1));
lensDialog.addEventListener('click', (event) => {
  if (event.target === lensDialog) lensDialog.close();
});
lensDialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); renderLens(activeVisual - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); renderLens(activeVisual + 1); }
});
lensDialog.addEventListener('close', () => {
  document.body.classList.remove('lens-open');
  mountLensCursor(false);
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.07, rootMargin: '0px 0px -25px' });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const navSections = ['about', 'works', 'visual-notes', 'experience', 'contact'];
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.page-tabs a, .main-nav a').forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-30% 0px -60% 0px' });
navSections.forEach((id) => navObserver.observe(document.getElementById(id)));

const toast = document.querySelector('.toast');
let toastTimer;
document.querySelector('[data-copy]').addEventListener('click', async (event) => {
  try {
    await navigator.clipboard.writeText(event.currentTarget.dataset.copy);
    toast.textContent = '邮箱已复制，可以去粘贴了';
  } catch {
    toast.textContent = '邮箱：2823979989@qq.com';
  }
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
});
