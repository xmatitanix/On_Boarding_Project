# Ocena bezpieczeństwa formularzy (On_Boarding_Project)

Data przeglądu: 2026-04-01

## Zakres
Przeanalizowane pliki:
- `index.html`
- `template-saas.html`
- `template-finance.html`
- `template-wellness.html`
- `template-ecommerce.html`

## Podsumowanie (high level)
**Ocena ogólna: 4/10 (niski/średni poziom bezpieczeństwa).**

Największe ryzyka dotyczą obecnej architektury wysyłki danych: formularze wysyłają dane bezpośrednio z frontendu do webhooków (Make.com), bez warstwy serwerowej pośredniczącej i bez mechanizmów antyspamowych.

## Najważniejsze ryzyka

### 1) Ekspozycja endpointu webhook po stronie klienta — **Wysokie**
- Wzorzec widoczny we wszystkich szablonach (`fetch(CONFIG.webhookUrl, ...)`) oraz twardo wpisany URL w `index.html`.
- Każdy użytkownik może odczytać endpoint i generować nieautoryzowane zgłoszenia (spam/flooding).

**Wpływ:**
- zalew fałszywymi leadami,
- ryzyko kosztów operacyjnych,
- utrudniona analiza prawdziwych zgłoszeń.

### 2) Brak antyautomatyzacji (CAPTCHA/honeypot/rate limiting) — **Wysokie**
- Brak mechanizmów ograniczających boty.
- Same opóźnienia/retry nie chronią przed nadużyciami.

**Wpływ:** masowe zgłoszenia, potencjalne wyczerpanie limitów usług pośrednich.

### 3) Potencjalny DOM XSS w `index.html` — **Średnie/Wysokie**
- Wartość `uname` trafia do `innerHTML` bez sanityzacji.
- Atakujący może wstrzyknąć HTML/JS przez pole imienia.

**Wpływ:** możliwość uruchomienia złośliwego kodu w przeglądarce użytkownika, utrata integralności strony.

### 4) Walidacja wyłącznie po stronie klienta — **Średnie**
- Walidacje są podstawowe i łatwe do obejścia.
- Brak serwerowej walidacji formatu, długości i typu danych.

**Wpływ:** zanieczyszczenie danych, ryzyko payloadów testujących podatności downstream.

### 5) Brak jawnej obsługi zgód i retencji danych — **Średnie**
- Formularze zbierają dane osobowe (email/telefon), ale nie widać standardowego checkboxa zgody i linków polityki prywatności.

**Wpływ:** ryzyko compliance (RODO/marketing permissions), ryzyko reputacyjne.

## Rekomendacje (priorytety)

## P0 (wdrożyć najpierw)
1. **Wprowadzić backend/proxy API** pomiędzy frontendem i Make.com.
   - Front wysyła dane tylko do własnego endpointu (np. `/api/lead`).
   - Dopiero backend przekazuje dane dalej do Make.com.
2. **Dodać ochronę antybotową**:
   - Cloudflare Turnstile / reCAPTCHA,
   - honeypot + czasowe heurystyki,
   - rate limiting (IP + fingerprint + user-agent).
3. **Usunąć wstrzyknięcia do `innerHTML`** dla danych użytkownika.
   - Używać `textContent` albo funkcji escapującej HTML.

## P1
4. **Walidacja i normalizacja po stronie serwera**:
   - whitelisty długości i wzorców,
   - odrzucanie nietypowych payloadów,
   - logowanie i alerty dla nadużyć.
5. **Podpisywanie żądań (HMAC)** między frontendem a backendem (opcjonalnie wraz z nonce/timestamp).

## P2
6. **CSP + security headers**:
   - Content-Security-Policy,
   - X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
7. **Compliance UX**:
   - checkbox zgody,
   - link do polityki prywatności,
   - jasna informacja o celu i czasie przetwarzania danych.

## Szybkie zwycięstwa (Quick wins)
- Dodać ograniczenia `maxlength` do pól tekstowych.
- Zastąpić dynamiczne HTML stringi bezpiecznym renderowaniem tekstu.
- Dodać prosty honeypot jeszcze przed wdrożeniem pełnego CAPTCHA.

## Wniosek
Obecne formularze są dobre UX-owo, ale **nie powinny być traktowane jako bezpieczny kanał produkcyjny** bez warstwy backendowej i antybotowej. Przed kampaniami płatnymi rekomendowane jest wdrożenie planu P0.
