window._t0 = Date.now();

const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
const CONFIG = {
  brandName: SC.brand?.name || 'TwojaCRM',
};

const PROG = { 1:25, 2:50, 3:75, 4:100 };
const D = { industry:'', size:'', model:'', areas:[], role:'', timeline:'', budget:'' };
let cur = 1;

document.querySelectorAll('.brand-name').forEach(el => el.textContent = CONFIG.brandName);
document.querySelectorAll('.brand-initial').forEach(el => el.textContent = CONFIG.brandName.charAt(0).toUpperCase());

function go(n) {
  const fwd = n > cur;
  document.getElementById('c' + cur).classList.remove('show');
  const hs = document.getElementById('hs' + cur);
  if (hs) {
    if (fwd) {
      hs.classList.remove('active'); hs.classList.add('done'); hs.querySelector('.h-sn').textContent = '✓';
    } else {
      hs.classList.remove('active', 'done'); hs.querySelector('.h-sn').textContent = String(cur);
    }
  }
  cur = n;
  const card = document.getElementById('c' + n);
  if (card) card.classList.add('show');
  const hsN = document.getElementById('hs' + n);
  if (hsN) { hsN.classList.add('active'); hsN.classList.remove('done'); hsN.querySelector('.h-sn').textContent = String(n); }
  document.getElementById('prog').style.width = (PROG[n] || 100) + '%';
  document.getElementById('krok-n').textContent = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goNext(n) {
  const prev = n - 1;
  const err = document.getElementById('err' + prev);
  let ok = true;
  if (prev === 1 && (!D.industry || !D.size || !D.model)) ok = false;
  if (prev === 2 && !D.areas.length) ok = false;
  if (prev === 3 && (!D.role || !D.timeline || !D.budget)) ok = false;
  if (!ok) { if (err) { err.classList.add('show'); err.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
  if (err) err.classList.remove('show');
  go(n);
}

function pickPill(el) {
  const g = el.dataset.g;
  document.querySelectorAll('.pill[data-g="' + g + '"]').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  D[g] = el.dataset.v;
}

function togArea(el) {
  el.classList.toggle('on');
  const v = el.dataset.v;
  D.areas = el.classList.contains('on')
    ? [...new Set([...D.areas, v])]
    : D.areas.filter(x => x !== v);
  const n = D.areas.length;
  document.getElementById('area-count').textContent = n + ' / 6';
  document.getElementById('area-bar').style.width = (n / 6 * 100) + '%';
  updateCRMGauge();
}

/* ── CRM Readiness Score gauge ───────────────────────────────── */
const AREA_WEIGHTS = { sales: 22, marketing: 18, support: 20, ops: 16, hr: 12, finance: 12 };
const GAUGE_LEVELS = [
  { min: 0,  color: '#94a3b8', msg: 'Zaznacz obszary — zobaczymy gdzie CRM pomoże najbardziej.' },
  { min: 10, color: '#3b82f6', msg: 'Dobry start — widzimy realne obszary do usprawnienia.' },
  { min: 40, color: '#8b5cf6', msg: 'Solidna baza — CRM znacząco przyspieszy te procesy.' },
  { min: 65, color: '#059669', msg: 'Kompleksowa potrzeba — idealny scenariusz dla pełnego CRM.' },
  { min: 90, color: '#10b981', msg: 'Maksymalny potencjał — CRM zmieni Twój biznes o 360°.' },
];

function updateCRMGauge() {
  const score = Math.min(D.areas.reduce((s, a) => s + (AREA_WEIGHTS[a] || 10), 0), 100);
  const wrap = document.getElementById('crm-gauge-wrap');
  if (!wrap) return;
  if (!D.areas.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';

  const arc = document.getElementById('gauge-arc');
  arc.style.strokeDashoffset = String(176 - (score / 100) * 176);

  const level = GAUGE_LEVELS.reduce((best, l) => score >= l.min ? l : best, GAUGE_LEVELS[0]);
  arc.style.stroke = level.color;

  const numEl = document.getElementById('gauge-num');
  numEl.style.color = level.color;
  animateGaugeNum(numEl, score);
  document.getElementById('gauge-msg').textContent = level.msg;
}

function animateGaugeNum(el, target) {
  clearInterval(el._gt);
  let cur = +el.textContent || 0;
  el._gt = setInterval(() => {
    cur += Math.max(1, Math.ceil((target - cur) / 8));
    if (cur >= target) { cur = target; clearInterval(el._gt); }
    el.textContent = cur;
  }, 16);
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }

function _silentOk() {
  document.getElementById('c4').classList.remove('show');
  document.getElementById('c-ok').classList.add('show');
}

async function sendToMake(payload) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) return { ok: true };
    } catch (e) {
      if (i === 3) return { ok: false, reason: 'network' };
      await new Promise(r => setTimeout(r, i * 900));
    }
  }
  return { ok: false, reason: 'failed' };
}

async function doSubmit() {
  const _sc = SC.security;
  if (_sc) {
    if (_sc.honeypot && document.getElementById('_hp')?.value) return _silentOk();
    if (((Date.now() - (window._t0 || 0)) / 1000) < (_sc.minFillSeconds || 5)) return _silentOk();
  }
  const emailInp = document.getElementById('cn-em');
  const email = emailInp.value.trim();
  if (!email || !isValidEmail(email)) { emailInp.focus(); emailInp.style.borderColor = '#ef4444'; return; }
  emailInp.style.borderColor = '';

  const btn = document.getElementById('sub-btn');
  btn.textContent = 'Wysyłanie…'; btn.disabled = true;

  const result = await sendToMake({
    _route:    'crm',
    template:  'crm-enterprise',
    industry:  D.industry,
    size:      D.size,
    model:     D.model,
    areas:     D.areas,
    role:      D.role,
    timeline:  D.timeline,
    budget:    D.budget,
    first_name: document.getElementById('cn-fn').value.trim(),
    last_name:  document.getElementById('cn-ln').value.trim(),
    company:    document.getElementById('cn-co').value.trim(),
    title:      document.getElementById('cn-ti').value.trim(),
    email,
    phone:      document.getElementById('cn-ph').value.trim(),
    timestamp:  new Date().toISOString(),
  });

  document.getElementById('c4').classList.remove('show');
  document.getElementById('c-ok').classList.add('show');
  const hs4 = document.getElementById('hs4');
  if (hs4) { hs4.classList.remove('active'); hs4.classList.add('done'); hs4.querySelector('.h-sn').textContent = '✓'; }
  document.getElementById('prog').style.width = '100%';

  if (!result.ok && result.reason !== 'no-url') {
    const note = document.getElementById('ok-err');
    if (note) note.style.display = 'flex';
  }
}

function setupHandlers() {
  document.querySelectorAll('.pill[data-g]').forEach(p => p.addEventListener('click', function() { pickPill(this); }));
  document.querySelectorAll('.area-card').forEach(c => c.addEventListener('click', function() { togArea(this); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', function() { go(+this.dataset.goto); }));
  document.querySelectorAll('[data-gonext]').forEach(b => b.addEventListener('click', function() { goNext(+this.dataset.gonext); }));
  document.getElementById('sub-btn')?.addEventListener('click', doSubmit);
  document.querySelectorAll('[data-action="reload"]').forEach(b => b.addEventListener('click', () => location.reload()));
}
setupHandlers();
