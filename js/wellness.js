window._t0 = Date.now();

/* ═══════════════════════════════════════════════════════════════
   KONFIGURACJA MAKE.COM — zmień tylko tę sekcję
   ───────────────────────────────────────────────────────────────
   Jak podłączyć webhook:
     1. Wejdź na make.com → utwórz nowy scenariusz
     2. Dodaj moduł: Webhooks → Custom webhook
     3. Kliknij "Add" i nadaj nazwę, np. "Onboarding Wellness"
     4. Skopiuj wygenerowany URL i wklej poniżej
   ═══════════════════════════════════════════════════════════════ */
// Odczytaj konfigurację z config.js; lokalne wartości jako fallback
const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
const CONFIG = {
  webhookUrl: SC.webhooks?.wellness || '',
  brandName:  SC.brand?.name        || 'TwojaKlinika',
};

/*  POLA WYSYŁANE DO MAKE.COM:
    ┌──────────────┬───────────────────────────────────────────────────┐
    │ template     │ "wellness-calm"                                   │
    │ need         │ relax / health / mental / beauty / general        │
    │ priorities   │ ["personal","results","comfort","online","price"] │
    │ timeline     │ now / soon / later                                │
    │ name         │ imię                                              │
    │ email        │ adres e-mail                                      │
    │ phone        │ telefon (opcjonalny)                              │
    │ timestamp    │ data i czas w formacie ISO 8601                   │
    └──────────────┴───────────────────────────────────────────────────┘  */

/* ── helper: wyślij do Make.com z retry (3 próby) ── */
async function sendToMake(payload) {
  if (!CONFIG.webhookUrl) {
    console.warn('[Make.com] webhookUrl nie jest ustawiony w CONFIG.');
    return { ok: false, reason: 'no-url' };
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(CONFIG.webhookUrl, {
        method: 'POST',
        credentials: 'omit',
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
const WD = { need:'', priorities:[], timeline:'' };
let cur = 1;

document.querySelectorAll('.brand-name').forEach(el => el.textContent = CONFIG.brandName);

function goW(n) {
  const dir = n > cur ? 'slide-fwd' : 'slide-back';
  document.getElementById('w' + cur).classList.remove('vis', 'slide-fwd', 'slide-back');
  cur = n;
  const next = document.getElementById('w' + n) || document.getElementById('w-ok');
  next.classList.add('vis', dir);
  next.addEventListener('animationend', () => next.classList.remove(dir), { once: true });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function pickW1(el) {
  document.querySelectorAll('#w1 .opt').forEach(o => o.classList.remove('on'));
  el.classList.add('on');
  WD.need = el.dataset.v;
  setTimeout(() => goW(2), 260);
}

function togW2(el) {
  el.classList.toggle('on');
  const v = el.dataset.v;
  WD.priorities = el.classList.contains('on') ? [...new Set([...WD.priorities, v])] : WD.priorities.filter(x => x !== v);
}

function pickW3(el) {
  document.querySelectorAll('#w3 .opt').forEach(o => o.classList.remove('on'));
  el.classList.add('on');
  WD.timeline = el.dataset.v;
  setTimeout(() => goW(4), 260);
}

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }

function _silentOk() {
  const name = document.getElementById('wl-nm').value.trim();
  document.getElementById('ok-name').textContent = name || 'drogi gościu';
  document.getElementById('ok-em').textContent = document.getElementById('wl-em').value.trim();
  document.getElementById('w4').classList.remove('vis');
  document.getElementById('w-ok').classList.add('vis');
}

async function wlSubmit() {
  const _sc = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.security : null;
  if (_sc) {
    if (_sc.honeypot && document.getElementById('_hp')?.value) return _silentOk();
    if (((Date.now() - (window._t0 || 0)) / 1000) < (_sc.minFillSeconds || 5)) return _silentOk();
  }
  const emailInp = document.getElementById('wl-em');
  const email = emailInp.value.trim();
  if (!email || !isValidEmail(email)) { emailInp.focus(); emailInp.style.borderColor = '#ef4444'; return; }
  emailInp.style.borderColor = '';

  const btn = document.getElementById('wl-sub');
  btn.textContent = 'Wysyłanie…'; btn.disabled = true;
  const name = document.getElementById('wl-nm').value.trim();

  const payload = {
    template:   'wellness-calm',
    need:       WD.need,
    priorities: WD.priorities,
    timeline:   WD.timeline,
    energy:     document.getElementById('wl-energy')?.value || '3',
    name,
    email,
    phone:      document.getElementById('wl-ph').value.trim(),
    timestamp:  new Date().toISOString(),
  };

  const result = await sendToMake(payload);

  document.getElementById('ok-name').textContent = name || 'drogi gościu';
  document.getElementById('ok-em').textContent = email;
  document.getElementById('w4').classList.remove('vis');
  document.getElementById('w-ok').classList.add('vis');
  cur = 99;

  if (!result.ok && result.reason !== 'no-url') {
    const note = document.getElementById('ok-err');
    if (note) note.style.display = 'block';
  }
}

/* ── Energy slider ───────────────────────────────────────────── */
const ENERGY_LABELS = {
  1: 'Niski poziom energii — zaczynamy spokojnie, bez presji',
  2: 'Trochę zmęczony/a — dobierzemy łagodne podejście',
  3: 'Normalny poziom — dobry moment na start',
  4: 'Dobra energia — jesteś gotowy/a na zmiany',
  5: 'Wysoka energia 💪 — idealny moment, działamy!',
};

function setupHandlers() {
  document.querySelectorAll('#w1 .opt').forEach(el => el.addEventListener('click', function() { pickW1(this); }));
  document.querySelectorAll('#w2 .opt').forEach(el => el.addEventListener('click', function() { togW2(this); }));
  document.querySelectorAll('#w3 .opt').forEach(el => el.addEventListener('click', function() { pickW3(this); }));
  document.querySelectorAll('[data-gow]').forEach(b => b.addEventListener('click', function() { goW(+this.dataset.gow); }));
  document.querySelectorAll('[data-action="submit"]').forEach(b => b.addEventListener('click', wlSubmit));
  document.querySelectorAll('[data-action="reload"]').forEach(b => b.addEventListener('click', () => location.reload()));

  const slider = document.getElementById('wl-energy');
  const caption = document.getElementById('energy-caption');
  if (slider && caption) {
    slider.addEventListener('input', () => { caption.textContent = ENERGY_LABELS[slider.value] || ''; });
  }
}
setupHandlers();
