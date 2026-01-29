# 🚀 Déploiement Rapide Romuo.ch sur VPS Hostinger

**IP VPS**: 76.13.6.218
**OS**: Ubuntu 24.04 LTS
**Ressources**: 2 CPU / 8GB RAM / 100GB Disque
**Localisation**: Frankfurt, Germany
**Durée estimée**: 20-30 minutes

---

## ⚡ MÉTHODE ULTRA-RAPIDE (Script Automatique)

### Connexion SSH

```bash
ssh root@76.13.6.218
# Entrez le mot de passe root fourni par Hostinger
```

### Script d'Installation Automatique

Copiez-collez **TOUT CE BLOC** en une seule fois dans votre terminal SSH:

```bash
curl -fsSL https://raw.githubusercontent.com/SwissEliteVan/Emergent-VTC/claude/fix-mongodb-syntax-agjDx/install_rapide.sh | bash
```

**OU** si vous préférez voir ce qui se passe (installation manuelle ci-dessous).

---

## 📋 MÉTHODE MANUELLE (Étape par Étape)

### ÉTAPE 1: Mise à Jour Système (2-3 min)

```bash
# Mise à jour des paquets
apt update && apt upgrade -y

# Installation des outils de base
apt install -y curl wget git nano ufw software-properties-common gnupg
```

---

### ÉTAPE 2: Installation Python 3.11 (2 min)

```bash
# Ajouter le repository Python
add-apt-repository ppa:deadsnakes/ppa -y
apt update

# Installer Python 3.11
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Vérifier
python3.11 --version

# Installer pip pour Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
```

---

### ÉTAPE 3: Installation MongoDB 8.0 (3 min)

```bash
# Importer la clé GPG MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg

# Ajouter le repository MongoDB 8.0
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list

# Installer MongoDB 8.0
apt update
apt install -y mongodb-org

# Configuration MongoDB 8.0 (syntaxe stricte)
printf "# MongoDB 8.0 Configuration - Romuo.ch\n\nstorage:\n  dbPath: /var/lib/mongodb\n  journal:\n    enabled: true\n\nsystemLog:\n  destination: file\n  path: /var/log/mongodb/mongod.log\n  logAppend: true\n\nnet:\n  port: 27017\n  bindIp: 127.0.0.1\n" > /etc/mongod.conf

# Démarrer MongoDB
systemctl start mongod
systemctl enable mongod

# Vérifier
systemctl status mongod
```

---

### ÉTAPE 4: Configuration Sécurisée MongoDB (2 min)

```bash
# Se connecter à MongoDB
mongosh
```

**Dans le shell MongoDB, copiez ces commandes UNE PAR UNE:**

```javascript
// Créer la base admin
use admin

// Créer l'utilisateur root
db.createUser({
  user: "romuo_root",
  pwd: "Romuo2025SecurePassword!",
  roles: [
    { role: "root", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

// Vérifier
db.getUsers()

// Sortir
exit
```

**Activer l'authentification:**

```bash
# Ajouter la sécurité dans la config
printf "\nsecurity:\n  authorization: enabled\n" >> /etc/mongod.conf

# Redémarrer MongoDB
systemctl restart mongod

# Tester la connexion authentifiée
mongosh -u romuo_root -p Romuo2025SecurePassword! --authenticationDatabase admin
# Tapez 'exit' pour sortir
```

---

### ÉTAPE 5: Installation Nginx (1 min)

```bash
# Installer Nginx
apt install -y nginx

# Démarrer et activer
systemctl start nginx
systemctl enable nginx

# Vérifier
systemctl status nginx
```

---

### ÉTAPE 6: Cloner le Projet (2 min)

```bash
# Créer le répertoire
mkdir -p /var/www/romuo-ch
cd /var/www/romuo-ch

# Cloner le projet
git clone https://github.com/SwissEliteVan/Emergent-VTC.git .

# Vérifier
ls -la
# Vous devriez voir: backend/ frontend/ docs/ etc.
```

---

