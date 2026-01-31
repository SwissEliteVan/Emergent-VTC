# 🚀 Guide Complet de Déploiement Romuo.ch sur VPS Hostinger
## Guide Pas-à-Pas avec Toutes les Commandes Exactes

---

## 📋 AVANT DE COMMENCER

**Ce dont vous avez besoin :**
- Accès SSH à votre VPS Hostinger (IP, mot de passe root)
- Nom de domaine romuo.ch pointant vers votre VPS
- Sous-domaine api.romuo.ch pointant vers votre VPS
- Votre code sur GitHub (après export via Emergent)
- Clé Google Maps API
- 30-45 minutes de temps

---

## ÉTAPE 1 : CONNEXION INITIALE AU VPS

```bash
# Remplacez XXX.XXX.XXX.XXX par l'IP de votre VPS Hostinger
ssh root@XXX.XXX.XXX.XXX

# Tapez 'yes' si demandé de confirmer la connexion
# Entrez le mot de passe root fourni par Hostinger
```

**✅ Vous devriez voir** : `root@votre-hostname:~#`

---

## ÉTAPE 1B : PRÉPARATION DU SERVEUR NODE.JS (OUTILS, NGINX, PM2)

> Cette étape met en place les dépendances système, Node.js 20 LTS, Nginx en reverse proxy, PM2 et un pare-feu de base.

### 1B.1 Mettre à jour le système + installer les dépendances de base

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nano ufw software-properties-common gnupg
```

**Pourquoi :** applique les correctifs de sécurité et installe les outils essentiels (téléchargement, éditeur, firewall).

### 1B.2 Installer Node.js 20.x (LTS) + npm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Vérification rapide (optionnel) :

```bash
node -v
npm -v
```

**Pourquoi :** installe la version LTS de Node.js pour un environnement stable en production.

### 1B.3 Installer Nginx et configurer le reverse proxy

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Créer la configuration Nginx (remplacez votre-domaine.com et le port si besoin) :

```bash
sudo nano /etc/nginx/sites-available/votre-domaine.com
```

Collez (adaptez domaine + port) :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Activer le site + recharger Nginx :

```bash
sudo ln -s /etc/nginx/sites-available/votre-domaine.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Pourquoi :** Nginx sert de reverse proxy, expose l’application et gère le trafic HTTP/HTTPS.

### 1B.4 Installer PM2 (gestion du processus Node.js)

```bash
sudo npm install -g pm2
```

Démarrer l’app :

```bash
cd /var/www/votre-app
pm2 start server.js --name votre-app
pm2 save
pm2 startup
```

Vérification :

```bash
pm2 status
```

**Pourquoi :** PM2 garde l’application en ligne, relance en cas de crash et active le démarrage automatique.

### 1B.5 Configurer le pare-feu UFW (sécurité réseau)

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

**Pourquoi :** limite l’exposition aux ports indispensables (SSH, HTTP, HTTPS).

### 1B.6 Créer un utilisateur dédié (non-root)

```bash
sudo adduser vtcapp
sudo usermod -aG sudo vtcapp
sudo mkdir -p /var/www/votre-app
sudo chown -R vtcapp:vtcapp /var/www/votre-app
```

**Pourquoi :** applique le principe du moindre privilège pour l’exécution de l’app.

---

## ÉTAPE 2 : MISE À JOUR DU SYSTÈME

```bash
# Mise à jour de la liste des paquets
apt update

# Mise à jour de tous les paquets installés (cela peut prendre 5-10 minutes)
apt upgrade -y

# Redémarrer le serveur (optionnel mais recommandé)
reboot

# Reconnectez-vous après 2 minutes
ssh root@XXX.XXX.XXX.XXX
```

---

## ÉTAPE 3 : INSTALLATION DE PYTHON 3.11

```bash
# Ajouter le repository pour Python 3.11
apt install software-properties-common -y
add-apt-repository ppa:deadsnakes/ppa -y
apt update

# Installer Python 3.11 et les outils nécessaires
apt install python3.11 python3.11-venv python3.11-dev python3-pip -y

# Vérifier l'installation
python3.11 --version
# Vous devriez voir : Python 3.11.x

# Installer pip pour Python 3.11
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11
```

---

## ÉTAPE 4 : INSTALLATION DE MONGODB 7.0

