const demo = document.querySelector('#demo');
const replay = demo.querySelector('.demo-replay');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let animations = [];

function play() {
  animations.forEach(animation => animation.cancel());
  animations = [];
  if (reduced.matches) return;

  const selected = demo.querySelector('input:checked');
  const panel = demo.querySelector('.' + selected.id);
  const cards = panel.querySelectorAll('.prompt, .run li');
  animations = Array.from(cards, (card, index) => card.animate([
    { opacity: 0, transform: 'translate3d(12px, 14px, -36px) rotateX(-9deg)' },
    { opacity: 1, transform: 'none' },
  ], {
    delay: index * 115,
    duration: 440,
    easing: 'cubic-bezier(.23, 1, .32, 1)',
    fill: 'backwards',
  }));
}

function updatePreference() {
  replay.hidden = reduced.matches;
  if (reduced.matches) play();
}

const entrance = new IntersectionObserver(([entry], observer) => {
  if (!entry.isIntersecting) return;
  observer.disconnect();
  play();
}, { threshold: 0.45 });

replay.addEventListener('click', () => {
  entrance.disconnect();
  play();
});
demo.addEventListener('change', () => {
  entrance.disconnect();
  animations.forEach(animation => animation.cancel());
  animations = [];
});
reduced.addEventListener('change', updatePreference);
updatePreference();
entrance.observe(demo.querySelector('.scenarios'));
