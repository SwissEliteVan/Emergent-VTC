#!/bin/bash
# ================================================================
# ROMUO.CH - Script d'Integration Hostinger Suisse
# ================================================================
# Script unifie pour deployer Romuo VTC sur Hostinger
# Optimise pour la Suisse (CHF, fr-CH, Europe/Zurich)
#
# Usage: ./hostinger-swiss-setup.sh [option]
# Options:
#   --full      : Installation complete (frontend + backend)
#   --frontend  : Frontend uniquement (hebergement mutualise)
#   --vps       : Configuration VPS complete
#   --check     : Verification post-deploiement
#   --help      : Afficher l'aide
# ================================================================

set -e

# ============================================
# CONFIGURATION SUISSE
# ============================================
readonly SCRIPT_VERSION="2.0.0"
readonly DOMAIN="romuo.ch"
readonly APP_NAME="Romuo VTC"
readonly COUNTRY="CH"
readonly CURRENCY="CHF"
readonly LOCALE="fr-CH"
readonly TIMEZONE="Europe/Zurich"
readonly ADMIN_EMAIL="${ADMIN_EMAIL:-admin@romuo.ch}"

# Couleurs pour le terminal
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Chemins
readonly PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly FRONTEND_DIR="${PROJECT_ROOT}/frontend-romuo"
readonly BACKEND_DIR="${PROJECT_ROOT}/backend"
readonly CONFIG_DIR="${PROJECT_ROOT}/config"
readonly LOGS_DIR="${PROJECT_ROOT}/logs"

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

log_header() {
    echo ""
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}============================================${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        log_success "$1 installe"
        return 0
    else
        log_error "$1 non trouve"
        return 1
    fi
}

# ============================================
# AFFICHER L'AIDE
# ============================================

show_help() {
    cat << EOF
${CYAN}================================================================
ROMUO.CH - Script d'Integration Hostinger Suisse v${SCRIPT_VERSION}
================================================================${NC}

${GREEN}Usage:${NC} ./hostinger-swiss-setup.sh [option]

${YELLOW}Options:${NC}
  --full      Installation complete (frontend + backend VPS)
  --frontend  Frontend uniquement (hebergement mutualise Hostinger)
  --vps       Configuration VPS Hostinger complete
  --check     Verification post-deploiement
  --env       Generer le fichier .env template
  --secrets   Configurer les secrets GitHub Actions
  --help      Afficher cette aide

${YELLOW}Exemples:${NC}
  ./hostinger-swiss-setup.sh --frontend    # Deployer le site web
  ./hostinger-swiss-setup.sh --check       # Verifier le deploiement
  ./hostinger-swiss-setup.sh --env         # Creer .env.local

${YELLOW}Configuration Suisse:${NC}
  Domaine:    ${DOMAIN}
  Devise:     ${CURRENCY}
  Locale:     ${LOCALE}
  Timezone:   ${TIMEZONE}

${YELLOW}Pre-requis:${NC}
  - Node.js 20+ (pour le build frontend)
  - npm ou pnpm
  - Git
  - Acces FTP Hostinger (pour --frontend)
  - Acces SSH Hostinger (pour --vps)

${YELLOW}Documentation:${NC}
  Voir HOSTINGER_SWISS_GUIDE.md pour les instructions detaillees.

EOF
}

# ============================================
# VERIFICATION ENVIRONNEMENT
# ============================================

check_prerequisites() {
    log_header "Verification des pre-requis"

    local errors=0

    # Node.js
    if check_command node; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            log_warning "Node.js version $node_version detecte, recommande >= 20"
        fi
    else
        ((errors++))
    fi

    # npm
    check_command npm || ((errors++))

    # Git
    check_command git || ((errors++))

    # Verifier le dossier frontend
    if [ -d "$FRONTEND_DIR" ]; then
        log_success "Dossier frontend trouve"
    else
        log_error "Dossier frontend-romuo introuvable"
        ((errors++))
    fi

    # Verifier package.json
    if [ -f "${FRONTEND_DIR}/package.json" ]; then
        log_success "package.json trouve"
    else
        log_error "package.json manquant"
        ((errors++))
    fi

    if [ $errors -gt 0 ]; then
        log_error "$errors erreur(s) detectee(s). Corrigez avant de continuer."
        exit 1
    fi

    log_success "Tous les pre-requis sont satisfaits"
}