```bash
# Importer la clé GPG de MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Ajouter le repository MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Mettre à jour et installer MongoDB
apt update
apt install -y mongodb-org

# Démarrer MongoDB
systemctl start mongod

# Activer MongoDB au démarrage
systemctl enable mongod

# Vérifier que MongoDB fonctionne
systemctl status mongod
# Vous devriez voir "active (running)" en vert

# Appuyez sur 'q' pour quitter
```

---

## ÉTAPE 5 : INSTALLATION DE NGINX

```bash
# Installer Nginx
apt install nginx -y

# Démarrer Nginx
systemctl start nginx

# Activer Nginx au démarrage
systemctl enable nginx

# Vérifier que Nginx fonctionne
systemctl status nginx
# Vous devriez voir "active (running)"

# Appuyez sur 'q' pour quitter

# Tester dans votre navigateur
# Allez sur http://VOTRE_IP_VPS
# Vous devriez voir la page "Welcome to nginx!"
```

---

## ÉTAPE 6 : INSTALLATION DE GIT

```bash
# Installer Git
apt install git -y

# Vérifier l'installation
git --version
# Vous devriez voir : git version 2.x.x
```

---

## ÉTAPE 7 : CRÉATION DE LA STRUCTURE DU PROJET

```bash
# Créer le répertoire pour le projet
mkdir -p /var/www/romuo-ch

# Naviguer dans ce répertoire
cd /var/www/romuo-ch

# Vérifier où vous êtes
pwd
# Vous devriez voir : /var/www/romuo-ch
```

---

## ÉTAPE 8 : CLONER LE PROJET DEPUIS GITHUB

```bash
# IMPORTANT : Remplacez YOUR_USERNAME par votre nom d'utilisateur GitHub
# Si le repository est privé, GitHub vous demandera votre username et token

git clone https://github.com/YOUR_USERNAME/romuo-ch.git .

# Le point (.) à la fin signifie "cloner dans le répertoire actuel"

# Vérifier que les fichiers sont là
ls -la
# Vous devriez voir : backend/ frontend/ docs/ README.md etc.
```

**Note :** Si le repository est privé, créez un Personal Access Token sur GitHub :
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token → Cochez "repo" → Generate
3. Copiez le token et utilisez-le comme mot de passe quand Git le demande

---

## ÉTAPE 9 : CONFIGURATION DU BACKEND

### 9.1 : Créer l'environnement virtuel Python

```bash
# Naviguer dans le dossier backend
cd /var/www/romuo-ch/backend

# Créer l'environnement virtuel
python3.11 -m venv venv

# Activer l'environnement virtuel
source venv/bin/activate

# Votre prompt devrait maintenant montrer (venv) au début
# Exemple : (venv) root@hostname:/var/www/romuo-ch/backend#
```

### 9.2 : Installer les dépendances Python

```bash
# Installer toutes les dépendances (cela peut prendre 2-3 minutes)
pip install -r requirements.txt

# Vérifier l'installation
pip list
# Vous devriez voir fastapi, uvicorn, motor, pydantic, etc.
```

### 9.3 : Créer le fichier .env

```bash
# Créer le fichier .env
nano .env
```

**Copiez-collez exactement ce contenu dans nano :**

```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=romuo_production
ADMIN_PASSWORD=VotreMotDePasseSecurise2025!
```

**IMPORTANT :** 
- Changez `VotreMotDePasseSecurise2025!` par un mot de passe fort
- Utilisez au moins 16 caractères avec majuscules, minuscules, chiffres et symboles

**Sauvegarder :**
- Appuyez sur `Ctrl + O` (la lettre O, pas zéro)
- Appuyez sur `Enter` pour confirmer
- Appuyez sur `Ctrl + X` pour quitter

### 9.4 : Tester le backend manuellement

```bash
# Démarrer le serveur en mode test
uvicorn server:app --host 0.0.0.0 --port 8001

# Vous devriez voir :
# INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
# INFO:     Started server process [XXXX]
# INFO:     Waiting for application startup.
# INFO:     Application startup complete.
```

**Ouvrez un NOUVEAU terminal** (ne fermez pas celui-ci) et testez :

```bash
# Dans un nouveau terminal SSH
ssh root@XXX.XXX.XXX.XXX

# Tester l'API
curl http://localhost:8001/api/vehicles

# Vous devriez voir du JSON avec les véhicules Eco, Berline, Van
```

**Retournez au premier terminal et arrêtez le serveur :**
- Appuyez sur `Ctrl + C`

---

## ÉTAPE 10 : CRÉER LE SERVICE SYSTEMD (Backend Automatique)

### 10.1 : Créer le fichier service

```bash
# Créer le fichier service
nano /etc/systemd/system/romuo-backend.service
```

**Copiez-collez exactement ce contenu :**

```ini
[Unit]
Description=Romuo.ch Backend API (FastAPI)
After=network.target mongodb.service

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
```

**Sauvegarder :**
- `Ctrl + O`, `Enter`, `Ctrl + X`

### 10.2 : Activer et démarrer le service

```bash
# Recharger systemd pour lire le nouveau service
systemctl daemon-reload

# Démarrer le service backend
systemctl start romuo-backend

# Activer le démarrage automatique au boot
systemctl enable romuo-backend

# Vérifier que ça fonctionne
systemctl status romuo-backend

# Vous devriez voir "active (running)" en vert
# Appuyez sur 'q' pour quitter
```

### 10.3 : Tester le backend avec le service

```bash
# Tester l'API
curl http://localhost:8001/api/vehicles

# Vous devriez voir le JSON des véhicules
```

**Si vous voyez une erreur :**

```bash
# Voir les logs détaillés
journalctl -u romuo-backend -n 50

# Si MongoDB n'est pas accessible :
systemctl restart mongod
systemctl restart romuo-backend
```

---

## ÉTAPE 11 : SÉCURISATION DE MONGODB

### 11.1 : Créer un utilisateur admin MongoDB

```bash
# Connexion à MongoDB
mongosh

# Vous devriez voir le prompt : test>
```

**Dans le shell MongoDB, tapez ces commandes une par une :**

```javascript
// Utiliser la base admin
use admin

// Créer un utilisateur administrateur
db.createUser({
  user: "romuoadmin",
  pwd: "VotreMotDePasseMongoDB2025!",
  roles: [ { role: "root", db: "admin" } ]
})

// Vous devriez voir : { ok: 1 }

// Créer la base de données production
use romuo_production

// Sortir de MongoDB
exit
```

**IMPORTANT :** Notez bien le mot de passe que vous avez choisi !

### 11.2 : Activer l'authentification MongoDB

```bash
# Éditer la configuration MongoDB
nano /etc/mongod.conf
```

**Trouvez la section `#security:` (vers la ligne 30-40) et remplacez-la par :**

```yaml
security:
  authorization: enabled
```

**ATTENTION :** L'indentation est importante ! Utilisez exactement 2 espaces, pas de tabulation.

**Sauvegarder :**
- `Ctrl + O`, `Enter`, `Ctrl + X`

### 11.3 : Redémarrer MongoDB

```bash
# Redémarrer MongoDB
systemctl restart mongod

# Vérifier que ça fonctionne
systemctl status mongod
# Doit être "active (running)"
```

### 11.4 : Mettre à jour le .env du backend

```bash
# Éditer le .env
nano /var/www/romuo-ch/backend/.env
```

**Remplacez la ligne MONGO_URL par (tout sur UNE SEULE ligne) :**

```bash
MONGO_URL=mongodb://romuoadmin:VotreMotDePasseMongoDB2025!@localhost:27017/romuo_production?authSource=admin
```

**IMPORTANT :** 
- Remplacez `VotreMotDePasseMongoDB2025!` par le mot de passe que vous avez créé à l'étape 11.1
- Tout doit être sur une seule ligne, sans retour à la ligne

**Sauvegarder :**
- `Ctrl + O`, `Enter`, `Ctrl + X`

### 11.5 : Redémarrer le backend

```bash
# Redémarrer le service backend
systemctl restart romuo-backend

# Vérifier que ça fonctionne
systemctl status romuo-backend

# Tester l'API
curl http://localhost:8001/api/vehicles
# Doit retourner le JSON des véhicules
```

---

## ÉTAPE 12 : CONFIGURATION DE NGINX (Reverse Proxy)

### 12.1 : Créer la configuration du site

```bash
# Créer le fichier de configuration
nano /etc/nginx/sites-available/romuo.ch
```

**Copiez-collez exactement ce contenu :**

```nginx
# API Backend
server {
    listen 80;
    server_name api.romuo.ch;

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

# Frontend et Admin
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

    # Documentation (optionnel)
    location /docs {
        proxy_pass http://127.0.0.1:8001/docs;
        proxy_set_header Host $host;
    }

    # Redoc documentation (optionnel)
    location /redoc {
        proxy_pass http://127.0.0.1:8001/redoc;
        proxy_set_header Host $host;
    }

    # Root
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
    }
}
```

**Sauvegarder :**
- `Ctrl + O`, `Enter`, `Ctrl + X`

### 12.2 : Activer le site

```bash
# Créer un lien symbolique pour activer le site
ln -s /etc/nginx/sites-available/romuo.ch /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut de nginx
rm /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
nginx -t

# Vous devriez voir :
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 12.3 : Redémarrer Nginx

```bash
# Redémarrer Nginx
systemctl restart nginx

# Vérifier que ça fonctionne
systemctl status nginx
# Doit être "active (running)"
```

---

## ÉTAPE 13 : CONFIGURATION DNS (SUR HOSTINGER)

**⚠️ À faire dans le panneau de contrôle Hostinger, PAS en ligne de commande :**

1. Connectez-vous à votre panneau Hostinger
2. Allez dans **Domains** → Sélectionnez `romuo.ch`
3. Cliquez sur **DNS Zone**
4. **Ajoutez ces enregistrements A** :

| Type | Nom | Points vers | TTL |
|------|-----|-------------|-----|
| A | @ | XXX.XXX.XXX.XXX (votre IP VPS) | 3600 |
| A | www | XXX.XXX.XXX.XXX (votre IP VPS) | 3600 |
| A | api | XXX.XXX.XXX.XXX (votre IP VPS) | 3600 |

5. Cliquez sur **Save** ou **Add Record**

**Attendre 5-30 minutes** pour la propagation DNS.

### Vérifier la propagation DNS

```bash
# Tester la résolution DNS (depuis votre VPS)
nslookup romuo.ch
nslookup api.romuo.ch

# Vous devriez voir votre adresse IP dans les résultats
```

---

## ÉTAPE 14 : INSTALLATION DES CERTIFICATS SSL (HTTPS)

### 14.1 : Installer Certbot

```bash
# Installer Certbot et le plugin Nginx
apt install certbot python3-certbot-nginx -y
```

### 14.2 : Obtenir les certificats SSL

```bash
# Obtenir les certificats pour vos 3 domaines
certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch

# Certbot va vous poser quelques questions :
```

**Répondez comme suit :**

1. **Email address** : Entrez votre email (pour les notifications d'expiration)
2. **Terms of Service** : Tapez `Y` puis `Enter`
3. **Share email** : Tapez `N` puis `Enter`
4. **Redirect HTTP to HTTPS** : Tapez `2` puis `Enter` (pour forcer HTTPS)

**Vous devriez voir :**
```
Congratulations! You have successfully enabled HTTPS!
```

### 14.3 : Vérifier le renouvellement automatique

```bash
# Tester le renouvellement automatique (simulation)
certbot renew --dry-run

# Si pas d'erreur, c'est bon !
```

---

## ÉTAPE 15 : CONFIGURATION DU FIREWALL

```bash
# Installer UFW (Uncomplicated Firewall)
apt install ufw -y

# Autoriser SSH (IMPORTANT : à faire AVANT d'activer le firewall!)
ufw allow 22/tcp

# Autoriser HTTP et HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Activer le firewall
ufw enable

# Tapez 'y' et Enter pour confirmer

# Vérifier le statut
ufw status

# Vous devriez voir :
# Status: active
# 22/tcp     ALLOW       Anywhere
# 80/tcp     ALLOW       Anywhere
# 443/tcp    ALLOW       Anywhere
```

---

## ÉTAPE 16 : TESTS FINAUX

### 16.1 : Test de l'API

```bash
# Test local (depuis le VPS)
curl http://localhost:8001/api/vehicles

# Test via HTTPS (depuis n'importe où)
curl https://api.romuo.ch/api/vehicles

# Les deux doivent retourner le JSON des véhicules
```

### 16.2 : Test dans le navigateur

**Ouvrez votre navigateur et testez ces URLs :**

1. **API Backend** : https://api.romuo.ch/api/vehicles
   - Doit afficher le JSON des véhicules

2. **Documentation API** : https://api.romuo.ch/docs
   - Doit afficher l'interface Swagger (documentation interactive)

3. **Admin Dashboard** : https://romuo.ch/admin
   - Doit afficher la page de login admin

4. **Test connexion admin** :
   - Entrez le mot de passe : `VotreMotDePasseSecurise2025!` (celui défini dans .env)
   - Devrait vous montrer le dashboard

### 16.3 : Test de calcul de prix

```bash
# Test de calcul de prix pour une course
curl -X POST https://api.romuo.ch/api/rides/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "pickup": {
      "latitude": 46.5197,
      "longitude": 6.6323,
      "address": "Lausanne"
    },
    "destination": {
      "latitude": 46.2044,
      "longitude": 6.1432,
      "address": "Geneva"
    },
    "vehicle_type": "berline",
    "distance_km": 65.5
  }'

