#!/bin/bash
# Script de deploiement pour VPS Hostinger Ubuntu 24.04
# Usage: ./deploy-vps.sh

set -e

echo "=========================================="
echo "Deploiement Romuo.ch sur VPS Hostinger"
echo "=========================================="

# Variables
DOMAIN="romuo.ch"
WEB_ROOT="/var/www/${DOMAIN}"
REPO_DIR="/home/deploy/Emergent-VTC"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verification root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Ce script doit etre execute en tant que root (sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}[1/8] Installation des dependances...${NC}"
apt update
apt install -y nginx certbot python3-certbot-nginx nodejs npm

# Verifier la version de Node.js (minimum 18)
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Installation de Node.js 20 LTS...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo -e "${YELLOW}[2/8] Creation des repertoires...${NC}"
mkdir -p ${WEB_ROOT}/dist
mkdir -p ${WEB_ROOT}/pwa
chown -R www-data:www-data ${WEB_ROOT}

echo -e "${YELLOW}[3/8] Build du frontend React...${NC}"
cd ${REPO_DIR}/frontend-romuo
npm ci --prefer-offline
npm run build

echo -e "${YELLOW}[4/8] Copie des fichiers...${NC}"
# Copier le build React vers la racine web
cp -r ${REPO_DIR}/frontend-romuo/dist/* ${WEB_ROOT}/dist/

# Copier la PWA si elle existe
if [ -d "${REPO_DIR}/pwa-react" ]; then
    cp -r ${REPO_DIR}/pwa-react/* ${WEB_ROOT}/pwa/
fi

# S'assurer que .htaccess est copie (backup pour Apache)
if [ -f "${REPO_DIR}/frontend-romuo/public/.htaccess" ]; then
    cp ${REPO_DIR}/frontend-romuo/public/.htaccess ${WEB_ROOT}/dist/
fi

chown -R www-data:www-data ${WEB_ROOT}

echo -e "${YELLOW}[5/8] Configuration Nginx...${NC}"
# Copier la configuration nginx
cp ${REPO_DIR}/nginx/romuo.ch.conf ${NGINX_AVAILABLE}/${DOMAIN}

# Activer le site (si pas deja fait)
if [ ! -L "${NGINX_ENABLED}/${DOMAIN}" ]; then
    ln -s ${NGINX_AVAILABLE}/${DOMAIN} ${NGINX_ENABLED}/${DOMAIN}
fi

# Desactiver le site par defaut si existe
if [ -L "${NGINX_ENABLED}/default" ]; then
    rm ${NGINX_ENABLED}/default
fi

echo -e "${YELLOW}[6/8] Test de la configuration Nginx...${NC}"
nginx -t

echo -e "${YELLOW}[7/8] Configuration SSL avec Let's Encrypt...${NC}"
# Verifier si le certificat existe deja
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo "Generation du certificat SSL..."
    certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}
else
    echo "Certificat SSL existant, renouvellement si necessaire..."
    certbot renew --dry-run
fi

echo -e "${YELLOW}[8/8] Redemarrage de Nginx...${NC}"
systemctl reload nginx

echo ""
echo -e "${GREEN}=========================================="
echo "Deploiement termine avec succes!"
echo "=========================================="
echo ""
echo "Site principal: https://${DOMAIN}"
echo "PWA:           https://${DOMAIN}/pwa"
echo ""
echo "Pour verifier le statut:"
echo "  sudo systemctl status nginx"
echo "  sudo nginx -t"
echo ""
echo "Pour voir les logs:"
echo "  tail -f /var/log/nginx/${DOMAIN}.access.log"
echo "  tail -f /var/log/nginx/${DOMAIN}.error.log"
echo -e "${NC}"

# Verification finale
echo -e "${YELLOW}Verification de l'installation...${NC}"
curl -sI https://${DOMAIN} | head -5 || echo -e "${RED}Attention: le site n'est pas encore accessible. Verifiez le DNS.${NC}"