# ============================================
# GENERER FICHIER .ENV
# ============================================

generate_env_file() {
    log_header "Generation du fichier .env"

    local env_file="${PROJECT_ROOT}/.env.local"

    if [ -f "$env_file" ]; then
        log_warning "Le fichier .env.local existe deja"
        read -p "Voulez-vous le remplacer? (o/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Oo]$ ]]; then
            log_info "Generation annulee"
            return 0
        fi
    fi

    cat > "$env_file" << 'ENVEOF'
# ============================================
# ROMUO.CH - Configuration Environnement
# ============================================
# Copier ce fichier et renommer en .env
# Ne JAMAIS committer le fichier .env reel!
# ============================================

# === DOMAINE ===
VITE_APP_DOMAIN=romuo.ch
VITE_APP_URL=https://romuo.ch
VITE_API_URL=https://api.romuo.ch

# === CONFIGURATION SUISSE ===
VITE_COUNTRY=CH
VITE_CURRENCY=CHF
VITE_LOCALE=fr-CH
VITE_TIMEZONE=Europe/Zurich

# === BACKEND ===
# MongoDB (pour VPS uniquement)
MONGO_URL=mongodb://localhost:27017
DB_NAME=romuo_prod

# API Keys (remplacer par vos vraies cles)
OPENROUTE_API_KEY=your_openroute_api_key_here
JWT_SECRET=your_secure_jwt_secret_here_min_32_chars

# === HOSTINGER FTP (pour GitHub Actions) ===
# Ces valeurs vont dans GitHub Secrets, pas ici!
# FTP_SERVER=ftp.hostinger.com
# FTP_USERNAME=u123456789
# FTP_PASSWORD=your_ftp_password
# FTP_SERVER_DIR=/public_html/

# === HOSTINGER VPS (pour deploiement VPS) ===
# VPS_HOST=123.456.789.000
# VPS_USER=root
# VPS_SSH_KEY=~/.ssh/hostinger_vps

# === EMAILS (optionnel) ===
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@romuo.ch
SMTP_PASS=your_email_password

# === ANALYTICS (optionnel) ===
# VITE_GA_ID=G-XXXXXXXXXX

# === MODE DEBUG ===
VITE_DEBUG=false
ENVEOF

    chmod 600 "$env_file"
    log_success "Fichier .env.local genere: $env_file"
    log_warning "N'oubliez pas de configurer vos vraies valeurs!"
}

# ============================================
# BUILD FRONTEND
# ============================================

build_frontend() {
    log_header "Build du Frontend React"

    cd "$FRONTEND_DIR"

    # Installer les dependances
    log_info "Installation des dependances npm..."
    npm ci --prefer-offline 2>/dev/null || npm install

    # Build production
    log_info "Build de production en cours..."
    NODE_ENV=production npm run build

    # Verifier le build
    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        log_success "Build termine avec succes"

        # Verifier .htaccess
        if [ -f "dist/.htaccess" ]; then
            log_success ".htaccess present dans dist/"
        else
            log_warning ".htaccess manquant, copie depuis public/"
            cp public/.htaccess dist/.htaccess 2>/dev/null || true
        fi

        # Afficher les statistiques
        echo ""
        log_info "Statistiques du build:"
        du -sh dist/
        echo "  - JS:  $(find dist -name '*.js' | wc -l) fichiers"
        echo "  - CSS: $(find dist -name '*.css' | wc -l) fichiers"
        echo "  - GZ:  $(find dist -name '*.gz' | wc -l) fichiers pre-compresses"
    else
        log_error "Le build a echoue"
        exit 1
    fi

    cd "$PROJECT_ROOT"
}

# ============================================
# CONFIGURER SECRETS GITHUB
# ============================================

