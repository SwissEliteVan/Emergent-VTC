#!/bin/bash

#############################################
# Script d'Installation Automatique Romuo.ch
# VPS: 76.13.6.218 (Ubuntu 24.04)
# Durée: ~15-20 minutes
#############################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MONGODB_PASSWORD="Romuo2025SecurePassword!"
ADMIN_PASSWORD="RomuoAdmin2025!"
BACKEND_DIR="/var/www/romuo-ch"
VPS_IP="76.13.6.218"

echo -e "${GREEN}"
echo "=========================================="
echo "  Installation Automatique Romuo.ch"
echo "=========================================="
echo -e "${NC}"

# Fonction pour afficher les étapes
step() {
    echo -e "\n${YELLOW}==> $1${NC}\n"
}

# Fonction pour vérifier le succès
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ Erreur: $1${NC}"
        exit 1
    fi
}

# ÉTAPE 1: Mise à jour système
step "ÉTAPE 1/11: Mise à jour du système"
apt update && apt upgrade -y
apt install -y curl wget git nano ufw software-properties-common gnupg
check "Système mis à jour"

# ÉTAPE 2: Installation Python 3.11
step "ÉTAPE 2/11: Installation Python 3.11"
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
check "Python 3.11 installé ($(python3.11 --version))"

# ÉTAPE 3: Installation MongoDB 8.0
step "ÉTAPE 3/11: Installation MongoDB 8.0"
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt update
apt install -y mongodb-org
check "MongoDB 8.0 installé"

# Configuration MongoDB 8.0 (syntaxe stricte YAML)
step "Configuration MongoDB avec syntaxe stricte"
printf "# MongoDB 8.0 Configuration - Romuo.ch\n\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n\nsystemLog:\n  destination: file\n  path: /var/log/mongodb/mongod.log\n  logAppend: true\n\nnet:\n  port: 27017\n  bindIp: 127.0.0.1\n" > /etc/mongod.conf
systemctl start mongod
systemctl enable mongod
sleep 3
check "MongoDB démarré"

# ÉTAPE 4: Configuration sécurisée MongoDB
step "ÉTAPE 4/11: Configuration sécurité MongoDB"
mongosh --quiet --eval "
use admin
db.createUser({
  user: 'romuo_root',
  pwd: '$MONGODB_PASSWORD',
  roles: [
    { role: 'root', db: 'admin' },
    { role: 'readWriteAnyDatabase', db: 'admin' }
  ]
})
" || echo "Utilisateur existe déjà"

printf "\nsecurity:\n  authorization: enabled\n" >> /etc/mongod.conf
systemctl restart mongod
sleep 3
check "Authentification MongoDB activée"

# ÉTAPE 5: Installation Nginx
step "ÉTAPE 5/11: Installation Nginx"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
check "Nginx installé et démarré"

# ÉTAPE 6: Clonage du projet
step "ÉTAPE 6/11: Clonage du projet Romuo.ch"
mkdir -p $BACKEND_DIR
cd $BACKEND_DIR
if [ -d ".git" ]; then
    echo "Projet déjà cloné, mise à jour..."
    git pull origin main || git pull origin master || echo "Pas de mise à jour disponible"
else
    git clone https://github.com/SwissEliteVan/Emergent-VTC.git .
fi
check "Projet cloné"

# ÉTAPE 7: Configuration Backend
step "ÉTAPE 7/11: Configuration Backend FastAPI"
cd $BACKEND_DIR/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
deactivate
check "Dépendances Python installées"

# Créer le .env
cat > $BACKEND_DIR/backend/.env << EOF
# MongoDB Connection (avec authentification MongoDB 8.0)
MONGO_URL=mongodb://romuo_root:$MONGODB_PASSWORD@localhost:27017/romuo_production?authSource=admin

# Database
DB_NAME=romuo_production

# Admin Dashboard
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Production Mode
ENV=production
EOF
check "Fichier .env créé"