# Doit retourner un prix calculé en CHF
```

---

## ÉTAPE 17 : CONFIGURATION DE LA SURVEILLANCE

### 17.1 : Script de monitoring simple

```bash
# Créer un script de monitoring
nano /root/check_romuo.sh
```

**Copiez ce contenu :**

```bash
#!/bin/bash

echo "=== Romuo.ch Health Check - $(date) ==="
echo ""

# Check Backend
echo "1. Backend API Status:"
systemctl is-active romuo-backend
echo ""

# Check MongoDB
echo "2. MongoDB Status:"
systemctl is-active mongod
echo ""

# Check Nginx
echo "3. Nginx Status:"
systemctl is-active nginx
echo ""

# Check API Response
echo "4. API Response Test:"
curl -s https://api.romuo.ch/api/vehicles | grep -o "eco" && echo "✓ API OK" || echo "✗ API ERROR"
echo ""

# Check Disk Space
echo "5. Disk Usage:"
df -h / | tail -1 | awk '{print "Used: " $3 " / " $2 " (" $5 ")"}'
echo ""

# Check Memory
echo "6. Memory Usage:"
free -h | grep Mem | awk '{print "Used: " $3 " / " $2}'
echo ""

echo "================================"
```

**Rendre le script exécutable :**

```bash
chmod +x /root/check_romuo.sh
```

**Tester le script :**

```bash
/root/check_romuo.sh
```

### 17.2 : Créer une tâche cron pour les logs

```bash
# Ouvrir crontab
crontab -e

# Choisissez 1 (nano) si demandé
```

**Ajoutez cette ligne à la fin du fichier :**

```bash
0 */6 * * * /root/check_romuo.sh >> /var/log/romuo_health.log 2>&1
```

**Sauvegarder :** `Ctrl + O`, `Enter`, `Ctrl + X`

Cela va exécuter le check toutes les 6 heures et sauvegarder les résultats dans `/var/log/romuo_health.log`

---

## ÉTAPE 18 : COMMANDES DE MAINTENANCE UTILES

### Voir les logs du backend

```bash
# Logs en temps réel
journalctl -u romuo-backend -f

# 50 dernières lignes
journalctl -u romuo-backend -n 50

# Appuyez sur Ctrl+C pour arrêter
```

### Redémarrer les services

```bash
# Redémarrer le backend
systemctl restart romuo-backend

# Redémarrer MongoDB
systemctl restart mongod

# Redémarrer Nginx
systemctl restart nginx

# Redémarrer tout
systemctl restart romuo-backend mongod nginx
```

### Backup de la base de données

```bash
# Créer un répertoire pour les backups
mkdir -p /backup/mongodb

# Backup manuel
mongodump --uri="mongodb://romuoadmin:VotreMotDePasseMongoDB2025!@localhost:27017/romuo_production?authSource=admin" --out=/backup/mongodb/$(date +%Y%m%d_%H%M%S)

# Vous verrez les fichiers de backup dans /backup/mongodb/
```

### Restaurer un backup

```bash
# Lister les backups disponibles
ls -la /backup/mongodb/

# Restaurer un backup (remplacez 20250118_120000 par la date de votre backup)
mongorestore --uri="mongodb://romuoadmin:VotreMotDePasseMongoDB2025!@localhost:27017/romuo_production?authSource=admin" /backup/mongodb/20250118_120000/romuo_production
```

### Mettre à jour le code depuis GitHub

```bash
# Naviguer dans le projet
cd /var/www/romuo-ch

# Pull les dernières modifications
git pull origin main

# Redémarrer le backend pour appliquer les changements
systemctl restart romuo-backend
```

---

## ✅ CHECKLIST FINALE

Vérifiez que tout fonctionne :

- [ ] Backend API répond : `curl https://api.romuo.ch/api/vehicles`
- [ ] Admin dashboard accessible : https://romuo.ch/admin
- [ ] Documentation accessible : https://api.romuo.ch/docs
- [ ] HTTPS activé (cadenas vert dans le navigateur)
- [ ] Services démarrent automatiquement : `systemctl status romuo-backend mongod nginx`
- [ ] Firewall activé : `ufw status`
- [ ] MongoDB sécurisé (authentification activée)
- [ ] Backups configurés

