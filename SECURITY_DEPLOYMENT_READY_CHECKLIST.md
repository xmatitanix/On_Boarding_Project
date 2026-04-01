# Security deployment-ready checklist (frontend + backend)

## Co zostało dodane w kopiach `.secure.html`
- CSP i `referrer` meta (baseline dla frontendu).
- Usunięcie bezpośrednich webhooków z klienta na rzecz `/api/lead`.
- Antyspam na froncie: honeypot + minimalny czas wypełnienia + cooldown między wysyłkami.
- Ograniczenia pól: `maxlength`, `required`, `pattern` (telefon).
- Ograniczenie DOM XSS w `index.secure.html` przez bezpieczne renderowanie `textContent`.

## Co MUSI być po stronie backendu (żeby było realnie bezpieczne)
1. Endpoint `POST /api/lead`:
   - walidacja schematu (typy, długości, whitelisty),
   - rate limit per IP + fingerprint,
   - weryfikacja antybot (Turnstile/reCAPTCHA token),
   - CSRF (dla sesji cookie) lub token bearer,
   - timeout i retry do integracji Make.com,
   - logowanie tylko metadanych (bez nadmiarowych danych PII).

2. Bezpieczeństwo transportu i nagłówki:
   - wymuś HTTPS + HSTS,
   - `Content-Security-Policy` (najlepiej jako response header),
   - `X-Content-Type-Options: nosniff`,
   - `Referrer-Policy: strict-origin-when-cross-origin`,
   - `Permissions-Policy` (minimalny zestaw),
   - `X-Frame-Options: DENY` lub `frame-ancestors` w CSP.

3. Ochrona operacyjna:
   - WAF (np. Cloudflare) + reguły bot management,
   - alerty na anomaliach (nagły wzrost leadów / 4xx / 5xx),
   - rotacja sekretów i brak sekretów po stronie klienta.

4. Compliance i prywatność:
   - checkbox zgody + link do polityki prywatności,
   - minimalizacja danych i retencja (np. 90 dni dla surowych payloadów),
   - procedura usunięcia danych na żądanie.

## Kryteria “deployment ready” (minimum)
- [ ] Brak publicznego webhooka w kodzie frontendu.
- [ ] `/api/lead` waliduje dane i odrzuca niepoprawne payloady.
- [ ] Antybot działa end-to-end (frontend token + backend verification).
- [ ] Rate limiting aktywny i monitorowany.
- [ ] Security headers ustawione przez serwer/CDN.
- [ ] Logi i alerty skonfigurowane.
