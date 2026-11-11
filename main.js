import { validateAvatar } from 'open-bot-avatar';
import { mountAvatar } from 'open-bot-avatar/dom';

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
// 首屏关键资源预加载：加载进度与真实下载绑定，100% 即完整呈现
const preloadSources = ['assets/img/hero-island.png'];
let loadedCount = 0;
preloadSources.forEach((src) => {
  const image = new Image();
  image.onload = image.onerror = () => { loadedCount += 1; };
  image.src = src;
});
const resourceRatio = () => (preloadSources.length ? loadedCount / preloadSources.length : 1);
const loadDeadline = loadStart + 9000; // 网络异常时最多等 9 秒，避免永远卡住
function updateLoader(now) {
  const timeProgress = Math.min((now - loadStart) / loadDuration, 1);
  const resourceProgress = now >= loadDeadline ? 1 : resourceRatio();
  const progress = Math.min(timeProgress, resourceProgress);
  const eased = 1 - Math.pow(1 - progress, 3);
  const percent = `${Math.round(eased * 100)}%`;
  loaderCount.textContent = percent;
  if (loaderProgress) loaderProgress.textContent = percent;
  if (timeProgress < 1 || resourceProgress < 1) {
    requestAnimationFrame(updateLoader);
  } else {
    loader.classList.add('is-finished');
    document.body.classList.remove('is-loading');
    if (documentRoot.classList.contains('hero-locked')) window.scrollTo(0, 0);
    startHeroTypewriter();
    setTimeout(() => loader.remove(), 850);
  }
}

// 首屏标题打字机动效：300ms 延迟启动，45ms/字，竖条光标完成后保留
const heroTitle = document.querySelector('#hero-title');
function startHeroTypewriter() {
  if (!heroTitle || reducedMotion) return;
  const fullText = heroTitle.textContent.trim();
  if (!fullText) return;
  let index = 0;
  heroTitle.textContent = '';
  heroTitle.classList.add('is-typing');
  const typeNext = () => {
    index += 1;
    heroTitle.textContent = fullText.slice(0, index);
    if (index < fullText.length) {
      setTimeout(typeNext, 45);
    } else {
      heroTitle.classList.remove('is-typing');
      heroTitle.classList.add('is-typed');
    }
  };
  setTimeout(typeNext, 300);
}

