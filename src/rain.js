// Front-end & UX design words — more of them, more visible
const words = [
  // Core tech
  'flexbox','grid','CSS','HTML','JS','DOM','API','fetch','async','await',
  'props','state','hook','render','event','class','module','import','export',
  'const','let','var','function','arrow','promise','callback','closure',
  'Tailwind','React','Vue','Vite','Node','NPM','webpack','babel','TypeScript',
  'ARIA','a11y','SEO','PWA','SSR','CSR','SPA','REST','JSON','WebGL',
  // UX & Design
  'UX','UI','Figma','wireframe','prototype','persona','journey','heuristic',
  'affordance','gestalt','hierarchy','contrast','alignment','proximity','balance',
  'kerning','leading','tracking','typeface','serif','sans-serif','weight',
  'usability','accessibility','inclusive','empathy','research','testing',
  'A/B test','card sort','sitemap','flow','user story','feedback','iterate',
  'color theory','whitespace','grid','rhythm','motion','micro-interaction',
  'responsive','mobile-first','breakpoint','viewport','pixel','rem','em','vw',
  'z-index','transform','transition','animation','keyframe','bezier','easing',
  'component','design system','token','variant','slot','portal','context',
  'Storybook','Figma','Zeplin','InVision','Sketch','Framer','Lottie','SVG',
  'shadow','depth','layer','blur','opacity','gradient','tint','shade','hue',
  'interaction','delight','feedback loop','affordance','signifier','mapping',
  'mental model','information architecture','content strategy','readability'
];

let drops = [];
const rand = (a, b) => a + Math.random() * (b - a);

function initDrops(canvas) {
  drops = [];
  // More columns = more words
  const cols = Math.floor(canvas.width / 60);
  for (let i = 0; i < cols; i++) {
    drops.push({
      x:       (i / cols) * canvas.width + rand(0, 50),
      y:       rand(-canvas.height, 20),
      speed:   rand(0.5, 1.4),
      word:    words[Math.floor(Math.random() * words.length)],
      // More opacity range — min 0.18 so words are always readable
      opacity: rand(0.18, 0.52),
      size:    rand(11, 16)
    });
  }
}

function getRainColor() {
  const light = window._rainColorLight;
  return light ? '80,30,160' : '196,181,253';
}

function drawRain(canvas, ctx) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const rgb = getRainColor();
  for (const d of drops) {
    ctx.font = `${d.size}px 'DM Mono', monospace`;
    ctx.fillStyle = `rgba(${rgb}, ${d.opacity})`;
    ctx.fillText(d.word, d.x, d.y);
    d.y += d.speed;
    if (d.y > canvas.height + 40) {
      d.y      = rand(-60, 0);
      d.x      = Math.random() * canvas.width;
      d.word   = words[Math.floor(Math.random() * words.length)];
      d.speed  = rand(0.5, 1.4);
      d.opacity= rand(0.18, 0.52);
    }
  }
  requestAnimationFrame(() => drawRain(canvas, ctx));
}

export const initRain = () => {
  const canvas = document.getElementById('rain');
  const ctx    = canvas.getContext('2d');
  const resize = () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    initDrops(canvas);
  };
  window.addEventListener('resize', resize);
  resize();
  drawRain(canvas, ctx);
};