### ÉTAPE 7: Configuration Backend (3 min)

```bash
# Aller dans le backend
cd /var/www/romuo-ch/backend

# Créer l'environnement virtuel
python3.11 -m venv venv

# Activer l'environnement
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << 'EOF'
# MongoDB Connection (avec authentification)
MONGO_URL=mongodb://romuo_root:Romuo2025SecurePassword!@localhost:27017/romuo_production?authSource=admin

# Database
DB_NAME=romuo_production

# Admin Dashboard
ADMIN_PASSWORD=RomuoAdmin2025!

# Production Mode
ENV=production
EOF

# Désactiver le venv
deactivate
```

---

### ÉTAPE 8: Créer le Service Backend (2 min)

```bash
# Créer le fichier service systemd
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

# Recharger systemd
systemctl daemon-reload

# Démarrer le service
systemctl start romuo-backend
systemctl enable romuo-backend

# Vérifier
systemctl status romuo-backend

# Tester l'API
curl http://localhost:8001/api/vehicles
```

---

### ÉTAPE 9: Configuration Nginx (2 min)

```bash
# Créer la configuration Nginx
cat > /etc/nginx/sites-available/romuo.ch << 'EOF'
# API Backend
server {
    listen 80;
    server_name api.romuo.ch 76.13.6.218;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# Frontend & Admin
server {
    listen 80;
    server_name romuo.ch www.romuo.ch;

    client_max_body_size 20M;

    # Admin dashboard
    location /admin {
        proxy_pass http://127.0.0.1:8001/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API routes
    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Documentation
    location /docs {
        proxy_pass http://127.0.0.1:8001/docs;
        proxy_set_header Host $host;
    }

    # Root
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
    }
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/romuo.ch /etc/nginx/sites-enabled/

# Supprimer la config par défaut
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

# Recharger Nginx
systemctl reload nginx
```

---

### ÉTAPE 10: Configuration Firewall (1 min)

```bash
# Autoriser SSH (CRITIQUE!)
ufw allow 22/tcp

# Autoriser HTTP et HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall
ufw --force enable

# Vérifier
ufw status
```

---

### ÉTAPE 11: Tests de Fonctionnement (1 min)

```bash
# Test 1: API via localhost
curl http://localhost:8001/api/vehicles

# Test 2: API via IP publique
curl http://76.13.6.218/api/vehicles

# Test 3: Vérifier tous les services
systemctl status mongod romuo-backend nginx

# Test 4: Vérifier les ports
ss -ltnp | grep -E ":(27017|8001|80)"
```

**Résultats attendus:**
```
*:27017  → mongod
*:8001   → uvicorn (backend)
*:80     → nginx
```

---

## 🌐 Configuration DNS (À FAIRE SUR HOSTINGER PANEL)

**⚠️ IMPORTANT**: Configurez votre DNS **AVANT** d'installer le SSL.

1. Connectez-vous à votre panneau Hostinger
2. Allez dans **Domains** → **romuo.ch** → **DNS Zone**
3. Ajoutez ces enregistrements A:

| Type | Nom | Pointe vers | TTL |
|------|-----|-------------|-----|
| A | @ | 76.13.6.218 | 3600 |
| A | www | 76.13.6.218 | 3600 |
| A | api | 76.13.6.218 | 3600 |

4. **Attendez 5-30 minutes** pour la propagation DNS

**Vérifier la propagation:**

```bash
# Sur votre VPS
nslookup romuo.ch
nslookup api.romuo.ch

# Devrait retourner: 76.13.6.218
```

---

## 🔒 Installation SSL/HTTPS (3 min)

**⚠️ Attendez que le DNS soit propagé avant de continuer!**

```bash
# Installer Certbot
apt install -y certbot python3-certbot-nginx

# Obtenir les certificats SSL
certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch

# Répondre aux questions:
# Email: votre@email.com
# Terms: Y
# Share email: N
# Redirect to HTTPS: 2 (oui)

# Tester le renouvellement automatique
certbot renew --dry-run
```

