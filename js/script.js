/* ==========================================================================
   Cendrey Hemres S. Perez — Portfolio
   NOTE on storage: theme preference and "have I glitched yet" state are kept
   in plain JS variables (in-memory) rather than localStorage/sessionStorage,
   so they reset on refresh. See README for a 3-line snippet to persist them
   once this is hosted on its own domain.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Theme toggle ---------------- */
  const htmlEl = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  let theme = 'light';
  themeToggle.addEventListener('click', () => {
    theme = theme === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', theme);
    themeToggle.classList.toggle('is-dark', theme === 'dark');
  });

  /* ---------------- Mobile nav collapse ---------------- */
  const sideNav = document.querySelector('.side-nav');
  const navCollapseBtn = document.getElementById('navCollapseBtn');
  const navBackdrop = document.querySelector('.nav-backdrop');

  const openNav = () => { sideNav.classList.add('open'); navBackdrop.classList.add('show'); navCollapseBtn.setAttribute('aria-expanded','true'); };
  const closeNav = () => { sideNav.classList.remove('open'); navBackdrop.classList.remove('show'); navCollapseBtn.setAttribute('aria-expanded','false'); };

  navCollapseBtn.addEventListener('click', () => {
    sideNav.classList.contains('open') ? closeNav() : openNav();
  });
  navBackdrop.addEventListener('click', closeNav);
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', closeNav));

  /* ---------------- Panel navigation ----------------
     The portfolio never scrolls or slides on its own. Each <section id="…">
     inside <main> is a full-panel that is shown/hidden only when a side-nav
     button (or another in-page link) is clicked. */
  const panels = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const panelReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function forceReflow(el) { void el.offsetWidth; }

  function resetPanelAnimations(panel) {
    // Reveal elements: drop the visible state so the transition can replay.
    panel.querySelectorAll('.reveal').forEach(el => el.classList.remove('in-view'));

    // Skill bars: snap back to 0 with no transition so the fill can replay.
    panel.querySelectorAll('.skill-fill').forEach(fill => {
      fill.style.transition = 'none';
      fill.style.width = '0%';
    });
    forceReflow(panel);
    panel.querySelectorAll('.skill-fill').forEach(fill => { fill.style.transition = ''; });

    // Stat counters: stop any run in progress and reset the displayed number.
    panel.querySelectorAll('.num[data-count-to]').forEach(el => {
      if (el._countTimer) { clearInterval(el._countTimer); el._countTimer = null; }
      el.textContent = '0' + (el.dataset.suffix || '');
    });
  }

  function playPanelAnimations(panel) {
    requestAnimationFrame(() => {
      panel.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
      panel.querySelectorAll('.skill-row').forEach(row => {
        const fill = row.querySelector('.skill-fill');
        if (fill) fill.style.width = fill.dataset.level + '%';
      });
    });

    // Stat count-up: shows one number at a time, finishing the whole count
    // in 2.5s total regardless of the target — replays on every panel visit.
    const COUNT_TOTAL_MS = 2500;
    panel.querySelectorAll('.num[data-count-to]').forEach(el => {
      const target = parseInt(el.dataset.countTo, 10) || 0;
      const suffix = el.dataset.suffix || '';
      if (panelReduceMotion || target <= 0) { el.textContent = target + suffix; return; }
      const stepMs = COUNT_TOTAL_MS / target;
      let current = 0;
      el._countTimer = setInterval(() => {
        current++;
        el.textContent = current + suffix;
        if (current >= target) { clearInterval(el._countTimer); el._countTimer = null; }
      }, stepMs);
    });
  }

  function activatePanelContent(panel) {
    resetPanelAnimations(panel);
    playPanelAnimations(panel);
  }

  function showPanel(id, { focus = false } = {}) {
    const target = document.getElementById(id);
    if (!target || !target.matches('main section[id]')) return;

    panels.forEach(p => p.classList.toggle('panel-active', p === target));
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
    target.scrollTop = 0;
    activatePanelContent(target);
    if (focus) target.focus({ preventScroll: true });
  }

  // Any in-page link (side-nav, hero buttons, project "case study" links, etc.)
  // switches panels instead of scrolling.
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      showPanel(id, { focus: true });
    });
  });

  panels.forEach(p => p.setAttribute('tabindex', '-1'));
  showPanel('home');

  /* ---------------- Glitch effect on name (plays once per page load only —
     NOT replayed on panel revisits, unlike the reveal/skill/count animations) ---------------- */
  const nameEl = document.querySelector('.name-glitch');
  if (nameEl) {
    requestAnimationFrame(() => nameEl.classList.add('glitching'));
    setTimeout(() => nameEl.classList.remove('glitching'), 3000);
  }

  /* ---------------- Typewriter ---------------- */
  const roles = ['Computer Engineering Student', 'Hardware & Embedded Systems Enthusiast', 'Networking Fundamentals', 'Problem Solver'];
  const twEl = document.getElementById('typewriter');
  if (twEl) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      twEl.textContent = roles[0];
    } else {
      let roleIdx = 0, charIdx = 0, deleting = false;
      const tick = () => {
        const full = roles[roleIdx];
        if (!deleting) {
          charIdx++;
          twEl.textContent = full.slice(0, charIdx);
          if (charIdx === full.length) { deleting = true; setTimeout(tick, 1400); return; }
        } else {
          charIdx--;
          twEl.textContent = full.slice(0, charIdx);
          if (charIdx === 0) { deleting = false; roleIdx = (roleIdx + 1) % roles.length; }
        }
        setTimeout(tick, deleting ? 35 : 55);
      };
      tick();
    }
  }

  /* ---------------- Modals (contact + certificate preview) ---------------- */
  const closeModal = (modal) => modal.classList.remove('show');
  const closeAllModals = () => document.querySelectorAll('.modal-backdrop.show').forEach(closeModal);

  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });

  const contactModal = document.getElementById('contactModal');
  document.querySelectorAll('[data-open-contact]').forEach(btn => {
    btn.addEventListener('click', () => contactModal.classList.add('show'));
  });

  /* ---------------- Certificate preview modal ---------------- */
  const certModal = document.getElementById('certModal');
  const certModalImg = document.getElementById('certModalImg');
  const certModalTitle = document.getElementById('certModalTitle');
  const certModalIssuer = document.getElementById('certModalIssuer');
  const certModalDate = document.getElementById('certModalDate');
  const certModalOpenPdf = document.getElementById('certModalOpenPdf');

  document.querySelectorAll('[data-cert-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { title, issuer, date, preview, pdf } = btn.dataset;
      certModalImg.src = preview;
      certModalImg.alt = `${title} certificate preview`;
      certModalTitle.textContent = title;
      certModalIssuer.textContent = issuer;
      certModalDate.textContent = date;
      certModalOpenPdf.href = pdf;
      certModal.classList.add('show');
    });
  });

  /* ---------------- Contact form (Formspree) ---------------- */
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const endpoint = form.getAttribute('action');
    if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
      status.textContent = 'Contact form isn\u2019t connected yet \u2014 see README.md to plug in your Formspree ID.';
      status.className = 'form-status err';
      return;
    }
    status.textContent = 'Sending\u2026';
    status.className = 'form-status';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (res.ok) {
        status.textContent = 'Message sent \u2014 thank you! I\u2019ll get back to you soon.';
        status.className = 'form-status ok';
        form.reset();
      } else {
        status.textContent = 'Something went wrong sending that. Please try again.';
        status.className = 'form-status err';
      }
    } catch (err) {
      status.textContent = 'Network error \u2014 please check your connection and try again.';
      status.className = 'form-status err';
    }
  });

  /* ---------------- Animated background: PCB traces + circuit nodes + binary rain ---------------- */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w, h, dpr, traces = [], particles = [], drops = [];

  function isDark() { return htmlEl.getAttribute('data-theme') === 'dark'; }

  function buildTraces() {
    traces = [];
    const count = Math.max(8, Math.floor(w / 170));
    for (let i = 0; i < count; i++) {
      let x = Math.random() * w, y = Math.random() * h;
      const points = [[x, y]];
      const segs = 3 + Math.floor(Math.random() * 4);
      for (let s = 0; s < segs; s++) {
        if (Math.random() > 0.5) x += (Math.random() - 0.5) * 260; else y += (Math.random() - 0.5) * 260;
        points.push([x, y]);
      }
      const nodeIdx = [...new Set([1, Math.floor(segs / 2), segs].filter(n => n < points.length))];
      traces.push({ points, nodeIdx });
    }
  }

  function buildParticles() {
    const count = Math.max(18, Math.min(70, Math.floor((w * h) / 34000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      r: 1.3 + Math.random() * 1.3
    }));
  }

  function resetDrop(d) {
    d.x = Math.random() * w;
    d.y = -Math.random() * h * 0.5;
    d.speed = 0.35 + Math.random() * 0.55;
    d.char = Math.random() > 0.5 ? '1' : '0';
    d.life = 0;
    d.span = h * 0.9 + 250 + Math.random() * 250;
    return d;
  }
  function buildDrops() {
    const cols = Math.min(46, Math.floor(w / 30));
    drops = Array.from({ length: cols }, () => resetDrop({}));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildTraces(); buildParticles(); buildDrops();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const dark = isDark();
    const traceColor = dark ? 'rgba(157,130,255,0.16)' : 'rgba(46,111,163,0.14)';
    const nodeColor  = dark ? 'rgba(185,167,255,0.5)'  : 'rgba(46,111,163,0.4)';
    const partColor  = dark ? 'rgba(185,167,255,0.5)'  : 'rgba(46,111,163,0.42)';
    const rainRGB    = dark ? '157,130,255' : '46,111,163';

    ctx.lineWidth = 1;
    ctx.strokeStyle = traceColor;
    traces.forEach(t => {
      ctx.beginPath();
      t.points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
      ctx.stroke();
      ctx.fillStyle = nodeColor;
      t.nodeIdx.forEach(ni => {
        const [x, y] = t.points[ni];
        ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      });
    });

    if (!reduceMotion) {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      });
    }
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(${rainRGB},${(dark ? 0.16 : 0.13) * (1 - dist / 120)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.fillStyle = partColor;
    particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });

    if (!reduceMotion) {
      ctx.font = '13px monospace';
      drops.forEach(d => {
        d.y += d.speed; d.life += d.speed;
        const progress = d.life / d.span;
        let op = progress < 0.15 ? progress / 0.15 : progress > 0.85 ? (1 - progress) / 0.15 : 1;
        op = Math.max(0, Math.min(1, op)) * 0.5;
        ctx.fillStyle = `rgba(${rainRGB},${op})`;
        ctx.fillText(d.char, d.x, d.y);
        if (d.life >= d.span || d.y > h + 40) resetDrop(d);
      });
    }
  }

  function loop() {
    draw();
    if (!reduceMotion) requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
  loop();
});
