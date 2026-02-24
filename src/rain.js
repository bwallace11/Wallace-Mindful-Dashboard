const words = [
  'flexbox', 'grid', 'CSS', 'HTML', 'JS', 'DOM', 'API', 'fetch', 'async', 'await',
  'props', 'state', 'hook', 'render', 'event', 'class', 'module', 'import', 'export',
  'const', 'let', 'var', 'function', 'arrow', 'promise', 'callback', 'closure',
  'Tailwind', 'React', 'Vue', 'Vite', 'Node', 'NPM', 'webpack', 'babel', 'TypeScript',
  'ARIA', 'a11y', 'SEO', 'PWA', 'SSR', 'CSR', 'SPA', 'REST', 'JSON', 'localStorage',
  'viewport', 'media', 'query', 'selector', 'pseudo', 'cascade', 'specificity',
  'z-index', 'transform', 'transition', 'animation', 'keyframe', 'bezier',
  'responsive', 'mobile', 'semantic', 'component', 'slot', 'portal', 'context'
];

let drops = [];

const rand = (min, max) => min + Math.random() * (max - min);

const initDrops = (canvas) => {
  drops = [];
  const cols = Math.floor(canvas.width / 90);
  for (let i = 0; i < cols; i++) {
    drops.push({
      x: (i / cols) * canvas.width + Math.random() * 60,
      y: rand(-canvas.height, 0),
      speed: rand(0.6, 1.6),
      word: words[Math.floor(Math.random() * words.length)],
      opacity: rand(0.1, 0.45),
      size: rand(10, 16)
    });
  }
};

const drawRain = (canvas, ctx) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const d of drops) {
    ctx.font = `${d.size}px 'DM Mono', monospace`;
    ctx.fillStyle = `rgba(196, 181, 253, ${d.opacity})`;
    ctx.fillText(d.word, d.x, d.y);
    d.y += d.speed;

    if (d.y > canvas.height + 40) {
      d.y = -30;
      d.x = Math.random() * canvas.width;
      d.word = words[Math.floor(Math.random() * words.length)];
      d.speed = rand(0.6, 1.6);
      d.opacity = rand(0.1, 0.45);
    }
  }

  requestAnimationFrame(() => drawRain(canvas, ctx));
};

export const initRain = () => {
  const canvas = document.getElementById('rain');
  const ctx = canvas.getContext('2d');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initDrops(canvas);
  };

  window.addEventListener('resize', resize);
  resize();
  drawRain(canvas, ctx);
};