---

## ✅ VÉRIFICATIONS FINALES

### Checklist Complète

```bash
# 1. Services actifs
systemctl status mongod romuo-backend nginx
# Tous doivent être "active (running)"

# 2. Ports écoutent
ss -ltnp | grep -E ":(27017|8001|80|443)"

# 3. MongoDB authentifié
mongosh -u romuo_root -p Romuo2025SecurePassword! --authenticationDatabase admin
# Tapez 'exit'

# 4. API fonctionne
curl http://localhost:8001/api/vehicles
curl http://76.13.6.218/api/vehicles
curl https://api.romuo.ch/api/vehicles  # Après SSL

# 5. Firewall actif
ufw status
# Doit montrer: 22, 80, 443 ALLOW

# 6. Logs backend sans erreurs
journalctl -u romuo-backend -n 50
```

### URLs de Test (Après DNS + SSL)

1. **API Vehicles**: https://api.romuo.ch/api/vehicles
2. **Documentation API**: https://api.romuo.ch/docs
3. **Admin Dashboard**: https://romuo.ch/admin
   - Mot de passe: `RomuoAdmin2025!`

---

## 🔧 Commandes de Maintenance

### Voir les Logs

```bash
# Backend logs (temps réel)
journalctl -u romuo-backend -f

# MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Redémarrer les Services

```bash
# Redémarrer tout
systemctl restart mongod romuo-backend nginx

# Redémarrer individuellement
systemctl restart romuo-backend
systemctl restart mongod
systemctl reload nginx
```

### Mettre à Jour le Code

```bash
cd /var/www/romuo-ch

# Pull les derniers changements
git pull origin main  # ou la branche principale

# Redémarrer le backend
systemctl restart romuo-backend
```

### Backup MongoDB

```bash
# Créer un répertoire backup
mkdir -p /backup/mongodb

# Backup manuel
mongodump --uri="mongodb://romuo_root:Romuo2025SecurePassword!@localhost:27017/romuo_production?authSource=admin" --out=/backup/mongodb/$(date +%Y%m%d_%H%M%S)

# Lister les backups
ls -lh /backup/mongodb/
```

### Restaurer un Backup

```bash
# Restaurer (remplacez la date par votre backup)
mongorestore --uri="mongodb://romuo_root:Romuo2025SecurePassword!@localhost:27017/romuo_production?authSource=admin" /backup/mongodb/20250122_120000/romuo_production
```

---

## 📊 Monitoring Automatique

### Script de Health Check

```bash
# Créer le script
cat > /root/romuo_health.sh << 'EOF'
#!/bin/bash
echo "=== Romuo Health Check - $(date) ==="

# Services
echo "MongoDB: $(systemctl is-active mongod)"
echo "Backend: $(systemctl is-active romuo-backend)"
echo "Nginx: $(systemctl is-active nginx)"

# API Test
curl -s http://localhost:8001/api/vehicles > /dev/null && echo "API: OK" || echo "API: FAILED"

# Resources
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
echo "Memory: $(free -m | awk 'NR==2{printf "%.0f%%", $3*100/$2 }')"
echo "Disk: $(df -h / | awk 'NR==2 {print $5}')"
echo ""
EOF

# Rendre exécutable
chmod +x /root/romuo_health.sh

# Tester
/root/romuo_health.sh

# Ajouter au cron (toutes les 6 heures)
(crontab -l 2>/dev/null; echo "0 */6 * * * /root/romuo_health.sh >> /var/log/romuo_health.log 2>&1") | crontab -
```

---

## 🆘 Dépannage Rapide

### Backend ne démarre pas

```bash
# Voir les erreurs
journalctl -u romuo-backend -n 100 --no-pager

# Tester manuellement
cd /var/www/romuo-ch/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
# Regardez les erreurs
```

### MongoDB erreur authentification

```bash
# Vérifier la config
cat /etc/mongod.conf

# Vérifier l'utilisateur
mongosh
use admin
db.getUsers()
exit

