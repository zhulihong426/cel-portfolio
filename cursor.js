const finePointer = window.matchMedia('(pointer: fine)').matches;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (finePointer && !reducedMotion) {
  document.documentElement.classList.add('has-custom-cursor');

  const ring = document.createElement('div');
  const dot = document.createElement('div');
  ring.className = 'cursor-ring';
  dot.className = 'cursor-dot';
  ring.setAttribute('aria-hidden', 'true');
  dot.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<i></i>';
  document.body.append(ring, dot);

  let targetX = -100;
  let targetY = -100;
  let ringX = -100;
  let ringY = -100;
  let visible = false;

  function animate() {
    ringX += (targetX - ringX) * 0.14;
    ringY += (targetY - ringY) * 0.14;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  }

  document.addEventListener('pointermove', (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
    const isLensArea = Boolean(event.target.closest('.visual-notes, .lens-dialog'));
    document.documentElement.classList.toggle('cursor-lens', isLensArea);
    ring.classList.toggle('is-hovering', Boolean(event.target.closest('a, button, summary, [role="button"]')));
    if (!visible) {
      visible = true;
      ringX = targetX;
      ringY = targetY;
      ring.classList.add('is-visible');
      dot.classList.add('is-visible');
    }
  }, { passive: true });

  document.addEventListener('pointerdown', () => ring.classList.add('is-pressed'));
  document.addEventListener('pointerup', () => ring.classList.remove('is-pressed'));
  document.documentElement.addEventListener('mouseleave', () => {
    ring.classList.remove('is-visible');
    dot.classList.remove('is-visible');
    visible = false;
  });
  window.addEventListener('blur', () => {
    ring.classList.remove('is-visible', 'is-pressed');
    dot.classList.remove('is-visible');
    visible = false;
  });

  animate();
}
