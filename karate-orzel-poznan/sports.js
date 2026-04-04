window._t0 = Date.now();

// ── CONFIG ────────────────────────────────────────────────────
const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
const CONFIG = {
  brandName:       SC.brand?.name               || 'Karate Orzeł Poznań',
  honeypot:        SC.security?.honeypot        ?? true,
  minFillSeconds:  SC.security?.minFillSeconds  ?? 5,
};

// ── BRANDING ──────────────────────────────────────────────────
document.getElementById('hBrand').textContent = CONFIG.brandName;
// inicjały ustawione na stałe w HTML jako KO — nie nadpisujemy

// ── STATE ─────────────────────────────────────────────────────
let currentStep = 1;

// ── UTILS ─────────────────────────────────────────────────────
function sanitize(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }

function goStep(n) {
  document.getElementById('s'+currentStep).classList.remove('active');
  currentStep = n;
  document.getElementById('s'+n).classList.add('active');
  updateProgress(n);
  window.scrollTo({top:0, behavior:'smooth'});
}
function updateProgress(n) {
  document.getElementById('hProgLabel').textContent = 'Krok '+n+' z 4';
  document.getElementById('hProgFill').style.width = (n/4*100)+'%';
}

// ── KOLORY DYSCYPLIN KARATE ───────────────────────────────────
const SPORT_COLORS = {
  karate:     { hex: '#ef4444', r:239, g:68,  b:68,  dk: '#dc2626' },
  kumite:     { hex: '#f97316', r:249, g:115, b:22,  dk: '#ea580c' },
  kata:       { hex: '#a78bfa', r:167, g:139, b:250, dk: '#7c3aed' },
  samoobrona: { hex: '#38bdf8', r:56,  g:189, b:248, dk: '#0284c7' },
  dzieci:     { hex: '#4ade80', r:74,  g:222, b:128, dk: '#16a34a' },
  mlodziez:   { hex: '#fbbf24', r:251, g:191, b:36,  dk: '#d97706' },
};

function applyAccent(sport) {
  const c = SPORT_COLORS[sport] || SPORT_COLORS.karate;
  const r = document.documentElement;
  r.style.setProperty('--accent', c.hex);
  r.style.setProperty('--accent-dk', c.dk);
  r.style.setProperty('--accent-lt', 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',.14)');
}

document.querySelectorAll('.sport-card').forEach(c => {
  c.addEventListener('click', () => {
    c.classList.toggle('selected');
    const sel = [...document.querySelectorAll('.sport-card.selected')];
    if (sel.length > 0) applyAccent(sel[sel.length - 1].dataset.val);
    else applyAccent('karate');
  });
});

// ── SINGLE-SELECT: pills with data-group ──────────────────────
document.querySelectorAll('.pill[data-group]').forEach(p => {
  p.addEventListener('click', () => {
    const g = p.dataset.group;
    document.querySelectorAll('.pill[data-group="'+g+'"]').forEach(x => x.classList.remove('selected'));
    p.classList.add('selected');
    if (g === 'time') updateSchedule();
  });
});

// ── WEEKLY SCHEDULE VISUALIZER ───────────────────────────────
const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const TIME_LABELS = {
  morning:   'Rano (6:00–10:00)',
  afternoon: 'Popołudnie (14:00–18:00)',
  evening:   'Wieczór (18:00–22:00)',
  flexible:  'Elastycznie',
};

function updateSchedule() {
  const days = getSelectedDays();
  const time = getPillVal('time');
  const panel = document.getElementById('sched-panel');
  if (days.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  DAY_ORDER.forEach(d => {
    const col = document.getElementById('sd-' + d);
    if (col) col.classList.toggle('active', days.includes(d));
  });
  const n = days.length;
  const sessWord = n === 1 ? 'sesja' : n < 5 ? 'sesje' : 'sesji';
  document.getElementById('sched-sessions').textContent = n + ' ' + sessWord + ' / tydzień';
  document.getElementById('sched-time-lbl').textContent = time ? TIME_LABELS[time] || '' : 'Wybierz porę dnia';
}

// ── MULTI-SELECT: day pills ───────────────────────────────────
document.querySelectorAll('.day-pill').forEach(p => {
  p.addEventListener('click', () => { p.classList.toggle('selected'); updateSchedule(); });
});

// ── STEP VALIDATION ───────────────────────────────────────────
function getSelectedSports() {
  return [...document.querySelectorAll('.sport-card.selected')].map(c=>c.dataset.val);
}
function getSelectedDays() {
  return [...document.querySelectorAll('.day-pill.selected')].map(p=>p.dataset.val);
}
function getPillVal(group) {
  const el = document.querySelector('.pill[data-group="'+group+'"].selected');
  return el ? el.dataset.val : '';
}

function go1() {
  const err = document.getElementById('e1');
  if (getSelectedSports().length === 0) { err.classList.add('show'); return; }
  err.classList.remove('show');
  goStep(2);
}
function go2() {
  const err = document.getElementById('e2');
  if (!getPillVal('who') || !getPillVal('level')) { err.classList.add('show'); return; }
  err.classList.remove('show');
  goStep(3);
}
function go3() {
  const err = document.getElementById('e3');
  if (getSelectedDays().length === 0 || !getPillVal('time')) { err.classList.add('show'); return; }
  err.classList.remove('show');
  goStep(4);
}

function _silentOk() {
  document.querySelectorAll('.step').forEach(s => s.style.display='none');
  document.getElementById('success').style.display='block';
}

async function doSubmit() {
  const email = document.getElementById('fEmail').value.trim();
  const err = document.getElementById('e4');

  if (!isValidEmail(email)) { err.classList.add('show'); return; }
  err.classList.remove('show');

  if (CONFIG.honeypot && document.getElementById('hp').value !== '') { _silentOk(); return; }
  if ((Date.now() - window._t0) / 1000 < CONFIG.minFillSeconds) { _silentOk(); return; }

  const btn = document.getElementById('btnSubmit');
  btn.disabled = true; btn.textContent = 'Wysyłam…';

  const payload = {
    _route:    'sports',
    template:  'karate-orzel-poznan',
    sports:    getSelectedSports(),
    who:       getPillVal('who'),
    level:     getPillVal('level'),
    days:      getSelectedDays(),
    time:      getPillVal('time'),
    name:      document.getElementById('fName').value.trim(),
    surname:   document.getElementById('fSurname').value.trim(),
    email:     email,
    phone:     document.getElementById('fPhone').value.trim(),
    brand:     CONFIG.brandName,
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    document.querySelectorAll('.step').forEach(s => s.style.display='none');
    document.getElementById('success').style.display='block';
    document.getElementById('hProgFill').style.width='100%';
    document.getElementById('hProgLabel').textContent='Gotowe!';
  } catch(e) {
    btn.disabled = false; btn.textContent = 'Zapisz mnie →';
    console.error('[karate] Błąd wysyłki:', e);
    err.textContent = 'Wystąpił błąd. Spróbuj ponownie za chwilę.';
    err.classList.add('show');
  }
}

function setupHandlers() {
  document.querySelectorAll('[data-action="go1"]').forEach(b => b.addEventListener('click', go1));
  document.querySelectorAll('[data-action="go2"]').forEach(b => b.addEventListener('click', go2));
  document.querySelectorAll('[data-action="go3"]').forEach(b => b.addEventListener('click', go3));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', function() { goStep(+this.dataset.goto); }));
  document.getElementById('btnSubmit')?.addEventListener('click', doSubmit);
}
setupHandlers();
