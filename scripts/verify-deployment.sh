#!/bin/bash
# ================================================================
# ROMUO.CH - Script de Verification Post-Deploiement
# ================================================================
# Verifie que le site est correctement deploye et fonctionne
# Usage: ./verify-deployment.sh [domaine]
# ================================================================

set -e

# Configuration
DOMAIN="${1:-romuo.ch}"
URL="https://${DOMAIN}"
API_URL="https://api.${DOMAIN}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Compteurs
PASSED=0
WARNINGS=0
FAILED=0

# Fonctions
check_pass() {
    echo -e "  ${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

check_warn() {
    echo -e "  ${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

check_fail() {
    echo -e "  ${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

header() {
    echo ""
    echo -e "${CYAN}=== $1 ===${NC}"
}

# ============================================
# DEBUT DES TESTS
# ============================================

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ROMUO.CH - Verification Post-Deploiement               ║${NC}"
echo -e "${CYAN}║     Domaine: ${DOMAIN}${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. TESTS DE CONNECTIVITE
# ============================================
header "1. Tests de Connectivite"

# Test HTTP vers HTTPS redirect
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "http://${DOMAIN}" 2>/dev/null || echo "000")
if [ "$response" == "301" ] || [ "$response" == "302" ]; then
    check_pass "Redirection HTTP vers HTTPS (${response})"
elif [ "$response" == "200" ]; then
    check_warn "HTTP accessible sans redirection HTTPS"
else
    check_fail "Site non accessible via HTTP (code: ${response})"
fi

# Test HTTPS
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${URL}" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    check_pass "Site accessible via HTTPS (200 OK)"
else
    check_fail "Site non accessible via HTTPS (code: ${response})"
fi

# Test temps de reponse
load_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 30 "${URL}" 2>/dev/null || echo "30")
if (( $(echo "$load_time < 2" | bc -l 2>/dev/null || echo "0") )); then
    check_pass "Temps de reponse rapide (${load_time}s)"
elif (( $(echo "$load_time < 5" | bc -l 2>/dev/null || echo "0") )); then
    check_warn "Temps de reponse acceptable (${load_time}s)"
else
    check_fail "Temps de reponse lent (${load_time}s > 5s)"
fi

# ============================================
# 2. TESTS SSL/TLS
# ============================================
header "2. Tests SSL/TLS"

# Verifier le certificat SSL
ssl_info=$(curl -vI --max-time 10 "${URL}" 2>&1 | grep -i "SSL certificate\|issuer\|expire" || true)
if echo "$ssl_info" | grep -qi "SSL certificate"; then
    check_pass "Certificat SSL present"
else
    check_warn "Impossible de verifier le certificat SSL"
fi

# Verifier HSTS
hsts=$(curl -sI --max-time 10 "${URL}" 2>/dev/null | grep -i "strict-transport-security" || true)
if [ -n "$hsts" ]; then
    check_pass "HSTS active"
else
    check_warn "HSTS non detecte"
fi

# ============================================
# 3. TESTS HEADERS DE SECURITE
# ============================================
header "3. Tests Headers de Securite"

headers=$(curl -sI --max-time 10 "${URL}" 2>/dev/null)

# X-Content-Type-Options
if echo "$headers" | grep -qi "x-content-type-options.*nosniff"; then
    check_pass "X-Content-Type-Options: nosniff"
else
    check_warn "X-Content-Type-Options manquant"
fi

# X-Frame-Options
if echo "$headers" | grep -qi "x-frame-options"; then
    check_pass "X-Frame-Options present"
else
    check_warn "X-Frame-Options manquant"
fi

# X-XSS-Protection
if echo "$headers" | grep -qi "x-xss-protection"; then
    check_pass "X-XSS-Protection present"
else
    check_warn "X-XSS-Protection manquant"
fi

# Content-Security-Policy
if echo "$headers" | grep -qi "content-security-policy"; then
    check_pass "Content-Security-Policy present"
else
    check_warn "Content-Security-Policy manquant"
fi

# Referrer-Policy
if echo "$headers" | grep -qi "referrer-policy"; then
    check_pass "Referrer-Policy present"
else
    check_warn "Referrer-Policy manquant"
fi

# ============================================
# 4. TESTS COMPRESSION
# ============================================
header "4. Tests Compression"

# Test GZIP
gzip_header=$(curl -sI -H "Accept-Encoding: gzip" --max-time 10 "${URL}" 2>/dev/null | grep -i "content-encoding" || true)
if echo "$gzip_header" | grep -qi "gzip"; then
    check_pass "Compression GZIP active"
else
    check_warn "Compression GZIP non detectee"
fi

# ============================================
# 5. TESTS SPA ROUTING
# ============================================
header "5. Tests SPA Routing"

# Test route /reservation
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/reservation" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    check_pass "Route /reservation accessible (200)"
elif [ "$response" == "404" ]; then
    check_fail "Route /reservation retourne 404 (SPA routing non configure)"
else
    check_warn "Route /reservation code: ${response}"
fi

# Test route /admin
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/admin" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    check_pass "Route /admin accessible (200)"
else
    check_warn "Route /admin code: ${response}"
fi

# ============================================
# 6. TESTS FICHIERS ESSENTIELS
# ============================================
header "6. Tests Fichiers Essentiels"

# Test index.html
content=$(curl -s --max-time 10 "${URL}" 2>/dev/null || echo "")
if echo "$content" | grep -qi "<!DOCTYPE html>"; then
    check_pass "index.html valide"
else
    check_fail "index.html invalide ou manquant"
fi

# Test manifest.json (PWA)
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/manifest.json" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    check_pass "manifest.json present (PWA)"
else
    check_warn "manifest.json non trouve"
fi

# Test Service Worker
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/sw.js" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    check_pass "Service Worker (sw.js) present"
else
    check_warn "Service Worker non trouve"
fi

# Test favicon
response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${URL}/favicon.ico" 2>/dev/null || echo "000")
if [ "$response" == "200" ]; then
    check_pass "Favicon present"
else
    check_warn "Favicon non trouve"
fi

# ============================================
# 7. TESTS API (si disponible)
# ============================================
header "7. Tests API Backend"

# Test API health endpoint
api_response=$(curl -sI -o /dev/null -w "%{http_code}" --max-time 10 "${API_URL}/health" 2>/dev/null || echo "000")
if [ "$api_response" == "200" ]; then
    check_pass "API health endpoint accessible"
elif [ "$api_response" == "000" ]; then
    check_warn "API non joignable (normal si frontend-only)"
else
    check_warn "API health code: ${api_response}"
fi

# ============================================
# 8. TESTS PERFORMANCE
# ============================================
header "8. Tests Performance"

# Taille de la page
page_size=$(curl -s -o /dev/null -w "%{size_download}" --max-time 30 "${URL}" 2>/dev/null || echo "0")
if [ "$page_size" -lt 500000 ]; then
    check_pass "Taille page HTML acceptable ($(echo "scale=2; $page_size/1024" | bc 2>/dev/null || echo "$page_size") KB)"
else
    check_warn "Page HTML volumineuse ($(echo "scale=2; $page_size/1024" | bc 2>/dev/null || echo "$page_size") KB)"
fi

# Test cache headers sur assets
js_cache=$(curl -sI --max-time 10 "${URL}/assets/js/" 2>/dev/null | grep -i "cache-control" || true)
if echo "$js_cache" | grep -qi "max-age"; then
    check_pass "Cache headers configures pour les assets"
else
    check_warn "Cache headers non verifies"
fi

# ============================================
# 9. TESTS MOBILE/RESPONSIVE
# ============================================
header "9. Tests Mobile"

# Test viewport meta
if echo "$content" | grep -qi 'viewport'; then
    check_pass "Meta viewport present"
else
    check_warn "Meta viewport non trouve"
fi

# Test responsive design via User-Agent mobile
mobile_response=$(curl -sI -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)" --max-time 10 "${URL}" 2>/dev/null || echo "000")
if [ "$mobile_response" == "200" ]; then
    check_pass "Site accessible sur mobile"
else
    check_warn "Test mobile code: ${mobile_response}"
fi

# ============================================
# RESUME
# ============================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    RESUME DES TESTS                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Reussis:${NC}      $PASSED"
echo -e "  ${YELLOW}Avertissements:${NC} $WARNINGS"
echo -e "  ${RED}Echecs:${NC}       $FAILED"
echo ""

TOTAL=$((PASSED + WARNINGS + FAILED))
SCORE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "  ${GREEN}Score: ${SCORE}% - DEPLOIEMENT PARFAIT!${NC}"
elif [ $FAILED -eq 0 ]; then
    echo -e "  ${YELLOW}Score: ${SCORE}% - Deploiement OK avec avertissements${NC}"
else
    echo -e "  ${RED}Score: ${SCORE}% - Des corrections sont necessaires${NC}"
fi

echo ""
echo -e "${CYAN}URLs:${NC}"
echo "  Site:  ${URL}"
echo "  API:   ${API_URL}"
echo "  Admin: ${URL}/admin"
echo ""

# Code de sortie
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi
