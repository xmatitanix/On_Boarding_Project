# Szybkie sprawdzenie bezpieczeństwa (2026-04-01)

## Zakres
Przegląd statyczny plików front-end:
- `index.html`
- `template-saas.html`
- `template-finance.html`
- `template-wellness.html`
- `template-ecommerce.html`

## Wynik (TL;DR)
**Status: wymaga poprawy przed produkcją**.
Największe ryzyka:
1. **DOM XSS w `index.html`** przez osadzanie nieoczyszczonych danych użytkownika w `innerHTML`.
2. **Ekspozycja endpointu webhooka** i wysyłka danych bezpośrednio z klienta.
3. **Brak antybotów i limitowania ruchu** (CAPTCHA/honeypot/rate limiting).
4. **Brak twardych ograniczeń pól** (`maxlength`, `pattern`) w większości formularzy.

## Potwierdzone obserwacje

### 1) DOM XSS (wysokie)
W `index.html` dane użytkownika (`uname`) trafiają bezpośrednio do `innerHTML`:
- `document.getElementById('ub-name').innerHTML = ... ${uname} ...`

To pozwala na wstrzyknięcie HTML/JS (np. payload z tagiem i handlerem zdarzeń).

### 2) Publiczny webhook i brak warstwy serwerowej (wysokie)
- `index.html` zawiera na sztywno URL webhooka Make.com.
- Pozostałe szablony używają `fetch(CONFIG.webhookUrl, ...)` po stronie klienta.

To umożliwia łatwe wykrycie endpointu i potencjalny spam/flooding.

### 3) Brak antyautomatyzacji (wysokie)
W kodzie nie znaleziono mechanizmów typu:
- CAPTCHA / Turnstile,
- honeypot,
- backendowe rate limiting.

### 4) Ograniczona walidacja wejścia (średnie)
- W większości formularzy brak `maxlength` i `pattern` dla pól tekstowych.
- Jedyny widoczny `maxlength` występuje w `index.html` dla pola imienia.

## Rekomendacje (priorytet)

### P0
1. Usunąć podatność XSS: zastąpić `innerHTML` bezpiecznym renderowaniem (`textContent` + tworzenie elementów DOM).
2. Dodać backend/proxy (`/api/lead`) i ukryć webhook Make.com po stronie serwera.
3. Dodać ochronę antybotową (Turnstile/reCAPTCHA + honeypot + rate limiting).

### P1
4. Wprowadzić walidację serwerową i limity długości pól.
5. Dodać security headers i CSP (co najmniej na hostingu/edge):
   - `Content-Security-Policy`
   - `X-Content-Type-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`

## Szybki werdykt
Projekt jest funkcjonalny UX-owo, ale **bez dodatkowej warstwy bezpieczeństwa nie powinien być traktowany jako bezpieczny formularz produkcyjny**.

## Co oznaczają użyte komendy?
Poniżej krótkie wyjaśnienie komend użytych w szybkim audycie:

1. `rg -n "..." index.html template-*.html`  
   - `rg` (ripgrep) szybko przeszukuje pliki tekstowe.
   - `-n` pokazuje numer linii.
   - Służyło do znalezienia ryzykownych wzorców (np. `innerHTML`, `fetch`, `webhook`).

2. `rg -n "AKIA|SECRET|TOKEN|..." ...`  
   - Skan pod kątem przypadkowo ujawnionych sekretów/tokenów w kodzie.
   - To jest tylko szybki heurystyczny check (nie 100% gwarancji).

3. `rg -n "<input|<textarea|maxlength|pattern=|required" ...`  
   - Sprawdzenie, czy pola formularzy mają podstawowe ograniczenia i walidację po stronie HTML.

To były **komendy diagnostyczne (read-only)** — nie zmieniają kodu produkcyjnego.
