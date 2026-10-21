// Burns a full-screen "sheet of paper" away with WebGL: the paper scorches brown ahead of a ragged, flickering
// ember line, chars to black, crumbles into a hole that casts a soft shadow and glows onto the page beneath,
// while a 2D canvas on top throws embers and smoke off the advancing front.
// createPaperBurn() returns null when WebGL is unavailable so the caller can fall back to a plain wipe.

const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D uPaper;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBurn;
uniform float uSpeed;
uniform vec3 uIgnite[3];
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p);
    p = rotate * p * 2.03;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);

  // Domain-warped noise gives the burn front its torn, fibrous outline.
  vec2 warp = vec2(fbm(p * 2.6), fbm(p * 2.6 + 5.2));
  float coarse = fbm(p * 3.4 + warp * 1.6);
  float fibre = fbm(p * 34.0);

  float front = -10.0;
  for (int i = 0; i < 3; i++) {
    vec2 origin = vec2(uIgnite[i].x * aspect, uIgnite[i].y);
    front = max(front, (uBurn - uIgnite[i].z) * uSpeed - length(p - origin));
  }
  // v < 0: paper still intact; v > 0: consumed. Units are fractions of the viewport height.
  float v = front + (coarse - 0.5) * 0.34 + (fibre - 0.5) * 0.035;

  const float SCORCH = 0.16;
  float charWidth = 0.045 + (fibre - 0.5) * 0.04;

  // Heat shimmer just ahead of the flame.
  float heat = smoothstep(-0.12, 0.0, v) * (1.0 - step(0.0, v));
  vec2 shimmer = (vec2(noise(p * 40.0 + uTime * 6.0), noise(p * 40.0 - uTime * 5.0)) - 0.5) * 0.004 * heat;
  vec3 paper = texture2D(uPaper, vUv + shimmer).rgb;
  paper *= 0.965 + 0.035 * fibre; // pulp and fibres

  // Scorch: yellowing, then toasted brown, then near-black where it is about to catch.
  float scorch = smoothstep(-SCORCH, 0.0, v);
  vec3 color = paper;
  color = mix(color, color * vec3(0.93, 0.80, 0.58), smoothstep(0.0, 0.35, scorch));
  color = mix(color, vec3(0.42, 0.23, 0.10), smoothstep(0.35, 0.8, scorch) * 0.85);
  color = mix(color, vec3(0.10, 0.05, 0.03), smoothstep(0.8, 1.0, scorch));

  // Char band with grey ash speckle.
  float charred = step(0.0, v);
  // Rotated fbm, not raw value noise, so the speckle has no visible grid.
  float ash = smoothstep(0.52, 0.78, fbm(p * 46.0 + 3.1)) * 0.2 * smoothstep(0.012, charWidth, v);
  color = mix(color, vec3(0.045, 0.035, 0.03) + ash * vec3(0.32, 0.30, 0.28), charred);

  float alpha = 1.0 - smoothstep(charWidth, charWidth + 0.004, v);

  // Embers: a thin white-hot line feathering to orange and deep red, flickering, plus hot flecks in the char.
  float flicker = 0.65 + 0.35 * noise(p * 26.0 + vec2(uTime * 2.3, -uTime * 3.1));
  float line = exp(-abs(v - 0.004) / 0.006) * flicker;
  float flecks = smoothstep(0.6, 0.85, fbm(p * 38.0 + vec2(uTime * 0.6, uTime * 0.9))) * charred * (1.0 - smoothstep(0.0, charWidth, v)) * flicker;
  float glow = clamp(line + flecks * 0.8, 0.0, 1.4);
  vec3 ember = mix(vec3(0.55, 0.04, 0.0), vec3(1.0, 0.42, 0.04), smoothstep(0.1, 0.6, glow));
  ember = mix(ember, vec3(1.0, 0.92, 0.62), smoothstep(0.75, 1.2, glow));
  vec3 emission = ember * glow * 1.6;

  // Light thrown onto everything near the flame, including the page showing through the hole.
  float halo = exp(-abs(v) / 0.05) * 0.22 * flicker;
  emission += vec3(1.0, 0.38, 0.08) * halo;

  // The remaining paper casts a soft shadow onto the page just past its burnt edge.
  float shadow = (1.0 - alpha) * (1.0 - smoothstep(charWidth, charWidth + 0.06, v)) * 0.5;

  // Premultiplied output; emission is additive (alpha untouched) so it lights the hero underneath.
  gl_FragColor = vec4(color * alpha + emission, alpha + shadow);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createRenderer(canvas) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, depth: false, failIfMajorPerformanceCaveat: true });
  if (!gl) return null;
  try {
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const uniform = (name) => gl.getUniformLocation(program, name);
    return { gl, program, buffer, uniforms: { resolution: uniform("uResolution"), time: uniform("uTime"), burn: uniform("uBurn"), speed: uniform("uSpeed"), ignite: uniform("uIgnite") } };
  } catch (error) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    throw error;
  }
}

