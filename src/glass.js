/* ═══════════════════════════════════════════════════
   WEBGL LIQUID GLASS SHADER
   Renders a live distorting glass texture behind cards.
   The shader takes a snapshot of the page background,
   applies flowing wave distortion + blur sampling,
   and composites it under each .card element.
═══════════════════════════════════════════════════ */

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG_SRC = `
precision mediump float;
uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;

  /* flip Y — WebGL origin is bottom-left, CSS is top-left */
  uv.y = 1.0 - uv.y;

  /* subtle flowing distortion — the liquid part */
  float waveX = sin(uv.y * 12.0 + iTime * 1.5) * 0.008;
  float waveY = cos(uv.x * 10.0 + iTime * 1.2) * 0.008;
  vec2 distortedUV = uv + vec2(waveX, waveY);

  /* soft blur sampling 5×5 */
  vec4 color = vec4(0.0);
  float total = 0.0;
  for (float x = -2.0; x <= 2.0; x++) {
    for (float y = -2.0; y <= 2.0; y++) {
      vec2 offset = vec2(x, y) * 0.0015;
      color += texture2D(iChannel0, distortedUV + offset);
      total += 1.0;
    }
  }
  color /= total;

  /* slight brightness boost so it reads as glass (not mud) */
  color.rgb = color.rgb * 1.06 + 0.02;

  gl_FragColor = color;
}`;

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('Shader error:', gl.getShaderInfoLog(sh));
    return null;
  }
  return sh;
}

export function initGlass() {
  const canvas = document.getElementById('glassCanvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) { console.warn('WebGL not available'); return; }

  /* Compile program */
  const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vert || !frag) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Program link error:', gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  /* Full-screen quad */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1,  -1,1,
     1,-1,  1, 1,  -1,1
  ]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes  = gl.getUniformLocation(prog, 'iResolution');
  const uTime = gl.getUniformLocation(prog, 'iTime');
  const uCh0  = gl.getUniformLocation(prog, 'iChannel0');

  /* Texture that holds the background snapshot */
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  /* Off-screen canvas we'll draw the background gradient into */
  const bgCanvas = document.createElement('canvas');
  const bgCtx    = bgCanvas.getContext('2d');

  /* We only draw the animated gradient — the rain canvas is composited above */
  function drawBackground() {
    const W = bgCanvas.width = window.innerWidth;
    const H = bgCanvas.height = window.innerHeight;
    const body = document.documentElement;
    const isLight = body.getAttribute('data-theme') === 'light' ||
      (body.getAttribute('data-theme') === 'system' &&
       window.matchMedia('(prefers-color-scheme:light)').matches);

    if (isLight) {
      bgCtx.fillStyle = '#b8aee8';
      bgCtx.fillRect(0, 0, W, H);
      /* radial glows */
      const g1 = bgCtx.createRadialGradient(W*0.25,H*0.35,0, W*0.25,H*0.35,W*0.55);
      g1.addColorStop(0,'rgba(167,139,250,0.40)'); g1.addColorStop(1,'transparent');
      bgCtx.fillStyle = g1; bgCtx.fillRect(0,0,W,H);
      const g2 = bgCtx.createRadialGradient(W*0.75,H*0.65,0, W*0.75,H*0.65,W*0.45);
      g2.addColorStop(0,'rgba(109,40,217,0.28)'); g2.addColorStop(1,'transparent');
      bgCtx.fillStyle = g2; bgCtx.fillRect(0,0,W,H);
    } else {
      bgCtx.fillStyle = '#07000f';
      bgCtx.fillRect(0, 0, W, H);
      const g1 = bgCtx.createRadialGradient(W*0.20,H*0.40,0, W*0.20,H*0.40,W*0.60);
      g1.addColorStop(0,'rgba(109,60,220,0.25)'); g1.addColorStop(1,'transparent');
      bgCtx.fillStyle = g1; bgCtx.fillRect(0,0,W,H);
      const g2 = bgCtx.createRadialGradient(W*0.75,H*0.65,0, W*0.75,H*0.65,W*0.50);
      g2.addColorStop(0,'rgba(196,181,253,0.14)'); g2.addColorStop(1,'transparent');
      bgCtx.fillStyle = g2; bgCtx.fillRect(0,0,W,H);
    }
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    drawBackground();
  }
  window.addEventListener('resize', resize);
  resize();

  let start = performance.now();
  let bgFrame = 0;

  function render(now) {
    const t = (now - start) / 1000;

    /* Refresh background texture every ~4 frames */
    bgFrame++;
    if (bgFrame % 4 === 0) {
      drawBackground();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgCanvas);
    }

    gl.uniform3f(uRes, canvas.width, canvas.height, 1.0);
    gl.uniform1f(uTime, t);
    gl.uniform1i(uCh0, 0);

    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  /* Listen for theme changes to redraw bg */
  document.querySelectorAll('.theme-btn').forEach(b =>
    b.addEventListener('click', () => { drawBackground(); })
  );
}
