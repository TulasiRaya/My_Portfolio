(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     NAV: mobile toggle + scroll shadow
  --------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', false);
    }));
  }

  /* ---------------------------------------------------------
     PROGRESS RAIL
  --------------------------------------------------------- */
  const progressFill = document.getElementById('progressFill');
  function updateProgress() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const max = h.scrollHeight - h.clientHeight;
    progressFill.style.width = max > 0 ? `${(scrolled / max) * 100}%` : '0%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* ---------------------------------------------------------
     REVEAL ON SCROLL
  --------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------------------------------------------------------
     COUNT-UP STATS
  --------------------------------------------------------- */
  const counters = document.querySelectorAll('.num[data-count]');
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString();
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          reduceMotion ? (en.target.textContent = en.target.dataset.count) : animateCount(en.target);
          cio.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  }

  /* ---------------------------------------------------------
     SKILL BARS
  --------------------------------------------------------- */
  const skillList = document.getElementById('skillList');
  if (skillList) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.querySelectorAll('.cup-bar span').forEach((s, i) => {
            setTimeout(() => s.classList.add('filled'), i * 90);
          });
          sio.unobserve(en.target);
        }
      });
    }, { threshold: 0.3 });
    sio.observe(skillList);
  }

  /* ---------------------------------------------------------
     HEADLINE ROTATOR
  --------------------------------------------------------- */
  const rotator = document.getElementById('rotator');
  if (rotator) {
    const words = ['house prices', 'laptop prices', 'crop yields', 'coffee quality', 'market trends'];
    let idx = 0;
    setInterval(() => {
      idx = (idx + 1) % words.length;
      rotator.style.opacity = '0';
      setTimeout(() => {
        rotator.textContent = words[idx];
        rotator.style.opacity = '1';
      }, 260);
    }, 2600);
    rotator.style.transition = 'opacity 0.26s ease';
  }

  /* ---------------------------------------------------------
     AMBIENT BACKGROUND NODE NETWORK
  --------------------------------------------------------- */
  const bgCanvas = document.getElementById('bg-net');
  if (bgCanvas && !reduceMotion) {
    const ctx = bgCanvas.getContext('2d');
    let W, H, nodes;
    const COUNT = 60;

    function resize() {
      W = bgCanvas.width = window.innerWidth;
      H = bgCanvas.height = document.documentElement.scrollHeight;
    }
    function initNodes() {
      nodes = Array.from({ length: COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    }
    resize();
    initNodes();
    window.addEventListener('resize', () => { resize(); }, { passive: true });

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const viewTop = window.scrollY - 200;
      const viewBottom = window.scrollY + window.innerHeight + 200;

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      });

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.y < viewTop || a.y > viewBottom) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(82,227,194,${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        if (n.y < viewTop || n.y > viewBottom) return;
        ctx.fillStyle = 'rgba(255,180,84,0.35)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------------------------------------------------
     HERO "LIVE MODEL FIT" CANVAS
     Animates a scatter of points with a regression line that
     progressively fits, looping like a training run.
  --------------------------------------------------------- */
  const fitCanvas = document.getElementById('fitCanvas');
  if (fitCanvas) {
    const ctx = fitCanvas.getContext('2d');
    const W = fitCanvas.width, H = fitCanvas.height;
    const pad = 36;

    // fixed synthetic scatter (deterministic so it looks intentional)
    const seedPoints = [];
    let sx = 12345;
    function rnd() { sx = (sx * 1103515245 + 12345) & 0x7fffffff; return (sx / 0x7fffffff); }
    for (let i = 0; i < 42; i++) {
      const x = pad + rnd() * (W - pad * 2);
      const trueY = H - pad - ((x - pad) / (W - pad * 2)) * (H - pad * 2);
      const y = Math.min(H - pad, Math.max(pad, trueY + (rnd() - 0.5) * 90));
      seedPoints.push({ x, y });
    }

    const roEpoch = document.getElementById('roEpoch');
    const roLoss = document.getElementById('roLoss');
    const roR2 = document.getElementById('roR2');

    let progress = 0; // 0 -> 1 fit progress within a cycle
    let epoch = 0;

    function targetSlopeIntercept() {
      // simple least squares on seedPoints
      const n = seedPoints.length;
      let sxs = 0, sys = 0, sxy = 0, sxx = 0;
      seedPoints.forEach(p => { sxs += p.x; sys += p.y; sxy += p.x * p.y; sxx += p.x * p.x; });
      const m = (n * sxy - sxs * sys) / (n * sxx - sxs * sxs);
      const b = (sys - m * sxs) / n;
      return { m, b };
    }
    const { m: targetM, b: targetB } = targetSlopeIntercept();
    const startM = 0;
    const startB = H / 2;

    function computeR2(m, b) {
      const meanY = seedPoints.reduce((s, p) => s + p.y, 0) / seedPoints.length;
      let ssRes = 0, ssTot = 0;
      seedPoints.forEach(p => {
        const pred = m * p.x + b;
        ssRes += (p.y - pred) ** 2;
        ssTot += (p.y - meanY) ** 2;
      });
      return 1 - ssRes / ssTot;
    }

    function drawFrame() {
      ctx.clearRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = 'rgba(234,240,250,0.05)';
      ctx.lineWidth = 1;
      for (let gx = pad; gx <= W - pad; gx += (W - pad * 2) / 6) {
        ctx.beginPath(); ctx.moveTo(gx, pad); ctx.lineTo(gx, H - pad); ctx.stroke();
      }
      for (let gy = pad; gy <= H - pad; gy += (H - pad * 2) / 5) {
        ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
      }

      // eased progress within cycle
      const eased = progress < 0.85 ? 1 - Math.pow(1 - (progress / 0.85), 3) : 1;
      const m = startM + (targetM - startM) * eased;
      const b = startB + (targetB - startB) * eased;

      // regression line
      ctx.strokeStyle = '#FFB454';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(pad, m * pad + b);
      ctx.lineTo(W - pad, m * (W - pad) + b);
      ctx.stroke();

      // scatter points
      seedPoints.forEach(p => {
        ctx.fillStyle = 'rgba(82,227,194,0.85)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // readouts
      const loss = (1 - computeR2(m, b)) * 42.7;
      const r2 = computeR2(m, b);
      roEpoch.textContent = String(epoch).padStart(3, '0');
      roLoss.textContent = loss.toFixed(2);
      roR2.textContent = r2.toFixed(3);

      progress += reduceMotion ? 0.02 : 0.006;
      if (progress >= 1) {
        progress = 0;
        epoch = (epoch + 1) % 999;
      }
      requestAnimationFrame(drawFrame);
    }
    drawFrame();
  }

  /* ---------------------------------------------------------
     PROJECT FILTER
  --------------------------------------------------------- */
  const filterRow = document.getElementById('filterRow');
  const projectGrid = document.getElementById('projectGrid');
  if (filterRow && projectGrid) {
    const cards = projectGrid.querySelectorAll('.project-card');
    filterRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      filterRow.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const tags = (card.dataset.tags || '').split(' ');
        const show = filter === 'all' || tags.includes(filter);
        card.classList.toggle('hidden', !show);
      });
    });
  }

  /* ---------------------------------------------------------
     TILT ON HOVER (project cards)
  --------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 4}deg) rotateX(${-py * 4}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(900px) rotateY(0) rotateX(0) translateY(0)';
      });
    });
  }

  /* ---------------------------------------------------------
     LAPTOP PRICE PLAYGROUND (illustrative, matches LaptopPriceIQ theme)
  --------------------------------------------------------- */
  const pgRam = document.getElementById('pgRam');
  const pgSsd = document.getElementById('pgSsd');
  const pgCpu = document.getElementById('pgCpu');
  const pgGpu = document.getElementById('pgGpu');
  const pgPrice = document.getElementById('pgPrice');
  const pgRamVal = document.getElementById('pgRamVal');
  const pgSsdVal = document.getElementById('pgSsdVal');

  function computePrice() {
    const ram = parseInt(pgRam.value, 10);
    const ssd = parseInt(pgSsd.value, 10);
    const cpuTier = parseInt(pgCpu.value, 10);
    const gpu = pgGpu.checked ? 1 : 0;

    const base = 340;
    const price = base
      + ram * 9.2
      + ssd * 0.11
      + cpuTier * 95
      + gpu * 260;

    return Math.round(price);
  }

  function animatePrice(newVal) {
    const el = pgPrice;
    const current = parseInt(el.textContent.replace(/,/g, ''), 10) || 0;
    const diff = newVal - current;
    const steps = 16;
    let i = 0;
    const t = setInterval(() => {
      i++;
      const val = Math.round(current + (diff * i) / steps);
      el.textContent = val.toLocaleString();
      if (i >= steps) clearInterval(t);
    }, 16);
  }

  if (pgRam && pgSsd && pgCpu && pgGpu) {
    function updatePlayground() {
      pgRamVal.textContent = pgRam.value;
      pgSsdVal.textContent = pgSsd.value;
      animatePrice(computePrice());
    }
    [pgRam, pgSsd, pgCpu, pgGpu].forEach(el => el.addEventListener('input', updatePlayground));
    pgPrice.textContent = computePrice().toLocaleString();
  }

  /* ---------------------------------------------------------
     TERMINAL TYPING EFFECT (contact section)
  --------------------------------------------------------- */
  const termBody = document.getElementById('termBody');
  if (termBody) {
    const lines = [
      { prompt: '$ whoami', out: 'tulasi_lakshmi_narasimha_raya' },
      { prompt: '$ cat role.txt', out: 'data analyst / data scientist / SDE — entry level' },
      { prompt: '$ cat status.txt', out: 'open_to_work = True' },
    ];
    const tio = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          typeTerminal();
          tio.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    tio.observe(termBody);

    function typeTerminal() {
      let li = 0;
      function nextLine() {
        if (li >= lines.length) return;
        const { prompt, out } = lines[li];
        const promptSpan = document.createElement('div');
        const p = document.createElement('span');
        p.className = 'term-prompt';
        promptSpan.appendChild(p);
        termBody.appendChild(promptSpan);

        let ci = 0;
        const typeInterval = setInterval(() => {
          p.textContent = prompt.slice(0, ci + 1);
          ci++;
          if (ci >= prompt.length) {
            clearInterval(typeInterval);
            setTimeout(() => {
              const outEl = document.createElement('div');
              outEl.className = 'term-out';
              outEl.textContent = out;
              termBody.appendChild(outEl);
              li++;
              setTimeout(nextLine, 380);
            }, 220);
          }
        }, reduceMotion ? 1 : 28);
      }
      nextLine();
    }
  }

})();
