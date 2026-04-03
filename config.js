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
    name: 'Karate Orzeł Poznań',      // ← Zmień na nazwę klienta
  },

  // ── MAKE.COM — adresy webhooków ─────────────────────────────────
  //  Webhooki są teraz chronione po stronie serwera.
  //  Ustaw poniższe zmienne środowiskowe w panelu Vercel
  //  (Settings → Environment Variables):
  //
  //    MAKE_WEBHOOK_CHAT
  //    MAKE_WEBHOOK_SAAS
  //    MAKE_WEBHOOK_ECOMMERCE
  //    MAKE_WEBHOOK_FINANCE
  //    MAKE_WEBHOOK_WELLNESS
  //    MAKE_WEBHOOK_CRM
  //    MAKE_WEBHOOK_SPORTS
  //    MAKE_WEBHOOK_INDUSTRIAL
  //
  //  Formularze wysyłają dane do /api/submit (serverless proxy),
  //  który odczytuje URL webhooka z env i przekazuje dalej.
  //  URL webhooka nigdy nie trafia do przeglądarki klienta.

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