// 灯泡头像：open-bot-avatar 官方渲染器（内置自动眨眼、待机浮动、体积与眼神跟随）
const BULB_OFF = '#4a4a4a';
const BULB_ON = '#fdf3c7';
let botInstance = null;
let bulbLit = false;
let currentBulb = null;
let colorFrame = null;
const hexRgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
async function mountBot() {
  const host = document.querySelector('#monkey-avatar');
  if (!host || host.dataset.ready) return;
  let spec = null;
  try {
    spec = await fetch('./assets/data/lightbulb.json').then((response) => response.json());
  } catch (error) {
    return;
  }
  const validated = validateAvatar(spec);
  if (!validated.ok) return;
  const definition = validated.value;
  definition.eyes.scale = 0.9;
  host.dataset.ready = 'true';
  botInstance = mountAvatar(host, {
    definition,
    color: bulbLit ? BULB_ON : BULB_OFF,
    mood: 'happy',
    followPointer: true,
    depth: 6,
    label: '眼睛跟随鼠标的灯泡头像',
  });
  currentBulb = hexRgb(bulbLit ? BULB_ON : BULB_OFF);
}
// 点击灯泡：开灯（暖黄 + 光晕 + 页面转黑）/ 关灯（暗灰 + 页面转白），可反复切换
const bulbHost = document.querySelector('#monkey-avatar');
const bulbFigure = document.querySelector('.intro-monkey');
function tweenBulbColor(targetHex) {
  cancelAnimationFrame(colorFrame);
  const from = currentBulb.slice();
  const to = hexRgb(targetHex);
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 600, 1);
    const eased = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    currentBulb = from.map((v, i) => v + (to[i] - v) * eased);
    if (botInstance) botInstance.update({ color: `rgb(${currentBulb.map((v) => Math.round(v)).join(', ')})` });
    if (t < 1) colorFrame = requestAnimationFrame(step);
  };
  colorFrame = requestAnimationFrame(step);
}
function toggleBulb() {
  bulbLit = !bulbLit;
  documentRoot.classList.toggle('lights-on', bulbLit);
  if (bulbFigure) {
    bulbFigure.classList.toggle('is-lit', bulbLit);
    bulbFigure.setAttribute('aria-pressed', String(bulbLit));
  }
  if (currentBulb) tweenBulbColor(bulbLit ? BULB_ON : BULB_OFF);
}
if (bulbHost && bulbFigure) {
  bulbFigure.setAttribute('role', 'button');
  bulbFigure.setAttribute('tabindex', '0');
  bulbFigure.setAttribute('aria-pressed', 'false');
  bulbFigure.setAttribute('aria-label', '开灯 / 关灯');
  bulbHost.addEventListener('click', toggleBulb);
  bulbFigure.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleBulb();
    }
  });
}
mountBot();
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
if (menuButton && nav) {
  const closeMenu = () => {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
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
}

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

let activeTrigger = null;
let lensMorphing = false;

function getMorphPoints() {
  const fromElement = activeTrigger?.querySelector('img') || activeTrigger;
  if (!fromElement) return null;
  const from = fromElement.getBoundingClientRect();
  const to = lensDialog.getBoundingClientRect();
  if (!from.width || !to.width) return null;
  return {
    dx: from.left + from.width / 2 - (to.left + to.width / 2),
    dy: from.top + from.height / 2 - (to.top + to.height / 2),
    sx: Math.max(from.width / to.width, 0.04),
    sy: Math.max(from.height / to.height, 0.04)
  };
}

function openLens(index, trigger) {
  if (lensMorphing) return;
  renderLens(index);
  activeTrigger = trigger || null;
  document.body.classList.add('lens-open');
  documentRoot.classList.add('cursor-lens');
  lensDialog.showModal();
  mountLensCursor(true);
  if (reducedMotion || !activeTrigger) return;
  const points = getMorphPoints();
  if (!points) return;
  lensMorphing = true;
  lensDialog.classList.add('is-morphing');
  const animation = lensDialog.animate([
    { transform: `translate(${points.dx}px, ${points.dy}px) scale(${points.sx}, ${points.sy})` },
    { transform: 'translate(0px, 0px) scale(1, 1)' }
  ], { duration: 420, easing: 'cubic-bezier(.32,.72,0,1)' });
  animation.finished.then(() => {
    lensDialog.classList.remove('is-morphing');
    lensMorphing = false;
  }).catch(() => {
    lensDialog.classList.remove('is-morphing');
    lensMorphing = false;
  });
}

function closeLens() {
  if (lensMorphing) return;
  if (reducedMotion || !activeTrigger) {
    lensDialog.close();
    return;
  }
  const points = getMorphPoints();
  if (!points) {
    lensDialog.close();
    return;
  }
  lensMorphing = true;
  lensDialog.classList.add('is-morphing');
  const animation = lensDialog.animate([
    { transform: 'translate(0px, 0px) scale(1, 1)' },
    { transform: `translate(${points.dx}px, ${points.dy}px) scale(${points.sx}, ${points.sy})` }
  ], { duration: 340, easing: 'cubic-bezier(.32,.72,0,1)' });
  animation.finished.then(() => {
    lensDialog.close();
    lensDialog.getAnimations().forEach((item) => item.cancel());
    lensDialog.classList.remove('is-morphing');
    lensMorphing = false;
  }).catch(() => {
    lensDialog.close();
    lensDialog.classList.remove('is-morphing');
    lensMorphing = false;
  });
}

function createVisualCard(item, index) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'visual-card';
  card.dataset.workIndex = String(index);
  card.setAttribute('aria-label', `查看作品：${item.title}`);
  card.innerHTML = `<span class="visual-folder"><span class="visual-card-image"><img src="${item.src}" alt="${item.alt}" width="${item.w}" height="${item.h}" loading="lazy"></span></span><span class="visual-card-meta"><span>${String(index + 1).padStart(2, '0')} / ${item.label}</span><span>${item.year}</span></span><span class="visual-card-title">${item.title}</span>`;
  card.addEventListener('click', () => openLens(index, card));
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
  // InfiniteSlider 行为：基础速度 40px/s，悬停平滑降速至 20px/s，不停止滚动
  const sliderSpeed = 40;
  const sliderHoverSpeed = 20;
  let visualOffset = 0;
  let visualVelocity = sliderSpeed;
  let visualTarget = sliderSpeed;
  let visualHovering = false;
  let visualFocused = false;
  let lastFrameTime = performance.now();

  const updateSliderTarget = () => {
    visualTarget = visualFocused ? 0 : visualHovering ? sliderHoverSpeed : sliderSpeed;
  };
  visualTrack.addEventListener('mouseenter', () => { visualHovering = true; updateSliderTarget(); });
  visualTrack.addEventListener('mouseleave', () => { visualHovering = false; updateSliderTarget(); });
  visualTrack.addEventListener('focusin', () => { visualFocused = true; updateSliderTarget(); });
  visualTrack.addEventListener('focusout', () => { visualFocused = false; updateSliderTarget(); });

  const slideVisual = (now) => {
    const delta = Math.min(now - lastFrameTime, 50);
    lastFrameTime = now;
    // 速度弹簧：目标速度变化时平滑过渡，模拟 useSpring 的缓入缓出
    visualVelocity += (visualTarget - visualVelocity) * Math.min(delta / 180, 1);
    visualOffset -= visualVelocity * (delta / 1000);
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
    requestAnimationFrame(slideVisual);
  };
  requestAnimationFrame(slideVisual);
}

document.querySelector('#lens-close').addEventListener('click', closeLens);
document.querySelector('#lens-next-frame').addEventListener('click', () => renderLens(activeVisual + 1));
lensDialog.addEventListener('click', (event) => {
  if (event.target === lensDialog) closeLens();
});
lensDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeLens();
});
lensDialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); renderLens(activeVisual - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); renderLens(activeVisual + 1); }
});
lensDialog.addEventListener('close', () => {
  document.body.classList.remove('lens-open');
  mountLensCursor(false);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, { threshold: 0, rootMargin: '0px 0px -350px 0px' });
document.querySelectorAll('.reveal:not(.work-row)').forEach((element) => revealObserver.observe(element));

// 作品目录整组快速进场：列表进入视口后按 70ms 间隔依次浮现，约 0.6s 全部完成
const workRows = [...document.querySelectorAll('.work-row')];
const workListEl = document.querySelector('.work-list');
if (workListEl && workRows.length) {
  const workListObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        workRows.forEach((row, index) => {
          row.style.transitionDelay = `${index * 70}ms`;
          row.classList.add('is-visible');
        });
      } else {
        workRows.forEach((row) => {
          row.style.transitionDelay = '0ms';
          row.classList.remove('is-visible');
        });
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });
  workListObserver.observe(workListEl);
}

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
