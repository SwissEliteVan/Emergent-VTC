#!/usr/bin/env bash

#############################################
# Script d'installation automatique VTC
# Ubuntu 22.04 + Node.js 20 + Nginx + PM2
#############################################

set -Eeuo pipefail

# --- Configuration (modifiable via variables d'environnement) ---
APP_NAME="${APP_NAME:-vtcapp}"
APP_USER="${APP_USER:-vtcapp}"
APP_DIR="${APP_DIR:-/opt/vtcapp}"
APP_PORT="${APP_PORT:-3000}"
DOMAIN_NAME="${DOMAIN_NAME:-example.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
REPO_URL="${REPO_URL:-}"
ENV_FILE_PATH="${ENV_FILE_PATH:-$APP_DIR/.env}"
NODE_VERSION="${NODE_VERSION:-20}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vtcapp}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

LOG_FILE="/var/log/${APP_NAME}-deploy.log"

# --- Fonctions utilitaires ---
log() {
    local level="$1"
    local message="$2"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

fail() {
    local message="$1"
    log "ERROR" "$message"
    exit 1
}

run() {
    local message="$1"
    shift
    log "INFO" "$message"
    "$@"
}

on_error() {
    local exit_code=$?
    log "ERROR" "Une erreur est survenue (code: $exit_code). Consultez $LOG_FILE."
    exit $exit_code
}
trap on_error ERR

usage() {
    cat <<USAGE
Usage:
  sudo ./deploy-vtc.sh \
    DOMAIN_NAME=mon-domaine.com \
    ADMIN_EMAIL=admin@mon-domaine.com \
    REPO_URL=https://github.com/MonOrg/mon-app.git

Variables optionnelles:
  APP_NAME            Nom de l'application (défaut: vtcapp)
  APP_USER            Utilisateur système dédié (défaut: vtcapp)
  APP_DIR             Répertoire d'installation (défaut: /opt/vtcapp)
  APP_PORT            Port d'écoute de l'app Node (défaut: 3000)
  REPO_URL            URL du dépôt Git (si vide, copie depuis le dossier courant)
  ENV_FILE_PATH       Chemin du fichier .env (défaut: /opt/vtcapp/.env)
  NODE_VERSION        Version majeure Node.js (défaut: 20)
  BACKUP_DIR           Répertoire de sauvegarde (défaut: /var/backups/vtcapp)
  BACKUP_RETENTION_DAYS Durée de rétention des backups (défaut: 7)
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

# --- Étape 1: Vérifier prérequis ---
log "INFO" "Vérification des prérequis..."
if [[ $(id -u) -ne 0 ]]; then
    fail "Ce script doit être exécuté en root."
fi

if ! grep -qs "Ubuntu 22.04" /etc/os-release; then
    fail "Ubuntu 22.04 est requis. Version détectée: $(grep -s PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d '"')"
fi

# --- Étape 2: Mise à jour système ---
run "Mise à jour du système" apt-get update -y
run "Mise à niveau du système" apt-get upgrade -y

# --- Étape 3: Installation Node.js, Nginx, PM2, Certbot ---
run "Installation des dépendances système" apt-get install -y curl git ufw nginx software-properties-common rsync

if ! node -v 2>/dev/null | grep -q "v${NODE_VERSION}."; then
    run "Installation Node.js ${NODE_VERSION}.x" bash -c "curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -"
    run "Installation Node.js" apt-get install -y nodejs
else
    log "INFO" "Node.js ${NODE_VERSION}.x déjà installé"
fi

if ! command -v pm2 >/dev/null 2>&1; then
    run "Installation PM2" npm install -g pm2
else
    log "INFO" "PM2 déjà installé"
fi

if ! command -v certbot >/dev/null 2>&1; then
    run "Installation Certbot" apt-get install -y certbot python3-certbot-nginx
else
    log "INFO" "Certbot déjà installé"
fi

# --- Étape 4: Configurer UFW ---
log "INFO" "Configuration du pare-feu UFW"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

# --- Étape 5: Créer l'utilisateur dédié ---
if ! id "$APP_USER" >/dev/null 2>&1; then
    run "Création de l'utilisateur $APP_USER" useradd -m -s /bin/bash "$APP_USER"
else
    log "INFO" "Utilisateur $APP_USER déjà existant"
fi

# --- Étape 6: Cloner le repo Git ou copier les fichiers ---
run "Création du répertoire applicatif" mkdir -p "$APP_DIR"

if [[ -n "$REPO_URL" ]]; then
    if [[ -d "$APP_DIR/.git" ]]; then
        run "Mise à jour du dépôt" git -C "$APP_DIR" pull --ff-only || true
    else
        run "Clonage du dépôt" git clone "$REPO_URL" "$APP_DIR"
    fi
else
    log "INFO" "REPO_URL non défini, copie des fichiers depuis le dossier courant"
    rsync -a --delete --exclude '.git' ./ "$APP_DIR"
fi

run "Permissions sur $APP_DIR" chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# --- Étape 7: Installer les dépendances npm ---
log "INFO" "Installation des dépendances npm"
if [[ -f "$APP_DIR/package-lock.json" ]]; then
    sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm ci"
else
    sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && npm install"
fi

# --- Étape 8: Configurer les variables d'environnement ---
if [[ ! -f "$ENV_FILE_PATH" ]]; then
    log "INFO" "Création du fichier .env"
    cat <<ENVVARS > "$ENV_FILE_PATH"
NODE_ENV=production
PORT=$APP_PORT
DOMAIN_NAME=$DOMAIN_NAME
ENVVARS
    chown "$APP_USER:$APP_USER" "$ENV_FILE_PATH"
else
    log "INFO" "Fichier .env déjà présent"
fi

# --- Étape 9: Configurer Nginx via template ---
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}.conf"
if [[ ! -f "$NGINX_SITE" ]]; then
    log "INFO" "Création de la configuration Nginx"
    cat <<NGINXCONF > "$NGINX_SITE"
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXCONF
    ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${APP_NAME}.conf"
else
    log "INFO" "Configuration Nginx déjà existante"
fi

run "Validation configuration Nginx" nginx -t
run "Redémarrage Nginx" systemctl restart nginx

# --- Étape 10: Obtenir un certificat SSL ---
if [[ "$DOMAIN_NAME" != "example.com" ]]; then
    if [[ ! -d "/etc/letsencrypt/live/$DOMAIN_NAME" ]]; then
        run "Obtention certificat SSL" certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos -m "$ADMIN_EMAIL"
    else
        log "INFO" "Certificat SSL déjà présent pour $DOMAIN_NAME"
    fi
else
    log "INFO" "DOMAIN_NAME par défaut, étape SSL ignorée"
fi

# --- Étape 11: Démarrer l'application avec PM2 ---
log "INFO" "Démarrage de l'application avec PM2"
if ! sudo -u "$APP_USER" pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    sudo -u "$APP_USER" bash -c "cd '$APP_DIR' && pm2 start npm --name '$APP_NAME' -- start"
else
    sudo -u "$APP_USER" pm2 restart "$APP_NAME"
fi

sudo -u "$APP_USER" pm2 save
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" >/dev/null 2>&1 || true

# --- Étape 12: Configurer le backup automatique ---
log "INFO" "Configuration des backups automatiques"
mkdir -p "$BACKUP_DIR"
BACKUP_SCRIPT="/usr/local/bin/${APP_NAME}-backup.sh"
cat <<'BACKUP' > "$BACKUP_SCRIPT"
#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$1"
BACKUP_DIR="$2"
RETENTION_DAYS="$3"
APP_NAME="$4"
mkdir -p "$BACKUP_DIR"
ARCHIVE="$BACKUP_DIR/${APP_NAME}-$(date +%F-%H%M%S).tar.gz"
tar -czf "$ARCHIVE" -C "$APP_DIR" .
find "$BACKUP_DIR" -type f -name '*.tar.gz' -mtime "+${RETENTION_DAYS}" -delete
BACKUP
chmod +x "$BACKUP_SCRIPT"

CRON_FILE="/etc/cron.d/${APP_NAME}-backup"
cat <<CRON > "$CRON_FILE"
0 3 * * * root $BACKUP_SCRIPT "$APP_DIR" "$BACKUP_DIR" "$BACKUP_RETENTION_DAYS" "$APP_NAME" >> /var/log/${APP_NAME}-backup.log 2>&1
CRON

# --- Étape 13: Tester que tout fonctionne ---
log "INFO" "Tests de validation"
run "Vérification Nginx" systemctl is-active --quiet nginx
run "Vérification PM2" sudo -u "$APP_USER" pm2 list
if curl -fsS "http://127.0.0.1:${APP_PORT}" >/dev/null 2>&1; then
    log "INFO" "Application répond sur http://127.0.0.1:${APP_PORT}"
else
    log "ERROR" "Impossible de joindre l'application sur http://127.0.0.1:${APP_PORT}"
    exit 1
fi

log "INFO" "Déploiement terminé avec succès ✅"
