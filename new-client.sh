#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  new-client.sh — tworzy nowy projekt onboardingowy dla klienta
# ───────────────────────────────────────────────────────────────
#  Użycie:
#    ./new-client.sh <szablon> <nazwa-folderu>
#
#  Dostępne szablony:
#    chat       — konwersacyjny chat (index.html)
#    saas       — wizard z sidebarem
#    ecommerce  — wizualny quiz
#    finance    — formularz z panelem zaufania
#    wellness   — jedno pytanie naraz
#    crm        — enterprise wizard (CRM / duże firmy)
#    sports     — klub sportowy (ciemny motyw)
#
#  Przykład:
#    ./new-client.sh saas acme-onboarding
#
#  Co robi:
#    1. Tworzy folder ../<nazwa-folderu>
#    2. Kopiuje wybrany szablon jako index.html
#    3. Kopiuje config.js i vercel.json (bez zbędnych rewrites)
#    4. Inicjalizuje git i robi pierwszy commit
#    5. Wyświetla instrukcję co zrobić dalej
# ═══════════════════════════════════════════════════════════════

set -e

TEMPLATE=${1:-""}
CLIENT=${2:-""}

# ── walidacja argumentów ─────────────────────────────────────
if [ -z "$TEMPLATE" ] || [ -z "$CLIENT" ]; then
  echo ""
  echo "  Użycie: ./new-client.sh <szablon> <nazwa-folderu>"
  echo ""
  echo "  Szablony: chat | saas | ecommerce | finance | wellness | crm | sports | industrial"
  echo ""
  echo "  Przykład: ./new-client.sh saas acme-onboarding"
  echo ""
  exit 1
fi

VALID_TEMPLATES=("chat" "saas" "ecommerce" "finance" "wellness" "crm" "sports" "industrial")
if [[ ! " ${VALID_TEMPLATES[@]} " =~ " ${TEMPLATE} " ]]; then
  echo "  Nieznany szablon: '$TEMPLATE'"
  echo "  Dostępne: chat | saas | ecommerce | finance | wellness | crm | sports | industrial"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET_DIR="$(dirname "$SCRIPT_DIR")/$CLIENT"

if [ -d "$TARGET_DIR" ]; then
  echo "  Folder '$TARGET_DIR' już istnieje. Wybierz inną nazwę."
  exit 1
fi

# ── tworzenie projektu ───────────────────────────────────────
echo ""
echo "  Tworzę projekt: $TARGET_DIR"

mkdir -p "$TARGET_DIR"

# kopiuj wybrany szablon jako index.html
if [ "$TEMPLATE" = "chat" ]; then
  cp "$SCRIPT_DIR/index.html" "$TARGET_DIR/index.html"
else
  cp "$SCRIPT_DIR/template-$TEMPLATE.html" "$TARGET_DIR/index.html"
fi

# kopiuj config.js
cp "$SCRIPT_DIR/config.js" "$TARGET_DIR/config.js"

# vercel.json — tylko security headers (bez rewrites, bo jest jeden plik)
cat > "$TARGET_DIR/vercel.json" << 'VERCELJSON'
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options",    "value": "nosniff" },
        { "key": "X-Frame-Options",           "value": "DENY" },
        { "key": "X-XSS-Protection",          "value": "1; mode=block" },
        { "key": "Referrer-Policy",           "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",        "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" },
        { "key": "Content-Security-Policy",   "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://*.make.com; frame-ancestors 'none';" }
      ]
    }
  ]
}
VERCELJSON

# ── git init ─────────────────────────────────────────────────
cd "$TARGET_DIR"
git init -q
git add .
git commit -q -m "Init: $CLIENT onboarding ($TEMPLATE template)"

# ── instrukcja ───────────────────────────────────────────────
echo ""
echo "  Gotowe! Projekt w: $TARGET_DIR"
echo ""
echo "  ─── Następne kroki ──────────────────────────────────"
echo ""
echo "  1. Uzupełnij config.js:"
echo "       brand.name    → nazwa klienta"
echo "       webhooks.$TEMPLATE → URL z Make.com"
echo ""
echo "  2. Utwórz repo na GitHub i wypchij:"
echo "       cd $TARGET_DIR"
echo "       git remote add origin https://github.com/TWOJ_LOGIN/$CLIENT.git"
echo "       git push -u origin main"
echo ""
echo "  3. Wdróż na Vercel:"
echo "       vercel --prod"
echo ""
echo "  ─── Pliki projektu ──────────────────────────────────"
echo "       index.html   ← szablon $TEMPLATE (edytuj brandName w CONFIG)"
echo "       config.js    ← konfiguracja klienta"
echo "       vercel.json  ← security headers"
echo ""