# Réinitialiser si nécessaire (voir MONGODB_8_OPTIMIZATIONS.md)
```

### Nginx erreur 502 Bad Gateway

```bash
# Vérifier que le backend tourne
systemctl status romuo-backend
curl http://localhost:8001/api/vehicles

# Vérifier la config Nginx
nginx -t

# Voir les logs
tail -f /var/log/nginx/error.log
```

---

## PWA Web Application (Alternative au Mobile)

Si vous souhaitez déployer uniquement la version web (PWA) sans l'app mobile:

### Déploiement PWA React (Romuo.ch)

```bash
# Configurer Nginx pour la PWA
cat > /etc/nginx/sites-available/pwa << 'EOF'
server {
    listen 80;
    server_name app.romuo.ch;

    root /var/www/romuo-ch/pwa-react;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets 1 an
    location ~* \.(js|css|png|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - pas de cache
    location = /service-worker.js {
        expires off;
        add_header Cache-Control "no-store";
    }
}
EOF

# Activer
ln -sf /etc/nginx/sites-available/pwa /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# SSL (après configuration DNS pour app.romuo.ch)
certbot --nginx -d app.romuo.ch
```

### DNS pour PWA

Ajoutez sur Hostinger:
| Type | Nom | Pointe vers | TTL |
|------|-----|-------------|-----|
| A | app | 76.13.6.218 | 3600 |

### Service Worker Résilient

Le Service Worker est configuré pour être **résilient**:
- Assets critiques (HTML, CSS, JS) : `cache.addAll()`
- Assets optionnels (icônes) : `Promise.allSettled()`

L'app s'installe même si certaines ressources PNG sont manquantes.

### PWA Features

| Feature | PWA React | PWA Vanilla |
|---------|-----------|-------------|
| Dossier | `pwa-react/` | `pwa/` |
| Framework | React + Tailwind | Vanilla JS |
| Pricing | CHF | EUR |
| Design | Swiss Style | Corporate |

---

## Prochaines Étapes (Optionnel)

### Installer Docker pour le Frontend

```bash
# Installer Docker
curl -fsSL https://get.docker.com | sh

# Démarrer Docker
systemctl start docker
systemctl enable docker

# Vérifier
docker --version
```

### Build Frontend Mobile

```bash
cd /var/www/romuo-ch/frontend

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Installer Yarn
npm install -g yarn

# Installer les dépendances
yarn install

# Créer le .env
cat > .env << 'EOF'
EXPO_PUBLIC_BACKEND_URL=https://api.romuo.ch
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=VOTRE_CLE_GOOGLE_MAPS
EOF

# Démarrer en mode web (test)
yarn start --web
```

---

## 🎉 RÉSUMÉ

### Ce qui est installé:
- ✅ Ubuntu 24.04 LTS à jour
- ✅ Python 3.11
- ✅ MongoDB 8.0 (avec authentification sécurisée)
- ✅ Nginx (reverse proxy)
- ✅ Backend FastAPI (romuo-backend service)
- ✅ Firewall UFW configuré
- ✅ SSL/HTTPS (après configuration DNS)

### URLs Accessibles:
- **API**: https://api.romuo.ch
- **Docs**: https://api.romuo.ch/docs
- **Admin**: https://romuo.ch/admin

### Credentials:
- **MongoDB**: `romuo_root` / `Romuo2025SecurePassword!`
- **Admin Dashboard**: `RomuoAdmin2025!`

### Ressources VPS:
- CPU: 2 cores
- RAM: 8GB
- Disque: 100GB
- Bande passante: 8TB/mois

---

## 📞 Support

**Documentation**:
- `GUIDE_COMPLET_DEPLOIEMENT.md` - Guide détaillé
- `MONGODB_8_OPTIMIZATIONS.md` - Spécifique MongoDB 8.0
- `PRODUCTION_GUIDE.md` - Guide complet production

**Commande de diagnostic complète**:
```bash
/root/romuo_health.sh
```

**Bon déploiement! 🚀**
