  /* ═══════════════════════════════════════════════════════════════
     KONFIGURACJA MAKE.COM — zmień tylko tę sekcję
     ───────────────────────────────────────────────────────────────
     Jak podłączyć webhook:
       1. Wejdź na make.com → utwórz nowy scenariusz
       2. Dodaj moduł: Webhooks → Custom webhook
       3. Kliknij "Add" i nadaj nazwę, np. "Onboarding Finanse"
       4. Skopiuj wygenerowany URL i wklej poniżej
     ═══════════════════════════════════════════════════════════════ */
  // Odczytaj konfigurację z config.js; lokalne wartości jako fallback
  const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
  const CONFIG = {
    brandName: SC.brand?.name || 'TwojaFirma',
  };
  window._t0 = Date.now();

  /*  POLA WYSYŁANE DO MAKE.COM:
      ┌──────────────┬──────────────────────────────────────────────────────┐
      │ template     │ "finance-trust"                                      │
      │ type         │ finance / law / realestate / consulting / insurance  │
      │ services     │ ["digital","compliance","automation","security",…]   │
      │ timeline     │ asap / 1-2m / q / explore                           │
      │ name         │ imię i nazwisko                                      │
      │ company      │ nazwa firmy                                          │
      │ email        │ adres e-mail                                         │
      │ phone        │ telefon (opcjonalny)                                 │
      │ timestamp    │ data i czas w formacie ISO 8601                      │
      └──────────────┴──────────────────────────────────────────────────────┘  */

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
  const FD = { type:'', services:[], timeline:'' };
  let cur = 1;

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.brand-name').forEach(el => el.textContent = CONFIG.brandName);
  });

  function goTo(n) {
    const fwd = n > cur;
    document.getElementById('f' + cur).classList.remove('vis');
    const bcOld = document.getElementById('bc' + cur);
    if (bcOld) {
      if (fwd) {
        bcOld.classList.remove('active'); bcOld.classList.add('done');
        bcOld.querySelector('.bc-num').textContent = '✓';
      } else {
        bcOld.classList.remove('active', 'done');
        bcOld.querySelector('.bc-num').textContent = String(cur);
      }
    }
    cur = n;
    document.getElementById('f' + n).classList.add('vis');
    const bcNew = document.getElementById('bc' + n);
    if (bcNew) { bcNew.classList.add('active'); bcNew.classList.remove('done'); bcNew.querySelector('.bc-num').textContent = String(n); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goToNext(n) {
    const prev = n - 1;
    const err = document.getElementById('err' + prev);
    let ok = true;
    if (prev === 1 && !FD.type) ok = false;
    if (prev === 2 && !FD.services.length) ok = false;
    if (prev === 3 && !FD.timeline) ok = false;
    if (!ok) { if (err) { err.classList.add('show'); err.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
    if (err) err.classList.remove('show');
    goTo(n);
  }

  function pickType(el) {
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('on'));
    el.classList.add('on'); FD.type = el.dataset.v;
  }
  const COV_LEVELS = [
    { min:  0, color: '#94a3b8', msg: 'Zaznacz obszary, które Cię interesują.' },
    { min: 17, color: '#6366f1', msg: 'Dobry start — możemy to omówić na pierwszym spotkaniu.' },
    { min: 34, color: '#f59e0b', msg: 'Solidny zakres — przygotujemy wstępną wycenę.' },
    { min: 51, color: '#0ea5e9', msg: 'Kompleksowe podejście — to nasza specjalność.' },
    { min: 84, color: '#059669', msg: 'Pełna transformacja — dostaniesz dedykowaną ofertę.' },
  ];

  function updateCoverage() {
    const n = FD.services.length;
    const total = 6;
    const panel = document.getElementById('cov-panel');
    if (n === 0) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    const pct = Math.round(n / total * 100);
    document.getElementById('cov-pct').textContent = pct + '%';
    const level = [...COV_LEVELS].reverse().find(l => pct >= l.min) || COV_LEVELS[0];
    document.getElementById('cov-msg').textContent = level.msg;
    for (let i = 0; i < total; i++) {
      const seg = document.getElementById('cs' + i);
      if (!seg) continue;
      if (i < n) {
        seg.style.background = level.color;
        seg.classList.add('fill');
      } else {
        seg.style.background = '#e2e8f0';
        seg.classList.remove('fill');
      }
    }
  }

  function togSrv(el) {
    el.classList.toggle('on');
    const v = el.dataset.v;
    FD.services = el.classList.contains('on') ? [...new Set([...FD.services, v])] : FD.services.filter(x => x !== v);
    updateCoverage();
  }
  function pickTl(el) {
    document.querySelectorAll('.tl-pill').forEach(p => p.classList.remove('on'));
    el.classList.add('on'); FD.timeline = el.dataset.v;
  }

  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }

  function validateEmail(inp) {
    const hint = document.getElementById('fn-em-hint');
    const v = inp.value.trim();
    if (!v) { inp.classList.remove('valid','invalid'); hint.className='val-hint'; return; }
    if (isValidEmail(v)) {
      inp.classList.add('valid'); inp.classList.remove('invalid');
      hint.className = 'val-hint ok'; hint.textContent = '✓ Prawidłowy adres e-mail';
    } else {
      inp.classList.add('invalid'); inp.classList.remove('valid');
      hint.className = 'val-hint err'; hint.textContent = '✗ Nieprawidłowy format adresu';
    }
  }

  function _silentOk() {
    document.getElementById('f4').classList.remove('vis');
    document.getElementById('f-ok').classList.add('vis');
  }

  async function fnSubmit() {
    const _sc = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.security : null;
    if (_sc) {
      if (_sc.honeypot && document.getElementById('_hp')?.value) return _silentOk();
      if (((Date.now() - (window._t0 || 0)) / 1000) < (_sc.minFillSeconds || 5)) return _silentOk();
    }
    const emailInp = document.getElementById('fn-em');
    const email = emailInp.value.trim();
    if (!email || !isValidEmail(email)) { emailInp.focus(); emailInp.style.borderColor = '#ef4444'; return; }
    emailInp.style.borderColor = '';

    const btn = document.getElementById('fn-sub');
    btn.textContent = 'Wysyłanie…'; btn.disabled = true;

    const payload = {
      _route:    'finance',
      template:  'finance-trust',
      type:      FD.type,
      services:  FD.services,
      timeline:  FD.timeline,
      name:      document.getElementById('fn-nm').value.trim(),
      company:   document.getElementById('fn-co').value.trim(),
      email,
      phone:     document.getElementById('fn-ph').value.trim(),
      timestamp: new Date().toISOString(),
    };

    const result = await sendToMake(payload);

    document.getElementById('f4').classList.remove('vis');
    document.getElementById('f-ok').classList.add('vis');
    const bc4 = document.getElementById('bc4');
    if (bc4) { bc4.classList.remove('active'); bc4.classList.add('done'); bc4.querySelector('.bc-num').textContent = '✓'; }

    if (!result.ok && result.reason !== 'no-url') {
      const note = document.getElementById('ok-err');
      if (note) note.style.display = 'flex';
    }
  }

function setupHandlers() {
  document.querySelectorAll('.type-card').forEach(c => c.addEventListener('click', function() { pickType(this); }));
  document.querySelectorAll('.srv').forEach(c => c.addEventListener('click', function() { togSrv(this); }));
  document.querySelectorAll('.tl-pill').forEach(c => c.addEventListener('click', function() { pickTl(this); }));
  document.getElementById('fn-em')?.addEventListener('input', function() { validateEmail(this); });
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', function() { goTo(+this.dataset.goto); }));
  document.querySelectorAll('[data-gonext]').forEach(b => b.addEventListener('click', function() { goToNext(+this.dataset.gonext); }));
  document.getElementById('fn-sub')?.addEventListener('click', fnSubmit);
  document.querySelectorAll('[data-action="reload"]').forEach(b => b.addEventListener('click', () => location.reload()));
}
setupHandlers();
