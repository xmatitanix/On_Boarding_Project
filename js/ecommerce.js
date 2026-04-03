window._t0 = Date.now();

/* ═══════════════════════════════════════════════════════════════
   KONFIGURACJA MAKE.COM — zmień tylko tę sekcję
   ───────────────────────────────────────────────────────────────
   Jak podłączyć webhook:
     1. Wejdź na make.com → utwórz nowy scenariusz
     2. Dodaj moduł: Webhooks → Custom webhook
     3. Kliknij "Add" i nadaj nazwę, np. "Onboarding E-commerce"
     4. Skopiuj wygenerowany URL i wklej poniżej
   ═══════════════════════════════════════════════════════════════ */
// Odczytaj konfigurację z config.js; lokalne wartości jako fallback
const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
const CONFIG = {
  brandName: SC.brand?.name || 'TwójSklep',
};

/*  POLA WYSYŁANE DO MAKE.COM:
    ┌──────────────┬──────────────────────────────────────────────┐
    │ template     │ "ecommerce-quiz"                             │
    │ industry     │ fashion / electronics / food / beauty / home │
    │ size         │ start / small / medium / large               │
    │ needs        │ ["design","marketing","tech","strategy"]      │
    │ name         │ imię                                         │
    │ email        │ adres e-mail                                 │
    │ phone        │ telefon (opcjonalny)                         │
    │ timestamp    │ data i czas w formacie ISO 8601              │
    └──────────────┴──────────────────────────────────────────────┘  */

/* ── helper: wyślij do Make.com z retry (3 próby) ── */
async function sendToMake(payload) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return { ok: true };
    } catch (err) {
      if (attempt === 3) return { ok: false, reason: 'network', error: err };
      await new Promise(r => setTimeout(r, attempt * 900));
    }
  }
  return { ok: false, reason: 'failed' };
}

/* ── stan formularza ── */
const D = { industry:'', size:'', needs:[] };
let cur = 1;

document.querySelectorAll('.brand-name').forEach(el => el.textContent = CONFIG.brandName);

