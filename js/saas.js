  /* ═══════════════════════════════════════════════════════════════
     KONFIGURACJA MAKE.COM — zmień tylko tę sekcję
     ───────────────────────────────────────────────────────────────
     Jak podłączyć webhook:
       1. Wejdź na make.com → utwórz nowy scenariusz
       2. Dodaj moduł: Webhooks → Custom webhook
       3. Kliknij "Add" i nadaj nazwę, np. "Onboarding SaaS"
       4. Skopiuj wygenerowany URL i wklej poniżej
     ═══════════════════════════════════════════════════════════════ */
  // Odczytaj konfigurację z config.js; lokalne wartości jako fallback
  const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
  const CONFIG = {
    webhookUrl: SC.webhooks?.saas      || '',
    brandName:  SC.brand?.name         || 'TwojaSaaS',
  };
  window._t0 = Date.now(); // pomiar czasu wypełnienia formularza

  /*  POLA WYSYŁANE DO MAKE.COM (widoczne w scenariuszu):
      ┌──────────────┬──────────────────────────────────────────┐
      │ template     │ "saas-wizard"                            │
      │ company      │ nazwa firmy                              │
      │ website      │ adres strony (opcjonalny)                │
      │ industry     │ tech / retail / services / other         │
      │ goals        │ ["sales","automate","team","analytics"…] │
      │ teamsize     │ 1 / 2-10 / 11-50 / 50+                  │
      │ role         │ owner / manager / marketing / dev / other│
      │ name         │ imię i nazwisko                          │
      │ email        │ adres e-mail                             │
      │ phone        │ telefon (opcjonalny)                     │
      │ timestamp    │ data i czas w formacie ISO 8601          │
      └──────────────┴──────────────────────────────────────────┘  */

  /* ── helper: wyślij do Make.com z retry (3 próby) ── */
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254; }
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function isValidUrl(u) {
    if (!u) return true; // optional field
    try { const p = new URL(u); return p.protocol === 'http:' || p.protocol === 'https:'; } catch { return false; }
  }

  function _silentOk() {
    document.getElementById('c4').classList.remove('show');
    document.getElementById('c-ok').classList.add('show');
  }

  async function sendToMake(payload) {
    if (!CONFIG.webhookUrl || CONFIG.webhookUrl === '') {
      console.warn('[Make.com] webhookUrl nie jest ustawiony w CONFIG. Uzupełnij pole webhookUrl.');
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
  const D = { industry:'', goals:[], teamsize:'', role:'' };
  let cur = 1;
  const PROG = { 1:25, 2:50, 3:75, 4:100 };

  /* wstaw nazwę marki z CONFIG */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.brand-name').forEach(el => el.textContent = CONFIG.brandName);
  });

  function go(n) {
    const fwd = n > cur;
    document.getElementById('c' + cur).classList.remove('show');
    const navOld = document.getElementById('nav-' + cur);
    if (navOld) {
      if (fwd) {
        navOld.classList.remove('active'); navOld.classList.add('done');
        navOld.querySelector('.ns-num').textContent = '✓';
      } else {
        navOld.classList.remove('active', 'done');
        navOld.querySelector('.ns-num').textContent = String(cur);
      }
    }
    cur = n;
    document.getElementById('c' + n).classList.add('show');
    document.getElementById('step-num').textContent = n;
    document.getElementById('prog').style.width = PROG[n] + '%';
    const navNew = document.getElementById('nav-' + n);
    if (navNew) { navNew.classList.add('active'); navNew.classList.remove('done'); navNew.querySelector('.ns-num').textContent = String(n); }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateSidePicks(n);
  }

  function goNext(n) {
    const prev = n - 1;
    const err = document.getElementById('err' + prev);
    let ok = true;
    if (prev === 1 && !D.industry) ok = false;
    if (prev === 2 && (!D.goals || !D.goals.length)) ok = false;
    if (prev === 3 && (!D.teamsize || !D.role)) ok = false;
    if (!ok) { if (err) { err.classList.add('show'); err.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } return; }
    if (err) err.classList.remove('show');
    go(n);
  }

  const SP_LABELS = {
    industry: { tech:'Technologia', retail:'Handel / Retail', services:'Usługi B2B', other:'Inna' },
    goals: { sales:'Sprzedaż', automate:'Automatyzacja', team:'Zarządzanie', analytics:'Analityka', ux:'UX', costs:'Koszty' },
    teamsize: { '1':'Tylko ja', '2-10':'2–10 osób', '11-50':'11–50 osób', '50+':'Ponad 50' },
    role: { owner:'Właściciel / CEO', manager:'Kierownik', marketing:'Marketing', dev:'Programista', other:'Inna' },
  };
  function updateSidePicks(step) {
    if (step <= 1) return;
    const rows = [];
    if (D.industry) rows.push({ l: 'Branża', v: SP_LABELS.industry[D.industry] || D.industry });
    if (D.goals && D.goals.length) rows.push({ l: 'Cele', v: D.goals.map(g => SP_LABELS.goals[g] || g).join(', ') });
    if (D.teamsize) rows.push({ l: 'Rozmiar', v: SP_LABELS.teamsize[D.teamsize] || D.teamsize });
    if (!rows.length) return;
    document.getElementById('spicks').style.display = 'block';
    document.getElementById('spicks-inner').innerHTML = rows.map(r =>
      '<div class="sp-row"><div class="sp-dot"></div><div><div class="sp-lbl">' + esc(r.l) + '</div><div class="sp-val">' + esc(r.v) + '</div></div></div>'
    ).join('');
  }

  function pickOne(el) {
    const g = el.dataset.g;
    document.querySelectorAll('[data-g="' + g + '"]').forEach(c => c.classList.remove('picked'));
    el.classList.add('picked');
    D[g] = el.dataset.v;
  }

  function pickMany(el) {
    el.classList.toggle('picked');
    const g = el.dataset.g;
    if (!D[g]) D[g] = [];
    const v = el.dataset.v;
    D[g] = el.classList.contains('picked') ? [...new Set([...D[g], v])] : D[g].filter(x => x !== v);
  }

  function pickPill(el) {
    const g = el.dataset.g;
    document.querySelectorAll('.pill[data-g="' + g + '"]').forEach(b => b.classList.remove('picked'));
    el.classList.add('picked');
    D[g] = el.dataset.v;
  }

  async function doSubmit() {
    // ── ochrona przed botami ──
    const _sc = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG.security : null;
    if (_sc) {
      if (_sc.honeypot && document.getElementById('_hp')?.value) return _silentOk();
      if (((Date.now() - (window._t0 || 0)) / 1000) < (_sc.minFillSeconds || 5)) return _silentOk();
    }
    const emailInp = document.getElementById('f-email');
    const email = emailInp.value.trim();
    if (!email || !isValidEmail(email)) { emailInp.focus(); emailInp.style.borderColor = '#ef4444'; return; }
    emailInp.style.borderColor = '';

    const urlInp = document.getElementById('f-website');
    const website = urlInp.value.trim();
    if (website && !isValidUrl(website)) { urlInp.focus(); urlInp.style.borderColor = '#ef4444'; return; }
    urlInp.style.borderColor = '';

    const btn = document.getElementById('submit-btn');
    btn.textContent = 'Wysyłanie…'; btn.disabled = true;

    const payload = {
      template:  'saas-wizard',
      company:   document.getElementById('f-company').value.trim(),
      website:   document.getElementById('f-website').value.trim(),
      industry:  D.industry,
      goals:     D.goals,
      teamsize:  D.teamsize,
      role:      D.role,
      name:      document.getElementById('f-name').value.trim(),
      email,
      phone:     document.getElementById('f-phone').value.trim(),
      timestamp: new Date().toISOString(),
    };

    const result = await sendToMake(payload);

    /* pokaż ekran sukcesu */
    document.getElementById('c4').classList.remove('show');
    document.getElementById('c-ok').classList.add('show');
    const n4 = document.getElementById('nav-4');
    if (n4) { n4.classList.remove('active'); n4.classList.add('done'); n4.querySelector('.ns-num').textContent = '✓'; }
    document.getElementById('prog').style.width = '100%';

    /* jeśli webhook nie odpowiedział — pokaż notatkę techniczną */
    if (!result.ok && result.reason !== 'no-url') {
      const note = document.getElementById('ok-err');
      if (note) note.style.display = 'flex';
    }
  }

function setupHandlers() {
  document.querySelectorAll('.sel-card[data-g]').forEach(c => c.addEventListener('click', function() { pickOne(this); }));
  document.querySelectorAll('.goal-card[data-g]').forEach(c => c.addEventListener('click', function() { pickMany(this); }));
  document.querySelectorAll('.pill[data-g]').forEach(p => p.addEventListener('click', function() { pickPill(this); }));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', function() { go(+this.dataset.goto); }));
  document.querySelectorAll('[data-gonext]').forEach(b => b.addEventListener('click', function() { goNext(+this.dataset.gonext); }));
  document.getElementById('submit-btn')?.addEventListener('click', doSubmit);
  document.querySelectorAll('[data-action="reload"]').forEach(b => b.addEventListener('click', () => location.reload()));
}
setupHandlers();
