window._t0 = Date.now();

(function () {
  if (window.innerWidth < 481) return;
  const c = document.getElementById('canvas');
  const ctx = c.getContext('2d');
  let W, H, mouse = { x: -999, y: -999 };
  const P = [], N = 38;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  class Par {
    constructor() { this.init(true); }
    init(r) {
      this.x = Math.random() * (W || 800);
      this.y = r ? Math.random() * (H || 600) : (H || 600) + 10;
      this.rad = Math.random() * 2 + .5;
      this.vx = (Math.random() - .5) * .22;
      this.vy = -(Math.random() * .35 + .12);
      this.life = 0;
      this.max = Math.random() * 280 + 180;
    }
    tick() {
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 90) {
        this.vx += (dx / d) * .032;
        this.vy += (dy / d) * .032;
      }
      this.vx *= .99;
      this.vy *= .99;
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.max || this.y < -10) this.init(false);
    }
    draw() {
      const a = Math.sin((this.life / this.max) * Math.PI) * .4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.rad, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(22,58%,52%,${a})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < N; i++) P.push(new Par());

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < P.length; i++) {
      for (let j = i + 1; j < P.length; j++) {
        const dx = P[i].x - P[j].x, dy = P[i].y - P[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 105) {
          const a1 = Math.sin((P[i].life / P[i].max) * Math.PI);
          const a2 = Math.sin((P[j].life / P[j].max) * Math.PI);
          ctx.beginPath();
          ctx.moveTo(P[i].x, P[i].y);
          ctx.lineTo(P[j].x, P[j].y);
          ctx.strokeStyle = `rgba(170,100,50,${(1 - d / 105) * .09 * Math.min(a1, a2)})`;
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
    }
    P.forEach(p => { p.tick(); p.draw(); });
    requestAnimationFrame(frame);
  }

  frame();
})();

let uname = '';
let service = '';
let budget = '';
let deadline = '';
let userStarted = false;

function sanitize(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const wait = ms => new Promise(r => setTimeout(r, ms));

function show(id, delay = 0) {
  return new Promise(r => setTimeout(() => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add('vis');
      if (userStarted) scrollBottom();
    }
    r();
  }, delay));
}

function setP(pct) {
  document.getElementById('prog').style.width = pct + '%';
}

function scrollBottom() {
  if (!userStarted) return;
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 80);
}

function wordify(html) {
  const parts = html.split(/(\s+|<[^>]+>)/);
  let out = '';
  let d = 0;
  parts.forEach(w => {
    if (!w) return;
    if (w.startsWith('<')) {
      out += w;
      return;
    }
    if (/^\s+$/.test(w)) {
      out += w;
      return;
    }
    out += `<span class="word" style="animation-delay:${d}ms">${w}</span>`;
    d += 36;
  });
  return out;
}

async function type(id, html, delay = 0) {
  await wait(delay);
  const el = document.getElementById(id);
  const row = document.getElementById(id.replace('-txt', ''));
  if (!el) return;

  el.innerHTML = '<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
  if (row) row.classList.add('vis');
  if (userStarted) scrollBottom();

  const t = Math.min(Math.max(html.replace(/<[^>]+>/g, '').length * 17, 650), 1300);
  await wait(t);

  el.innerHTML = wordify(html);
  if (userStarted) scrollBottom();
}

function ripple(btn, e) {
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  const s = Math.max(rect.width, rect.height);
  const x = (e && e.clientX ? e.clientX : rect.left + rect.width / 2) - rect.left - s / 2;
  const y = (e && e.clientY ? e.clientY : rect.top + rect.height / 2) - rect.top - s / 2;
  r.style.cssText = `width:${s}px;height:${s}px;left:${x}px;top:${y}px`;
  btn.appendChild(r);
  setTimeout(() => r.remove(), 560);
}

const svcReply = {
  'Stronę internetową': 'Strony to coś co naprawdę lubimy robić — i robimy inaczej niż większość. Już widzę kilka ciekawych kierunków.',
  'Sklep online': 'E-commerce robimy z głową — nie tylko żeby wyglądał, ale żeby sprzedawał. Dobry wybór.',
  'Logo i identyfikację': 'Marka zapamiętana to marka zrobiona z charakterem. Lubimy takie wyzwania.',
  'Kampanię reklamową': 'Reklama która coś realnie robi — to nieco inna liga niż standardowe agencje.',
  'Aplikację webową': 'Aplikacje to nasza codzienność. Ważne pytanie na start: co ma robić, a nie jak wyglądać.',
  'Nie wiem jeszcze': 'Uczciwa odpowiedź. Najlepsze projekty często zaczynają się od rozmowy, nie od gotowego planu.'
};

const bdgReply = {
  'do 5 tys. zł': 'Rozumiemy. Powiemy Ci szczerze co w tym zakresie ma sens — a czego lepiej nie zaczynać.',
  '5–15 tys. zł': 'To dobry zakres. Większość rzeczy które robimy mieści się tutaj i naprawdę wychodzi dobrze.',
  '15–50 tys. zł': 'Przy takim budżecie mamy spore pole do manewru. Możemy zaplanować coś solidnego.',
  '50 tys. zł+': 'Przy takim budżecie możemy podejść do tego poważnie od pierwszej chwili.'
};

async function init() {
  setP(5);
  await show('trust', 300);
  await type('m0-txt', 'Hej! Cieszę się, że tu jesteś. 👋<br><em>Jak mam się do Ciebie zwracać?</em>', 700);
  await show('inp-row', 450);
  setTimeout(() => document.getElementById('inp-name')?.focus(), 550);
}

