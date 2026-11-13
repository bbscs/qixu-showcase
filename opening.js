const stage = document.querySelector('.signal-stage');
const canvas = stage.querySelector('canvas');
const replay = stage.querySelector('.signal-replay');
const context = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

if (context) {
  const points = [];
  const edges = [];
  const columns = 12;
  const rings = 7;
  const duration = 2600;
  const route = [37, 49, 50, 62, 63, 75, 76, 64, 65, 53];
  let frame = 0;
  let startedAt;
  let progress = 1;
  let width = 0;
  let height = 0;
  let density = 1;

  for (let ring = 0; ring < rings; ring++) {
    const latitude = (ring / (rings - 1) - 0.5) * Math.PI * 0.86;
    for (let column = 0; column < columns; column++) {
      const longitude = ((column + (ring % 2) * 0.5) / columns) * 2 * Math.PI;
      points.push([
        Math.cos(latitude) * Math.cos(longitude),
        Math.sin(latitude),
        Math.cos(latitude) * Math.sin(longitude),
      ]);
      const current = ring * columns + column;
      const next = ring * columns + (column + 1) % columns;
      edges.push([current, next]);
      if (ring < rings - 1) {
        const diagonal = (column + (ring % 2 ? 1 : columns - 1)) % columns;
        edges.push([current, current + columns], [current, (ring + 1) * columns + diagonal]);
      }
    }
  }

  function draw() {
    if (!width || !height) return;
    context.setTransform(density, 0, 0, density, 0, 0);
    context.clearRect(0, 0, width, height);
    const angle = -0.35 + (1 - (1 - progress) ** 2) * 1.12;
    const radius = Math.min(width * 0.37, height * 0.41);
    const centerX = width / 2;
    const centerY = height / 2;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const projected = points.map(([x, y, z]) => {
      const horizontal = x * cos - z * sin;
      const depth = x * sin + z * cos;
      const vertical = y * 0.94 - depth * 0.34;
      const tiltedDepth = y * 0.34 + depth * 0.94;
      const scale = radius / (1 - tiltedDepth * 0.15);
      return [centerX + horizontal * scale, centerY + vertical * scale, tiltedDepth];
    });

    context.lineWidth = 0.8;
    for (const [from, to] of edges) {
      const [x, y, z] = projected[from];
      const [nextX, nextY, nextZ] = projected[to];
      context.strokeStyle = `rgba(156, 193, 244, ${0.16 + (z + nextZ + 2) * 0.075})`;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(nextX, nextY);
      context.stroke();
    }
    for (const [x, y, z] of projected) {
      context.fillStyle = `rgba(199, 223, 255, ${0.24 + (z + 1) * 0.28})`;
      context.beginPath();
      context.arc(x, y, 0.95 + (z + 1) * 0.48, 0, Math.PI * 2);
      context.fill();
    }

    const position = progress * (route.length - 1);
    const segment = Math.min(Math.floor(position), route.length - 2);
    const blend = position - segment;
    const [x, y] = projected[route[segment]];
    const [nextX, nextY] = projected[route[segment + 1]];
    const pulseX = x + (nextX - x) * blend;
    const pulseY = y + (nextY - y) * blend;
    context.save();
    context.shadowColor = '#ff9d5f';
    context.shadowBlur = 15;
    context.lineWidth = 2.3;
    context.lineCap = 'round';
    context.strokeStyle = '#ffc08e';
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(pulseX, pulseY);
    context.stroke();
    context.fillStyle = '#ffe5cc';
    context.beginPath();
    context.arc(pulseX, pulseY, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    draw();
  }

  function setProgress(value) {
    progress = value;
    const step = String(value < 0.34 ? 0 : value < 0.72 ? 1 : 2);
    if (stage.dataset.step !== step) stage.dataset.step = step;
    draw();
  }

  function advance(time) {
    startedAt ??= time;
    setProgress(Math.min((time - startedAt) / duration, 1));
    frame = progress < 1 ? requestAnimationFrame(advance) : 0;
  }

  function play() {
    cancelAnimationFrame(frame);
    frame = 0;
    startedAt = undefined;
    if (reducedMotion.matches || document.hidden) {
      setProgress(1);
      return;
    }
    setProgress(0);
    frame = requestAnimationFrame(advance);
  }

  function updatePreference() {
    replay.hidden = reducedMotion.matches;
    if (reducedMotion.matches) play();
  }

  replay.addEventListener('click', play);
  reducedMotion.addEventListener('change', updatePreference);
  new ResizeObserver(resize).observe(canvas);
  updatePreference();
  resize();
  const entrance = new IntersectionObserver(([entry], observer) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    play();
  }, { threshold: 0.5 });
  entrance.observe(stage);
}