---

## 🎉 FÉLICITATIONS !

Votre plateforme Romuo.ch est maintenant en production sur votre VPS Hostinger !

### URLs de production :
- **API Backend** : https://api.romuo.ch
- **Documentation** : https://api.romuo.ch/docs
- **Admin Dashboard** : https://romuo.ch/admin

### Prochaines étapes :

1. **Ajouter votre clé Google Maps** (voir étape suivante)
2. **Tester le flux complet** avec l'app mobile
3. **Configurer les backups automatiques**
4. **Mettre en place un monitoring** (Uptime Robot, etc.)
5. **Build des apps mobiles** (Expo)

---

## ÉTAPE BONUS 1 : DÉPLOYER LA PWA WEB

Si vous souhaitez également déployer l'application web (PWA), suivez ces étapes:

### Option A: PWA React (Romuo.ch) - Recommandé

```bash
# Configurer Nginx pour servir la PWA
cat > /etc/nginx/sites-available/pwa << 'EOF'
server {
    listen 80;
    server_name app.romuo.ch;

    root /var/www/romuo-ch/pwa-react;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache pour assets statiques (1 an)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - jamais de cache
    location = /service-worker.js {
        expires off;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Manifest PWA
    location = /manifest.json {
        add_header Cache-Control "no-cache";
    }
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/pwa /etc/nginx/sites-enabled/

# Tester et recharger Nginx
nginx -t && systemctl reload nginx
```

### Option B: PWA Vanilla JS (Emergent VTC)

```bash
# Utiliser le dossier pwa/ au lieu de pwa-react/
# Même configuration Nginx, juste changer le root:
# root /var/www/romuo-ch/pwa;
```

### Ajouter le sous-domaine DNS

Sur Hostinger, ajoutez:

| Type | Nom | Pointe vers | TTL |
|------|-----|-------------|-----|
| A | app | 76.13.6.218 | 3600 |

### SSL pour la PWA

```bash
# Ajouter le certificat pour app.romuo.ch
certbot --nginx -d app.romuo.ch
```

### Caractéristiques PWA

| Feature | Description |
|---------|-------------|
| Offline | Service Worker résilient (fonctionne même si icônes manquantes) |
| Installable | manifest.json pour installation sur mobile/desktop |
| Pricing | CHF (Francs Suisses) - hardcodé |
| Design | Swiss International Style |

---

## ÉTAPE BONUS 2 : AJOUTER LA CLÉ GOOGLE MAPS

```bash
# Éditer le .env
nano /var/www/romuo-ch/backend/.env

# Ajouter cette ligne à la fin :
# GOOGLE_MAPS_API_KEY=VotreCleGoogleMapsIci

# Sauvegarder : Ctrl+O, Enter, Ctrl+X

# Redémarrer le backend
systemctl restart romuo-backend
```

**Pour obtenir une clé Google Maps :**
1. Allez sur https://console.cloud.google.com/
2. Créez un projet "Romuo.ch"
3. Activez : Maps SDK for Android, Maps SDK for iOS, Places API, Directions API
4. Créez une clé API
5. Ajoutez-la dans le .env

---

## 🆘 EN CAS DE PROBLÈME

### Le backend ne démarre pas

```bash
# Voir les logs d'erreur
journalctl -u romuo-backend -n 100

# Tester manuellement
cd /var/www/romuo-ch/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
# Regardez les erreurs qui s'affichent
```

### MongoDB ne se connecte pas

```bash
# Vérifier que MongoDB fonctionne
systemctl status mongod

# Si erreur, voir les logs
journalctl -u mongod -n 50

# Redémarrer MongoDB
systemctl restart mongod
```

### Nginx ne démarre pas

```bash
# Tester la configuration
nginx -t

# Voir les logs d'erreur
cat /var/log/nginx/error.log

# Redémarrer Nginx
systemctl restart nginx
```

### Le site n'est pas accessible

```bash
# Vérifier DNS
nslookup romuo.ch

# Vérifier le firewall
ufw status

# Vérifier que les services fonctionnent
systemctl status romuo-backend mongod nginx
```

---

## 📞 SUPPORT

Si vous rencontrez un problème spécifique, vérifiez :
1. Les logs : `journalctl -u romuo-backend -n 100`
2. La configuration : `nano /var/www/romuo-ch/backend/.env`
3. Les services : `systemctl status romuo-backend mongod nginx`

**Bon déploiement ! 🚀**