async function submitName() {
  const val = document.getElementById('inp-name').value.trim();
  if (!val) {
    document.getElementById('inp-name').focus();
    return;
  }

  uname = val;
  userStarted = true;

  const row = document.getElementById('inp-row');
  row.style.transition = 'opacity .3s';
  row.style.opacity = '.3';
  row.style.pointerEvents = 'none';

  document.getElementById('ub-name').innerHTML = `<div class="user-bubble">${sanitize(uname)}</div>`;
  await show('ub-name', 100);
  setP(25);

  const m = [
    `Miło mi, <span class="hi">${sanitize(uname)}</span>. Zanim zaczniemy — nad czym chciałbyś/chciałabyś z nami pracować?`,
    `Fajnie, <span class="hi">${sanitize(uname)}</span>! Czego szukasz? Czym możemy Ci pomóc?`,
    `Świetnie, <span class="hi">${sanitize(uname)}</span>. Co możemy razem zrobić?`
  ];

  await type('m1-txt', m[Math.floor(Math.random() * m.length)], 400);
  await show('pills-service', 500);
}

async function pickService(el, val) {
  if (service) return;
  service = val;

  ripple(el, {});
  document.querySelectorAll('#pills-service .pill').forEach(p => p.classList.add('faded'));
  el.classList.remove('faded');
  el.classList.add('picked');

  document.getElementById('ub-service').innerHTML = `<div class="user-bubble">${val}</div>`;
  await show('ub-service', 150);
  setP(50);

  const base = svcReply[val] || svcReply['Nie wiem jeszcze'];
  await type('m2-txt', `${base}<br><br><em>Jakim budżetem mniej więcej dysponujesz?</em>`, 450);
  await show('budget-grid', 550);
}

async function pickBudget(el, val) {
  if (budget) return;
  budget = val;

  ripple(el, {});
  document.querySelectorAll('#budget-grid .bcard').forEach(b => b.classList.add('faded'));
  el.classList.remove('faded');
  el.classList.add('picked');

  document.getElementById('ub-budget').innerHTML = `<div class="user-bubble">${val}</div>`;
  await show('ub-budget', 150);
  setP(72);

  const base = bdgReply[val] || '';
  await type('m3-txt', `${base}<br><br><em>I ostatnie pytanie — kiedy chciałbyś/chciałabyś żebyśmy zaczęli?</em>`, 450);
  await show('pills-deadline', 550);
}

async function pickDeadline(el, val) {
  if (deadline) return;
  deadline = val;

  ripple(el, {});
  document.querySelectorAll('#pills-deadline .pill').forEach(p => p.classList.add('faded'));
  el.classList.remove('faded');
  el.classList.add('picked');

  document.getElementById('ub-deadline').innerHTML = `<div class="user-bubble">${val}</div>`;
  await show('ub-deadline', 150);
  setP(90);

  await type('m4-txt', `Mam wszystko czego potrzebuję, <span class="hi">${sanitize(uname)}</span>. 🙌<br><br>Przekażę to do zespołu i ktoś odezwie się do Ciebie osobiście. Żadnych automatycznych maili — prawdziwa rozmowa o Twoim projekcie.`, 450);
  await show('cta', 700);
}

async function submit(e) {
  ripple(e.currentTarget, e);

  const cta = document.getElementById('cta');
  cta.style.transition = 'opacity .3s';
  cta.style.opacity = '.3';
  cta.style.pointerEvents = 'none';

  setP(100);

  const _sc = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.security : null;
  if (_sc) {
    if (_sc.honeypot && document.getElementById('_hp')?.value) {
      await type('m5-txt', `Gotowe! ✦<br><br>Dzięki za zaufanie, <span class="hi">${sanitize(uname)}</span>. Do zobaczenia wkrótce.`, 350);
      document.getElementById('restart-area').style.display = 'block';
      return;
    }
    if (((Date.now() - (window._t0 || 0)) / 1000) < (_sc.minFillSeconds || 5)) {
      await type('m5-txt', `Gotowe! ✦<br><br>Dzięki za zaufanie, <span class="hi">${sanitize(uname)}</span>. Do zobaczenia wkrótce.`, 350);
      document.getElementById('restart-area').style.display = 'block';
      return;
    }
  }

  const _webhookUrl = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.webhooks?.chat) || '';
  if (!_webhookUrl) {
    console.warn('[Make.com] webhookUrl nie jest ustawiony w config.js');
  }

  try {
    if (!_webhookUrl) throw new Error('no-url');
    await fetch(_webhookUrl, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imie: uname,
        usluga: service,
        budzet: budget,
        termin: deadline,
        timestamp: new Date().toISOString()
      })
    });
  } catch (err) {
    console.error('Błąd wysyłki do Make:', err);
  }

  await type('m5-txt', `Gotowe! ✦<br><br>Dzięki za zaufanie, <span class="hi">${sanitize(uname)}</span>. To dla nas naprawdę coś znaczy — nie traktujemy tego jak kolejne zapytanie.<br><br><em>Do zobaczenia wkrótce.</em>`, 350);
  document.getElementById('restart-area').style.display = 'block';
}

function setupHandlers() {
  document.querySelector('.send-btn')?.addEventListener('click', submitName);
  document.getElementById('inp-name')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitName(); });
  document.querySelectorAll('#pills-service .pill').forEach(p => p.addEventListener('click', function() { pickService(this, this.textContent.trim()); }));
  document.querySelectorAll('#budget-grid .bcard').forEach(b => b.addEventListener('click', function() { pickBudget(this, this.querySelector('.bc-amt').textContent.trim()); }));
  document.querySelectorAll('#pills-deadline .pill').forEach(p => p.addEventListener('click', function() { pickDeadline(this, this.textContent.trim()); }));
  document.querySelector('.cta-btn')?.addEventListener('click', e => submit(e));
  document.querySelector('.restart-btn')?.addEventListener('click', () => location.reload());
}
setupHandlers();

init();