setup_github_secrets() {
    log_header "Configuration des Secrets GitHub"

    if ! check_command gh; then
        log_error "GitHub CLI (gh) requis. Installez-le: https://cli.github.com/"
        exit 1
    fi

    # Verifier l'authentification
    if ! gh auth status &>/dev/null; then
        log_info "Authentification GitHub requise..."
        gh auth login
    fi

    echo ""
    log_info "Configuration des secrets pour le deploiement Hostinger"
    echo ""

    # FTP Server
    read -p "FTP Server Hostinger (ex: ftp.hostinger.com): " ftp_server
    read -p "FTP Username: " ftp_username
    read -s -p "FTP Password: " ftp_password
    echo ""
    read -p "FTP Server Directory (default: /public_html/): " ftp_dir
    ftp_dir=${ftp_dir:-/public_html/}

    # Configurer les secrets
    log_info "Configuration des secrets GitHub..."

    gh secret set FTP_SERVER --body "$ftp_server"
    gh secret set FTP_USERNAME --body "$ftp_username"
    gh secret set FTP_PASSWORD --body "$ftp_password"
    gh secret set FTP_SERVER_DIR --body "$ftp_dir"

    log_success "Secrets GitHub configures avec succes!"
    echo ""
    log_info "Secrets configures:"
    echo "  - FTP_SERVER"
    echo "  - FTP_USERNAME"
    echo "  - FTP_PASSWORD"
    echo "  - FTP_SERVER_DIR"
}

# ============================================
# DEPLOIEMENT FRONTEND (FTP)
# ============================================

deploy_frontend_ftp() {
    log_header "Deploiement Frontend via FTP"

    # Verifier que le build existe
    if [ ! -d "${FRONTEND_DIR}/dist" ]; then
        log_warning "Build non trouve, lancement du build..."
        build_frontend
    fi

    # Option 1: Via GitHub Actions (recommande)
    log_info "Methode recommandee: Push vers main pour declencher GitHub Actions"
    echo ""
    echo "  git add ."
    echo "  git commit -m 'Deploy to Hostinger'"
    echo "  git push origin main"
    echo ""

    # Option 2: Deploiement manuel avec lftp
    if check_command lftp 2>/dev/null; then
        read -p "Deployer manuellement via lftp? (o/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            read -p "FTP Server: " ftp_server
            read -p "FTP Username: " ftp_username
            read -s -p "FTP Password: " ftp_password
            echo ""
            read -p "FTP Directory (default: /public_html/): " ftp_dir
            ftp_dir=${ftp_dir:-/public_html/}

            log_info "Deploiement en cours..."

            lftp -e "
                set ssl:verify-certificate no;
                set ftp:passive-mode true;
                open -u $ftp_username,$ftp_password $ftp_server;
                mirror -R --delete --verbose ${FRONTEND_DIR}/dist/ $ftp_dir;
                bye
            "

            log_success "Deploiement termine!"
        fi
    else
        log_info "Pour deploiement manuel, installez lftp: sudo apt install lftp"
    fi
}

# ============================================
# CONFIGURATION VPS HOSTINGER
# ============================================

setup_vps() {
    log_header "Configuration VPS Hostinger"

    read -p "Adresse IP du VPS: " vps_ip
    read -p "Utilisateur SSH (default: root): " vps_user
    vps_user=${vps_user:-root}

    log_info "Connexion au VPS et configuration..."

    # Script de configuration a executer sur le VPS
    ssh "${vps_user}@${vps_ip}" << 'VPSEOF'
#!/bin/bash
set -e

echo "=== Configuration VPS Hostinger pour Romuo.ch ==="

# Mise a jour systeme
apt update && apt upgrade -y

# Installer les outils essentiels
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Configurer UFW
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installer PM2
npm install -g pm2

# Installer MongoDB 8.0
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# Creer le dossier pour le site
mkdir -p /var/www/romuo.ch/dist
chown -R www-data:www-data /var/www/romuo.ch

# Configurer le timezone Suisse
timedatectl set-timezone Europe/Zurich

echo "=== Configuration VPS terminee ==="
VPSEOF

    log_success "VPS configure avec succes!"
    log_info "Prochaines etapes:"
    echo "  1. Deployer les fichiers frontend sur /var/www/romuo.ch/dist/"
    echo "  2. Configurer Nginx avec le fichier nginx/romuo.ch.conf"
    echo "  3. Obtenir le certificat SSL: certbot --nginx -d romuo.ch -d www.romuo.ch"
}

# ============================================
# VERIFICATION POST-DEPLOIEMENT
# ============================================

