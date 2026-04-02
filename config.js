/**
 * ═══════════════════════════════════════════════════════════════════
 *  KONFIGURACJA KLIENTA — config.js
 * ───────────────────────────────────────────────────────────────────
 *  Jedyny plik, który edytujesz przy wdrożeniu dla nowego klienta.
 *  Wszystkie szablony automatycznie pobierają stąd ustawienia.
 * ═══════════════════════════════════════════════════════════════════
 */
window.SITE_CONFIG = {

  // ── BRANDING ────────────────────────────────────────────────────
  //  Nazwa pojawia się w nagłówku / logotypie każdego szablonu.
  brand: {
    name: 'TwojaSaaS',      // ← Zmień na nazwę klienta
  },

  // ── MAKE.COM — adresy webhooków ─────────────────────────────────
  //  Jak uzyskać URL webhooka:
  //    1. Wejdź na make.com i utwórz nowy scenariusz
  //    2. Dodaj moduł: Webhooks → Custom webhook → Add
  //    3. Skopiuj wygenerowany URL i wklej poniżej
  //
  //  Każdy szablon ma osobny webhook (możesz wpisać ten sam URL
  //  do wszystkich, jeśli chcesz jedno miejsce odbioru).
  //
  webhooks: {
    chat:      '',   // ← index.html              (styl: konwersacyjny chat)
    saas:      '',   // ← template-saas.html       (styl: wizard z sidebarem)
    ecommerce: '',   // ← template-ecommerce.html  (styl: wizualny quiz)
    finance:   '',   // ← template-finance.html    (styl: panel zaufania)
    wellness:  '',   // ← template-wellness.html   (styl: jedno pytanie naraz)
    crm:       '',   // ← template-crm.html         (styl: enterprise CRM/wizard)
    sports:      '',   // ← template-sports.html        (styl: klub sportowy)
    industrial:  '',   // ← template-industrial.html   (styl: przemysł / CNC)
  },

  // ── ZABEZPIECZENIA ───────────────────────────────────────────────
  security: {
    // Pole-pułapka (honeypot): niewidoczne dla użytkownika, wypełniane
    // automatycznie przez boty. Takie zgłoszenia są cicho blokowane —
    // bot "widzi" sukces, ale dane nie trafiają do Make.com.
    honeypot: true,

    // Minimalny czas (sekundy) od otwarcia strony do wysłania formularza.
    // Zbyt szybkie zgłoszenie (np. < 5 s) = prawdopodobnie bot.
    minFillSeconds: 5,
  },

};