function uploadPaper(gl, source) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

const random = (min, max) => min + Math.random() * (max - min);

// Embers and smoke, spawned on an approximation of the shader's front (circles around each ignition point).
function createParticles(canvas, scale) {
  const context = canvas.getContext("2d");
  const sparks = [];
  const smoke = [];
  return {
    spawn(fronts, dt) {
      const height = canvas.height;
      fronts.forEach(({ x, y, radius }) => {
        if (radius <= 0) return;
        const along = Math.min(1, radius * 1.6);
        for (let i = 0; i < 70 * dt * along; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = (radius + random(-0.12, 0.08)) * height;
          const px = x * canvas.width + Math.cos(angle) * r;
          const py = (1 - y) * height - Math.sin(angle) * r;
          if (px < 0 || py < 0 || px > canvas.width || py > height) continue;
          sparks.push({ x: px, y: py, vx: random(-30, 30) * scale, vy: random(-160, -50) * scale, life: random(0.6, 1.8), age: 0, size: random(0.6, 2.2) * scale, seed: Math.random() * 10 });
        }
        for (let i = 0; i < 9 * dt * along; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = (radius + random(-0.05, 0.05)) * height;
          const px = x * canvas.width + Math.cos(angle) * r;
          const py = (1 - y) * height - Math.sin(angle) * r;
          if (px < -100 || py < -100 || px > canvas.width + 100 || py > height + 100) continue;
          smoke.push({ x: px, y: py, vx: random(-12, 12) * scale, vy: random(-70, -30) * scale, life: random(1.2, 2.4), age: 0, size: random(30, 70) * scale });
        }
      });
    },
    draw(dt, time) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = "source-over";
      for (let i = smoke.length - 1; i >= 0; i--) {
        const puff = smoke[i];
        puff.age += dt;
        if (puff.age > puff.life) { smoke.splice(i, 1); continue; }
        const t = puff.age / puff.life;
        puff.x += (puff.vx + Math.sin(time * 1.3 + puff.y * 0.01) * 14 * scale) * dt;
        puff.y += puff.vy * dt;
        const radius = puff.size * (1 + t * 2.2);
        const gradient = context.createRadialGradient(puff.x, puff.y, 0, puff.x, puff.y, radius);
        const opacity = Math.sin(Math.PI * t) * 0.11;
        gradient.addColorStop(0, `rgba(96, 86, 78, ${opacity})`);
        gradient.addColorStop(1, "rgba(96, 86, 78, 0)");
        context.fillStyle = gradient;
        context.fillRect(puff.x - radius, puff.y - radius, radius * 2, radius * 2);
      }
      context.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const spark = sparks[i];
        spark.age += dt;
        if (spark.age > spark.life) { sparks.splice(i, 1); continue; }
        const t = spark.age / spark.life;
        spark.vx += Math.sin(time * 7 + spark.seed) * 90 * scale * dt; // turbulence
        spark.vy -= 40 * scale * dt; // buoyancy
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        const heat = (1 - t) * (0.6 + 0.4 * Math.sin(time * 30 + spark.seed * 5));
        const green = Math.round(120 + 120 * (1 - t));
        context.fillStyle = `rgba(255, ${green}, ${Math.round(60 * (1 - t))}, ${heat})`;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size * (1 - t * 0.5), 0, Math.PI * 2);
        context.fill();
        context.fillStyle = `rgba(255, 90, 20, ${heat * 0.18})`;
        context.beginPath();
        context.arc(spark.x, spark.y, spark.size * 4, 0, Math.PI * 2);
        context.fill();
      }
      return sparks.length + smoke.length;
    },
  };
}