# ÉTAPE 8: Service Systemd Backend
step "ÉTAPE 8/11: Création service systemd romuo-backend"
cat > /etc/systemd/system/romuo-backend.service << 'EOF'
[Unit]
Description=Romuo.ch Backend API (FastAPI)
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/romuo-ch/backend
Environment="PATH=/var/www/romuo-ch/backend/venv/bin"
ExecStart=/var/www/romuo-ch/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start romuo-backend
systemctl enable romuo-backend
sleep 3
check "Service romuo-backend démarré"

# ÉTAPE 9: Configuration Nginx
step "ÉTAPE 9/11: Configuration Nginx reverse proxy"
cat > /etc/nginx/sites-available/romuo.ch << EOF
# API Backend
server {
    listen 80;
    server_name api.romuo.ch $VPS_IP;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend & Admin
server {
    listen 80;
    server_name romuo.ch www.romuo.ch;

    client_max_body_size 20M;

    location /admin {
        proxy_pass http://127.0.0.1:8001/admin;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8001/docs;
        proxy_set_header Host \$host;
    }

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host \$host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/romuo.ch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
check "Nginx configuré"

# ÉTAPE 10: Configuration Firewall
step "ÉTAPE 10/11: Configuration Firewall UFW"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
check "Firewall configuré"

# ÉTAPE 11: Script de monitoring
step "ÉTAPE 11/11: Création script de monitoring"
cat > /root/romuo_health.sh << 'EOFSCRIPT'
#!/bin/bash
echo "=== Romuo Health Check - $(date) ==="
echo "MongoDB: $(systemctl is-active mongod)"
echo "Backend: $(systemctl is-active romuo-backend)"
echo "Nginx: $(systemctl is-active nginx)"
curl -s http://localhost:8001/api/vehicles > /dev/null && echo "API: OK" || echo "API: FAILED"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory: $(free -m | awk 'NR==2{printf "%.0f%%", $3*100/$2 }')"
echo "Disk: $(df -h / | awk 'NR==2 {print $5}')"
echo ""
EOFSCRIPT

chmod +x /root/romuo_health.sh
(crontab -l 2>/dev/null; echo "0 */6 * * * /root/romuo_health.sh >> /var/log/romuo_health.log 2>&1") | crontab -
check "Script de monitoring créé"

# TESTS FINAUX
echo -e "\n${GREEN}=========================================="
echo "  INSTALLATION TERMINÉE ✓"
echo "==========================================${NC}\n"

echo "Tests de fonctionnement:"
echo ""

# Test MongoDB
echo -n "MongoDB: "
systemctl is-active mongod

# Test Backend
echo -n "Backend: "
systemctl is-active romuo-backend

# Test Nginx
echo -n "Nginx: "
systemctl is-active nginx

# Test API
echo -n "API Test: "
if curl -s http://localhost:8001/api/vehicles > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
fi

echo ""
echo -e "${YELLOW}=========================================="
echo "  INFORMATIONS IMPORTANTES"
echo "==========================================${NC}"
echo ""
echo "URLs à tester:"
echo "  - API via IP: http://$VPS_IP/api/vehicles"
echo "  - Docs: http://$VPS_IP/docs"
echo "  - Admin: http://$VPS_IP/admin"
echo ""
echo "Credentials:"
echo "  - MongoDB: romuo_root / $MONGODB_PASSWORD"
echo "  - Admin Dashboard: $ADMIN_PASSWORD"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Configurez votre DNS maintenant!${NC}"
echo ""
echo "Dans Hostinger Panel → Domains → romuo.ch → DNS Zone:"
echo "  Type A  |  @    →  $VPS_IP"
echo "  Type A  |  www  →  $VPS_IP"
echo "  Type A  |  api  →  $VPS_IP"
echo ""
echo "Après propagation DNS (5-30 min), installez SSL:"
echo "  certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch"
echo ""
echo "Commandes utiles:"
echo "  - Health check: /root/romuo_health.sh"
echo "  - Logs backend: journalctl -u romuo-backend -f"
echo "  - Redémarrer: systemctl restart romuo-backend"
echo ""
echo -e "${GREEN}Déploiement réussi! 🚀${NC}"