check_deployment() {
    log_header "Verification Post-Deploiement"

    local url="https://${DOMAIN}"
    local errors=0

    log_info "Verification de ${url}..."
    echo ""

    # 1. Verifier que le site repond
    log_info "1. Test de connectivite..."
    if curl -sI --connect-timeout 10 "$url" | head -1 | grep -q "200\|301\|302"; then
        log_success "Site accessible"
    else
        log_error "Site non accessible"
        ((errors++))
    fi

    # 2. Verifier HTTPS
    log_info "2. Test HTTPS..."
    if curl -sI --connect-timeout 10 "$url" 2>&1 | grep -qi "strict-transport-security"; then
        log_success "HSTS active"
    else
        log_warning "HSTS non detecte"
    fi

    # 3. Verifier la compression
    log_info "3. Test compression GZIP..."
    if curl -sI -H "Accept-Encoding: gzip" --connect-timeout 10 "$url" | grep -qi "content-encoding.*gzip"; then
        log_success "Compression GZIP active"
    else
        log_warning "Compression GZIP non detectee"
    fi

    # 4. Verifier le SPA routing
    log_info "4. Test SPA routing..."
    if curl -s --connect-timeout 10 "${url}/reservation" | grep -q "<!DOCTYPE html>"; then
        log_success "SPA routing fonctionne"
    else
        log_warning "SPA routing non verifie"
    fi

    # 5. Verifier les headers de securite
    log_info "5. Test headers de securite..."
    local headers=$(curl -sI --connect-timeout 10 "$url")

    if echo "$headers" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options present"
    else
        log_warning "X-Content-Type-Options manquant"
    fi

    if echo "$headers" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options present"
    else
        log_warning "X-Frame-Options manquant"
    fi

    # 6. Test de performance
    log_info "6. Test de performance..."
    local load_time=$(curl -s -o /dev/null -w '%{time_total}' --connect-timeout 10 "$url")
    if (( $(echo "$load_time < 3" | bc -l 2>/dev/null || echo "1") )); then
        log_success "Temps de chargement: ${load_time}s"
    else
        log_warning "Temps de chargement: ${load_time}s (>3s)"
    fi

    # Resume
    echo ""
    log_header "Resume"
    if [ $errors -eq 0 ]; then
        log_success "Deploiement verifie avec succes!"
        echo ""
        echo "  Site web:    https://${DOMAIN}"
        echo "  API:         https://api.${DOMAIN}"
        echo "  Admin:       https://${DOMAIN}/admin"
    else
        log_error "$errors erreur(s) detectee(s)"
        echo ""
        echo "Actions recommandees:"
        echo "  1. Verifier la configuration DNS"
        echo "  2. Verifier le certificat SSL"
        echo "  3. Verifier le fichier .htaccess"
    fi
}

# ============================================
# DEPLOIEMENT COMPLET
# ============================================

full_deploy() {
    log_header "Deploiement Complet Romuo.ch"

    check_prerequisites
    build_frontend

    echo ""
    log_info "Selectionnez le type de deploiement:"
    echo "  1. Hebergement mutualise Hostinger (FTP)"
    echo "  2. VPS Hostinger"
    echo ""
    read -p "Choix (1/2): " deploy_choice

    case $deploy_choice in
        1)
            deploy_frontend_ftp
            ;;
        2)
            setup_vps
            ;;
        *)
            log_error "Choix invalide"
            exit 1
            ;;
    esac

    # Verification
    read -p "Lancer la verification post-deploiement? (O/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        sleep 5  # Attendre que le deploiement soit effectif
        check_deployment
    fi
}

# ============================================
# POINT D'ENTREE
# ============================================

main() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        ROMUO.CH - Integration Hostinger Suisse             ║${NC}"
    echo -e "${CYAN}║        Version ${SCRIPT_VERSION}                                       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    case "${1:-}" in
        --help|-h)
            show_help
            ;;
        --full)
            full_deploy
            ;;
        --frontend)
            check_prerequisites
            build_frontend
            deploy_frontend_ftp
            ;;
        --vps)
            setup_vps
            ;;
        --check)
            check_deployment
            ;;
        --env)
            generate_env_file
            ;;
        --secrets)
            setup_github_secrets
            ;;
        --build)
            check_prerequisites
            build_frontend
            ;;
        *)
            show_help
            ;;
    esac
}

main "$@"
