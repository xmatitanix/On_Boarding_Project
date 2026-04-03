window._t0 = Date.now();

const SC = (typeof SITE_CONFIG !== 'undefined') ? SITE_CONFIG : {};
const CONFIG = {
  brandName:      SC.brand?.name               || 'MetalWorks',
  honeypot:       SC.security?.honeypot        ?? true,
  minFillSeconds: SC.security?.minFillSeconds  ?? 5,
};

document.getElementById('hBrand').textContent = CONFIG.brandName;
const _ini = CONFIG.brandName.replace(/[^a-zA-Z\u00C0-\u024F\s]/g,'').split(/\s+/).map(w=>w[0]||'').join('').slice(0,3).toUpperCase()||'CNC';
document.getElementById('hMark').textContent = _ini;

let currentStep = 1;

function sanitize(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function isValidEmail(e) {
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim());
}

function goStep(n) {
  document.getElementById('s'+currentStep).classList.remove('active');
  currentStep = n;
  document.getElementById('s'+n).classList.add('active');
  updateHeader(n);
  window.scrollTo({top:0,behavior:'smooth'});
}
function updateHeader(n) {
  document.getElementById('progFill').style.width = (Math.min(n,4)/4*100)+'%';
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('hs'+i);
    el.classList.remove('active','done');
    if (i < n)  el.classList.add('done');
    if (i === n) el.classList.add('active');
    el.querySelector('.h-sn').textContent = i < n ? '\u2713' : String(i);
  });
}

document.querySelectorAll('.prod-card').forEach(c => {
  c.addEventListener('click', () => c.classList.toggle('selected'));
});
document.querySelectorAll('.pill[data-group]').forEach(p => {
  p.addEventListener('click', () => {
    document.querySelectorAll('.pill[data-group="'+p.dataset.group+'"]').forEach(x=>x.classList.remove('selected'));
    p.classList.add('selected');
    updateEstimate();
  });
});

function updateEstimate() {
  const qty = getPill('qty');
  const deadline = getPill('deadline');
  if (!qty && !deadline) return;
  const BASE = { '1_10': [3,7], '11_100': [7,14], '101_500': [14,30], '500plus': [25,60] };
  const FACTOR = { '2w': .8, '4w': 1, '3m': 1.3, 'open': 1 };
  let range = BASE[qty] || [7, 21];
  const f = FACTOR[deadline] || 1;
  const lo = Math.round(range[0] * f), hi = Math.round(range[1] * f);
  const panel = document.getElementById('est-panel');
  panel.style.display = 'block';
  document.getElementById('est-value').textContent = lo + '–' + hi + ' dni roboczych';
  const notes = { '2w': 'Tryb ekspresowy — potwierdzimy dostępność po otrzymaniu zapytania.', '4w': 'Standardowy termin dla tej skali produkcji.', '3m': 'Komfortowy harmonogram — czas na optymalizację procesu.', 'open': 'Termin do ustalenia po analizie dokumentacji.' };
  document.getElementById('est-note').textContent = notes[deadline] || '';
}

function getProds()   { return [...document.querySelectorAll('.prod-card.selected')].map(c=>c.dataset.val); }
function getPill(grp) { const el=document.querySelector('.pill[data-group="'+grp+'"].selected'); return el?el.dataset.val:''; }

function go1() {
  const err=document.getElementById('e1');
  if (getProds().length===0) { err.classList.add('show'); return; }
  err.classList.remove('show'); goStep(2);
}
function go2() {
  const err=document.getElementById('e2');
  if (!getPill('mat')||!getPill('qty')||!getPill('deadline')) { err.classList.add('show'); return; }
  err.classList.remove('show'); goStep(3);
}
function go3() {
  const err=document.getElementById('e3');
  if (!getPill('order')||!getPill('industry')) { err.classList.add('show'); return; }
  err.classList.remove('show'); goStep(4);
}

function _silentOk() {
  document.querySelectorAll('.step').forEach(s=>{ s.style.display='none'; });
  document.getElementById('success').style.display='block';
  document.getElementById('progFill').style.width='100%';
}

async function doSubmit() {
  const emailVal = document.getElementById('fEmail').value.trim();
  const err4 = document.getElementById('e4');
  if (!isValidEmail(emailVal)) {
    err4.textContent = 'Podaj prawidłowy adres e-mail.';
    err4.classList.add('show'); return;
  }
  err4.classList.remove('show');
  if (CONFIG.honeypot && document.getElementById('hp').value !== '') { _silentOk(); return; }
  if ((Date.now()-window._t0)/1000 < CONFIG.minFillSeconds) { _silentOk(); return; }
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true; btn.textContent = 'Wysyłam\u2026';
  const payload = {
    _route:     'industrial',
    template:   'industrial-cnc',
    products:   getProds(),
    material:   getPill('mat'),
    quantity:   getPill('qty'),
    deadline:   getPill('deadline'),
    order_type: getPill('order'),
    industry:   getPill('industry'),
    name:       document.getElementById('fName').value.trim(),
    company:    document.getElementById('fCompany').value.trim(),
    email:      emailVal,
    phone:      document.getElementById('fPhone').value.trim(),
    brand:      CONFIG.brandName,
    timestamp:  new Date().toISOString(),
  };
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('HTTP '+res.status);
    document.querySelectorAll('.step').forEach(s=>{ s.style.display='none'; });
    document.getElementById('success').style.display='block';
    document.getElementById('progFill').style.width='100%';
    updateHeader(5);
  } catch(e) {
    btn.disabled=false; btn.textContent='Wyślij zapytanie \u2192';
    err4.textContent='Błąd połączenia. Spróbuj ponownie.';
    err4.classList.add('show');
  }
}

function setupHandlers() {
  document.querySelectorAll('[data-action="go1"]').forEach(b => b.addEventListener('click', go1));
  document.querySelectorAll('[data-action="go2"]').forEach(b => b.addEventListener('click', go2));
  document.querySelectorAll('[data-action="go3"]').forEach(b => b.addEventListener('click', go3));
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', function() { goStep(+this.dataset.goto); }));
  document.getElementById('btnSubmit')?.addEventListener('click', doSubmit);
  document.querySelectorAll('[data-action="reload"]').forEach(b => b.addEventListener('click', () => location.reload()));
}
setupHandlers();