// Lights the sheet and returns a handle, or null when WebGL is unavailable so the caller can fall back to a wipe.
// paint(context, width, height, scale) draws the paper as it currently looks; host receives the canvases;
// origin ({ x, y } in viewport pixels) is where the first flame catches.
// The caller drives the burn: set(value) while loading (0–1, eased toward so jumps stay smooth), then
// finish(ms) burns off whatever is left and resolves once the last embers have mostly drifted away.
// onFrame(radius) reports how far (CSS px) the first flame has spread from the origin, ignoring the noise.
export function createPaperBurn({ host, paint, origin, finishFrom = 0.55, onIgnite, onReveal, onFrame, onFallback }) {
  // Keep shader work bounded even on large Windows displays with scaling enabled.
  const scale = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1_000_000 / (innerWidth * innerHeight)));
  const width = Math.max(1, Math.floor(innerWidth * scale));
  const height = Math.max(1, Math.floor(innerHeight * scale));
  const make = (className) => Object.assign(document.createElement("canvas"), { className, width, height });
  const surface = make("paper-burn");
  let renderer;
  try {
    renderer = createRenderer(surface);
    if (!renderer) return null;
    const paper = make("");
    paint(paper.getContext("2d"), width, height, scale);
    renderer.texture = uploadPaper(renderer.gl, paper);
  } catch {
    renderer?.gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  const sparksCanvas = make("paper-burn paper-burn-sparks");
  host.append(surface, sparksCanvas);
  const particles = createParticles(sparksCanvas, scale);
  const { gl, uniforms } = renderer;

  // The first flame catches at the origin; two more join near opposite corners only for the final burn-off,
  // so the labels and counter stay on intact paper while loading. Coordinates are uv (y up) plus a start delay.
  const first = origin ? [origin.x / innerWidth, 1 - origin.y / innerHeight, 0] : [random(0.05, 0.3), random(0.02, 0.25), 0];
  const ignite = [
    first,
    [random(0.02, 0.18), random(0.02, 0.2), finishFrom + 0.02],
    [random(0.82, 0.98), random(0.8, 0.98), finishFrom + 0.08],
  ];
  const aspect = width / height;
  // Fast enough that every corner is consumed (past the noise and char band) exactly as burn reaches 1.
  const speed = Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([cx, cy]) => Math.min(...ignite.map(([x, y, delay]) =>
    (Math.hypot((cx - x) * aspect, cy - y) + 0.3) / (1 - delay)))));
  gl.viewport(0, 0, width, height);
  gl.uniform2f(uniforms.resolution, width, height);
  gl.uniform1f(uniforms.speed, speed);
  gl.uniform3fv(uniforms.ignite, ignite.flat());

  const started = performance.now();
  let last = started;
  let burn = 0;
  let target = 0;
  let ending = null; // { from, at, ms, resolve }
  let revealed = false;
  let stopped = false;
  let frameId;
  let slowFrames = 0;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frameId);
    surface.removeEventListener("webglcontextlost", fallback);
    ending?.resolve(false);
    if (!gl.isContextLost()) {
      gl.deleteTexture(renderer.texture);
      gl.deleteBuffer(renderer.buffer);
      gl.getAttachedShaders(renderer.program)?.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(renderer.program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    surface.remove();
    sparksCanvas.remove();
  };
  const fallback = () => {
    stop();
    onFallback?.();
  };
  surface.addEventListener("webglcontextlost", fallback);

  const frame = (now) => {
    if (stopped) return;
    if (gl.isContextLost()) return fallback();
    const elapsed = (now - started) / 1000;
    // Repeated frames below 20 FPS make the wipe a better experience. Allow startup to settle.
    if (now - started > 400) {
      slowFrames = now - last > 50 ? slowFrames + 1 : 0;
      if (slowFrames >= 4) return fallback();
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (ending) {
      // Ease in: the remaining sheet goes up faster and faster.
      const t = Math.min(1, (now - ending.at) / ending.ms);
      burn = ending.from + (1 - ending.from) * t * t;
    } else {
      burn += (target - burn) * Math.min(1, dt * 6);
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform1f(uniforms.burn, burn);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!revealed && burn > 0.3) {
      revealed = true;
      onReveal?.();
    }
    onFrame?.(burn * speed * innerHeight);
    if (burn < 1) particles.spawn(ignite.map(([x, y, delay]) => ({ x, y, radius: (burn - delay) * speed })), dt);
    const alive = particles.draw(dt, elapsed);
    // Let the last embers drift briefly, but never hold the page past a short tail.
    if (ending && burn >= 1 && (alive === 0 || now - ending.at > ending.ms + 500)) {
      const resolve = ending.resolve;
      ending = null;
      stop();
      return resolve(true);
    }
    frameId = requestAnimationFrame(frame);
  };
  // Draw the untouched sheet once before the DOM paper is hidden, so the handover is invisible.
  gl.uniform1f(uniforms.time, 0);
  gl.uniform1f(uniforms.burn, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  onIgnite?.();
  frameId = requestAnimationFrame(frame);

  return {
    // Spread per unit of burn, in viewport heights: lets the caller turn a distance into a burn value.
    speed,
    set(value) {
      target = Math.max(target, Math.min(finishFrom, value));
    },
    finish(ms) {
      return new Promise((resolve) => {
        if (stopped) return resolve(true);
        ending = { from: burn, at: performance.now(), ms, resolve };
      });
    },
    stop,
  };
}
