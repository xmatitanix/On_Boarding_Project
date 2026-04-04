#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  new-client.sh — tworzy nowy projekt onboardingowy dla klienta
# ───────────────────────────────────────────────────────────────
#  Użycie:
#    ./new-client.sh <szablon> <nazwa-folderu> [nazwa-marki]
#
#  Dostępne szablony:
#    chat       — konwersacyjny chat (index.html)
#    saas       — wizard z sidebarem
#    ecommerce  — wizualny quiz
#    finance    — formularz z panelem zaufania
#    wellness   — jedno pytanie naraz
#    crm        — enterprise wizard (CRM / duże firmy)
#    sports     — klub sportowy (ciemny motyw)
#    industrial — przemysł / CNC
#
#  Przykład:
#    ./new-client.sh sports karate-orzel-poznan "Karate Orzeł Poznań"
#
#  Co robi:
#    1. Tworzy folder ../<nazwa-folderu>
#    2. Kopiuje wybrany szablon jako index.html
#    3. Kopiuje js/, api/, config.js, vercel.json
#    4. Ustawia nazwę marki w config.js (jeśli podana)
#    5. Inicjalizuje git i robi pierwszy commit
#    6. Wyświetla instrukcję co zrobić dalej
# ═══════════════════════════════════════════════════════════════

set -e

TEMPLATE=${1:-""}
CLIENT=${2:-""}
BRAND=${3:-""}

# ── walidacja argumentów ─────────────────────────────────────
if [ -z "$TEMPLATE" ] || [ -z "$CLIENT" ]; then
  echo ""
  echo "  Użycie: ./new-client.sh <szablon> <nazwa-folderu> [nazwa-marki]"
  echo ""
  echo "  Szablony: chat | saas | ecommerce | finance | wellness | crm | sports | industrial"
  echo ""
  echo "  Przykład:"
  echo "    ./new-client.sh sports karate-orzel-poznan \"Karate Orzeł Poznań\""
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
echo ""

mkdir -p "$TARGET_DIR"

# kopiuj wybrany szablon jako index.html
if [ "$TEMPLATE" = "chat" ]; then
  cp "$SCRIPT_DIR/index.html" "$TARGET_DIR/index.html"
else
  cp "$SCRIPT_DIR/template-$TEMPLATE.html" "$TARGET_DIR/index.html"
fi

# kopiuj js/ i api/ (wymagane przez nową architekturę)
cp -r "$SCRIPT_DIR/js"  "$TARGET_DIR/js"
cp -r "$SCRIPT_DIR/api" "$TARGET_DIR/api"

# kopiuj config.js
cp "$SCRIPT_DIR/config.js" "$TARGET_DIR/config.js"

# ustaw nazwę marki jeśli podana
if [ -n "$BRAND" ]; then
  # sed działa zarówno na macOS jak i Linux
  sed -i.bak "s/name: '[^']*'/name: '$BRAND'/" "$TARGET_DIR/config.js" && rm -f "$TARGET_DIR/config.js.bak"
  echo "  Ustawiono brand.name: $BRAND"
fi

# kopiuj vercel.json (pełne security headers + proxy /api/submit)
cp "$SCRIPT_DIR/vercel.json" "$TARGET_DIR/vercel.json"

# usuń zbędne rewrite'y dla innych szablonów (zostawiamy tylko /api)
cat > "$TARGET_DIR/vercel.json" << 'VERCELJSON'
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options",        "value": "nosniff" },
        { "key": "X-Frame-Options",               "value": "DENY" },
        { "key": "X-XSS-Protection",              "value": "0" },
        { "key": "Referrer-Policy",               "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy",            "value": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
        { "key": "Strict-Transport-Security",     "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Cross-Origin-Opener-Policy",    "value": "same-origin" },
        { "key": "Cross-Origin-Resource-Policy",  "value": "same-origin" },
        { "key": "Content-Security-Policy",       "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" }
      ]
    },
    {
      "source": "/config.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }
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
ENV_VAR="MAKE_WEBHOOK_$(echo $TEMPLATE | tr '[:lower:]' '[:upper:]')"

echo "  ✓ Projekt gotowy: $TARGET_DIR"
echo ""
echo "  ─── Następne kroki ──────────────────────────────────────"
echo ""
echo "  1. Utwórz repo na GitHub i wypchij:"
echo ""
echo "       cd $TARGET_DIR"
echo "       git remote add origin https://github.com/TWOJ_LOGIN/$CLIENT.git"
echo "       git push -u origin main"
echo ""
echo "  2. Wdróż na Vercel:"
echo ""
echo "       vercel --prod"
echo ""
echo "  3. Dodaj webhook w Vercel Dashboard:"
echo "       Settings → Environment Variables → dodaj:"
echo ""
echo "       $ENV_VAR = <URL z make.com>"
echo ""
echo "  4. Zrób redeploy po dodaniu zmiennej:"
echo ""
echo "       vercel --prod"
echo ""
echo "  ─── Struktura projektu ──────────────────────────────────"
echo ""
echo "       index.html     ← formularz ($TEMPLATE)"
echo "       js/$TEMPLATE.js  ← logika formularza"
echo "       api/submit.js  ← proxy webhook (chroni URL Make.com)"
echo "       config.js      ← brand + ustawienia bezpieczeństwa"
echo "       vercel.json    ← security headers"
echo ""