function setDots(n) {
  for (let i = 1; i <= 4; i++) {
    const d = document.getElementById('d' + i);
    d.className = 'dot' + (i < n ? ' ok' : i === n ? ' on' : '');
  }
}
function nxtV(n) {
  const prev = n - 1;
  const err = document.getElementById('err' + prev);
  let ok = true;
  if (prev === 1 && !D.industry) ok = false;
  if (prev === 2 && !D.size) ok = false;
  if (!ok) { if (err) { err.classList.add('show'); err.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
  if (err) err.classList.remove('show');
  nxt(n);
}
function nxt(n) {
  document.getElementById('s' + cur).classList.remove('vis');
  cur = n;
  document.getElementById('s' + n).classList.add('vis');
  setDots(n);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function prv(n) { nxt(n); }

/* ── Revenue estimator data ─────────────────────────────────── */
const REV_DATA = {
  fashion:     { start:'2–8k',    small:'8–30k',   medium:'30–120k',  large:'120–600k'  },
  electronics: { start:'3–12k',   small:'12–50k',  medium:'50–200k',  large:'200k–1M+'  },
  food:        { start:'5–15k',   small:'15–50k',  medium:'50–180k',  large:'180–700k'  },
  beauty:      { start:'2–8k',    small:'8–28k',   medium:'28–90k',   large:'90–400k'   },
  home:        { start:'3–10k',   small:'10–35k',  medium:'35–140k',  large:'140–600k'  },
  sport:       { start:'2–9k',    small:'9–30k',   medium:'30–110k',  large:'110–500k'  },
};
const REV_GROWTH = {
  start:  { pct:'+120%', lbl:'możliwy wzrost przy profesjonalnej platformie' },
  small:  { pct:'+65%',  lbl:'możliwy wzrost po optymalizacji konwersji' },
  medium: { pct:'+40%',  lbl:'możliwy wzrost przy skalowaniu i automatyzacji' },
  large:  { pct:'+25%',  lbl:'możliwy wzrost przez nowe kanały sprzedaży' },
};

function updateRevPanel() {
  const panel = document.getElementById('rev-panel');
  if (!panel) return;
  if (!D.industry || !D.size) { panel.style.display = 'none'; return; }
  const r = REV_DATA[D.industry];
  const g = REV_GROWTH[D.size];
  if (!r || !g) return;
  panel.style.display = 'block';
  document.getElementById('rev-range').textContent = r[D.size] || '—';
  document.getElementById('rev-pct').textContent = g.pct;
  document.getElementById('rev-lbl').textContent = g.lbl;
}

function pickInd(el) {
  document.querySelectorAll('.ind-card').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  D.industry = el.dataset.v;
  setTimeout(() => nxt(2), 220);
}
function pickSz(el) {
  document.querySelectorAll('.sz').forEach(o => o.classList.remove('on'));
  el.classList.add('on');
  D.size = el.dataset.v;
  setTimeout(() => { nxt(3); updateRevPanel(); }, 220);
}
function togNeed(el) {
  el.classList.toggle('on');
  const v = el.dataset.v;
  D.needs = el.classList.contains('on') ? [...new Set([...D.needs, v])] : D.needs.filter(x => x !== v);
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }

function _silentOk() {
  document.getElementById('ok-email').textContent = document.getElementById('ec-em').value.trim();
  document.getElementById('s4').classList.remove('vis');
  document.getElementById('s-ok').classList.add('vis');
}

async function ecSubmit() {
  const _sc = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.security : null;
  if (_sc) {
    if (_sc.honeypot && document.getElementById('_hp')?.value) return _silentOk();
    if (((Date.now() - (window._t0 || 0)) / 1000) < (_sc.minFillSeconds || 5)) return _silentOk();
  }
  const emailInp = document.getElementById('ec-em');
  const email = emailInp.value.trim();
  if (!email || !isValidEmail(email)) { emailInp.focus(); emailInp.style.borderColor = '#ef4444'; return; }
  emailInp.style.borderColor = '';

  const btn = document.getElementById('ec-sub');
  btn.textContent = 'Wysyłanie…'; btn.disabled = true;

  const payload = {
    _route:    'ecommerce',
    template:  'ecommerce-quiz',
    industry:  D.industry,
    size:      D.size,
    needs:     D.needs,
    name:      document.getElementById('ec-nm').value.trim(),
    email,
    phone:     document.getElementById('ec-ph').value.trim(),
    timestamp: new Date().toISOString(),
  };

  const result = await sendToMake(payload);

  document.getElementById('ok-email').textContent = email;
  document.getElementById('s4').classList.remove('vis');
  document.getElementById('s-ok').classList.add('vis');
  document.querySelectorAll('.dot').forEach(d => { d.className = 'dot ok'; });

  if (!result.ok && result.reason !== 'no-url') {
    const note = document.getElementById('ok-err');
    if (note) note.style.display = 'block';
  }
}

function setupHandlers() {
  document.querySelectorAll('.ind-card').forEach(c => c.addEventListener('click', function() { pickInd(this); }));
  document.querySelectorAll('.sz').forEach(c => c.addEventListener('click', function() { pickSz(this); }));
  document.querySelectorAll('.need').forEach(c => c.addEventListener('click', function() { togNeed(this); }));
  document.querySelectorAll('[data-nxtv]').forEach(b => b.addEventListener('click', function() { nxtV(+this.dataset.nxtv); }));
  document.querySelectorAll('[data-nxt]').forEach(b => b.addEventListener('click', function() { nxt(+this.dataset.nxt); }));
  document.querySelectorAll('[data-prv]').forEach(b => b.addEventListener('click', function() { prv(+this.dataset.prv); }));
  document.getElementById('ec-sub')?.addEventListener('click', ecSubmit);
  document.querySelectorAll('[data-action="reload"]').forEach(b => b.addEventListener('click', () => location.reload()));
}
setupHandlers();
