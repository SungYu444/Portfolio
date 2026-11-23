(() => {
  const section = document.querySelector('#eye');
  const canvas = document.querySelector('#ascii-eye');
  const contactButton = document.querySelector('#eye-contact');
  if (!section || !canvas || !contactButton || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const gaze = { x: 0, y: 0, targetX: 0, targetY: 0 };
  const colors = {
    outline: '#d9cbb4',
    sclera: '#eee3cd',
    scleraShade: '#9d8d76',
    irisOuter: '#874337',
    irisMid: '#b75b40',
    irisLight: '#e5a05e',
    irisWarm: '#cf7148',
    pupil: '#050505',
    glint: '#fff7e7',
  };
  let revealAt = null;
  let nextBlinkAt = Infinity;
  let blinkAt = null;
  let visible = false;
  let raf = 0;
  let resizeObserver;

  function lookAtContact() {
    const eyeRect = canvas.getBoundingClientRect();
    const buttonRect = contactButton.getBoundingClientRect();
    gaze.targetX = Math.max(-1, Math.min(1, ((buttonRect.left + buttonRect.width / 2 - eyeRect.left) / eyeRect.width - 0.5) * 2));
    gaze.targetY = Math.max(-1, Math.min(1, ((buttonRect.top + buttonRect.height / 2 - eyeRect.top) / eyeRect.height - 0.5) * 2));
    if (!revealAt) {
      gaze.x = gaze.targetX;
      gaze.y = gaze.targetY;
    }
  }

  function setCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lookAtContact();
    if (visible && !raf) raf = requestAnimationFrame(draw);
  }
  resizeObserver = new ResizeObserver(setCanvasSize);
  resizeObserver.observe(canvas);
  setCanvasSize();

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      revealAt ??= performance.now();
      if (!raf) raf = requestAnimationFrame(draw);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }, { threshold: 0.15 });
  visibilityObserver.observe(section);

  section.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    gaze.targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    gaze.targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
    if (visible && !raf) raf = requestAnimationFrame(draw);
  });
  section.addEventListener('pointerleave', lookAtContact);

  function draw(now) {
    raf = 0;
    if (!visible) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) {
      raf = requestAnimationFrame(draw);
      return;
    }
    gaze.x += (gaze.targetX - gaze.x) * 0.065;
    gaze.y += (gaze.targetY - gaze.y) * 0.065;

    const fontSize = Math.max(11, Math.min(15, bounds.width / 74));
    const cellW = fontSize * 0.62;
    const cellH = fontSize * 1.1;
    const cols = Math.floor(bounds.width / cellW);
    const rows = Math.floor(bounds.height / cellH);
    const cx = (cols - 1) / 2;
    const cy = (rows - 1) / 2;
    const rx = cols * 0.425;
    const ry = rows * 0.455;

    const openDuration = 3600;
    let open = revealAt === null ? 0 : Math.max(0, Math.min(1, (now - revealAt) / openDuration));
    open = open * open * (3 - 2 * open);
    if (open >= 1 && nextBlinkAt === Infinity) nextBlinkAt = now + 6500 + Math.random() * 5000;
    if (open >= 1 && blinkAt === null && now >= nextBlinkAt) {
      blinkAt = now;
      nextBlinkAt = now + 7000 + Math.random() * 6500;
    }
    if (blinkAt !== null) {
      const blinkProgress = Math.min(1, (now - blinkAt) / 440);
      const close = blinkProgress < 0.46
        ? Math.sin((blinkProgress / 0.46) * Math.PI / 2)
        : Math.cos(((blinkProgress - 0.46) / 0.54) * Math.PI / 2);
      open *= 1 - close;
      if (blinkProgress >= 1) blinkAt = null;
    }
    open = Math.max(0.025, open);

    const pupilX = cx + gaze.x * rx * 0.39;
    const pupilY = cy + gaze.y * ry * 0.52;
    const irisRX = rx * 0.215;
    const irisRY = ry * 0.57;
    const pupilRX = rx * 0.105;
    const pupilRY = ry * 0.335;
    const upperLines = '._-~';
    const lowerLines = '~-_.';

    ctx.clearRect(0, 0, bounds.width, bounds.height);
    ctx.font = `${fontSize}px "DM Mono", "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let x = 0; x < cols; x++) {
      const dx = x - cx;
      if (Math.abs(dx) > rx) continue;
      const taper = Math.sin(((dx / rx) + 1) * Math.PI / 2);
      const half = Math.max(0, ry * taper * open);
      for (let y = 0; y < rows; y++) {
        const dy = y - cy;
        if (Math.abs(dy) > half + 0.75) continue;
        const edgeDist = Math.abs(Math.abs(dy) - half);
        const atEdge = edgeDist < 0.9;
        const irisDist = Math.hypot((x - pupilX) / irisRX, (y - pupilY) / irisRY);
        const pupilDist = Math.hypot((x - pupilX) / pupilRX, (y - pupilY) / pupilRY);
        const angle = Math.atan2((y - pupilY) / irisRY, (x - pupilX) / irisRX);
        let char = '';
        let color = colors.sclera;

        if (atEdge) {
          const edgeIndex = Math.abs(x * 3 + y) % 4;
          char = dy < 0 ? upperLines[edgeIndex] : lowerLines[edgeIndex];
          color = edgeDist < 0.35 ? colors.outline : colors.scleraShade;
        } else if (pupilDist < 1) {
          const shine = Math.hypot((x - (pupilX - pupilRX * 0.36)) / (pupilRX * 0.22), (y - (pupilY - pupilRY * 0.34)) / (pupilRY * 0.24));
          char = shine < 1 ? 'o' : '@%#'[Math.abs(x * 5 + y * 3 + Math.floor(now / 260)) % 3];
          color = shine < 1 ? colors.glint : colors.pupil;
        } else if (irisDist < 1.04) {
          const spoke = Math.sin(angle * 22 + irisDist * 34);
          const ring = irisDist < 0.42 ? colors.irisWarm : irisDist < 0.76 ? colors.irisMid : colors.irisOuter;
          if (Math.abs(spoke) > 0.83) char = irisDist < 0.45 ? '|' : '/\\'[Math.abs(x + y) % 2];
          else char = ':+*%#'[Math.abs(x * 2 + y + Math.floor(now / 420)) % 6];
          color = irisDist < 0.18 ? colors.irisLight : ring;
        } else {
          const shade = Math.abs(dy) / Math.max(half, 1);
          const grain = Math.sin(x * 1.7 + y * 2.3);
          if (shade > 0.83 || grain > 0.93) {
            char = "'.,:;"[Math.abs(x + y * 2) % 5];
            color = shade > 0.88 ? colors.scleraShade : colors.irisWarm;
          } else if (grain > 0.60) {
            char = '.';
            color = colors.scleraShade;
          }
        }

        if (char && char !== ' ') {
          ctx.fillStyle = color;
          ctx.fillText(char, (x + 0.5) * cellW, (y + 0.5) * cellH);
        }
      }
    }

    if (open > 0.74) {
      ctx.fillStyle = colors.outline;
      for (let x = Math.ceil(cx - rx * 0.86); x < cx + rx * 0.86; x += 5) {
        const dx = x - cx;
        const taper = Math.sin(((dx / rx) + 1) * Math.PI / 2);
        const upperY = cy - ry * taper * open;
        const lash = dx < -rx * 0.35 ? '\\' : dx > rx * 0.35 ? '/' : '|';
        ctx.fillText(lash, (x + 0.5) * cellW, (upperY - 1.2) * cellH);
      }
    }

    if (open < 1 || blinkAt !== null || now < nextBlinkAt) raf = requestAnimationFrame(draw);
  }
})();
