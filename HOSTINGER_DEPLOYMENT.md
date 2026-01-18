# Romuo.ch - Guide de Déploiement sur Hostinger VPS

## 📋 Prérequis sur votre VPS Hostinger

Votre serveur doit avoir :
- Ubuntu 20.04 ou 22.04 LTS
- Au moins 2 GB RAM
- Python 3.11+
- Node.js 18+ (pour l'admin web)
- MongoDB 7.0+
- Nginx (reverse proxy)
- Accès SSH root

---

## 🚀 ÉTAPE 1 : Installation des dépendances système

```bash
# Connexion SSH à votre VPS
ssh root@votre-ip-vps

# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Python 3.11 et pip
sudo apt install python3.11 python3.11-venv python3-pip -y

# Installation de MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Installation de Nginx
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Installation de Node.js (pour l'admin web si nécessaire)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de Git
sudo apt install git -y
```

---

## 📦 ÉTAPE 2 : Cloner le projet depuis GitHub

```bash
# Créer un répertoire pour l'application
cd /var/www
sudo mkdir romuo-ch
sudo chown -R $USER:$USER romuo-ch
cd romuo-ch

# Cloner le repository (REMPLACEZ PAR VOTRE URL GITHUB)
git clone https://github.com/votre-username/romuo-ch.git .

# Vérifier la structure
ls -la
# Vous devriez voir : backend/ frontend/ docs/ README.md
```

---

## 🔧 ÉTAPE 3 : Configuration du Backend (FastAPI)

```bash
# Naviguer vers le dossier backend
cd /var/www/romuo-ch/backend

# Créer un environnement virtuel Python
python3.11 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env (IMPORTANT!)
nano .env
```

**Contenu du fichier `/var/www/romuo-ch/backend/.env` :**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=romuo_production
ADMIN_PASSWORD=VotreMotDePasseSecurise2025!
```

**Sauvegarder** : Ctrl+O, Enter, Ctrl+X

```bash
# Test manuel du serveur
uvicorn server:app --host 0.0.0.0 --port 8001

# Si ça fonctionne, arrêter avec Ctrl+C
```

---

## ⚙️ ÉTAPE 4 : Configuration de Systemd (Service permanent)

Créer un service pour que le backend démarre automatiquement :

```bash
sudo nano /etc/systemd/system/romuo-backend.service
```

**Contenu :**
```ini
[Unit]
Description=Romuo.ch Backend API (FastAPI)
After=network.target mongodb.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/romuo-ch/backend
Environment="PATH=/var/www/romuo-ch/backend/venv/bin"
ExecStart=/var/www/romuo-ch/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Activer et démarrer le service :**
```bash
sudo systemctl daemon-reload
sudo systemctl start romuo-backend
sudo systemctl enable romuo-backend
sudo systemctl status romuo-backend
```

---

## 🌐 ÉTAPE 5 : Configuration de Nginx (Reverse Proxy)

```bash
sudo nano /etc/nginx/sites-available/romuo.ch
```

**Contenu :**
```nginx
server {
    listen 80;
    server_name api.romuo.ch;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name romuo.ch www.romuo.ch;

    # Admin web interface
    location /admin {
        proxy_pass http://127.0.0.1:8001/admin;
        proxy_set_header Host $host;
    }

    # API routes
    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_set_header Host $host;
    }

    # Documentation auto-générée (optionnel)
    location /docs {
        proxy_pass http://127.0.0.1:8001/docs;
    }
}
```

**Activer le site :**
```bash
sudo ln -s /etc/nginx/sites-available/romuo.ch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 ÉTAPE 6 : Installation des certificats SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir les certificats SSL
sudo certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch

# Renouvellement automatique (optionnel, déjà configuré par défaut)
sudo certbot renew --dry-run
```

---

## 🗄️ ÉTAPE 7 : Sécurisation de MongoDB

```bash
# Connexion à MongoDB
mongosh

# Créer un utilisateur admin
use admin
db.createUser({
  user: "romuoadmin",
  pwd: "VotreMotDePasseMongoDB2025!",
  roles: [{ role: "root", db: "admin" }]
})

# Créer la base de données production
use romuo_production
exit

# Activer l'authentification MongoDB
sudo nano /etc/mongod.conf
```

**Ajouter ces lignes :**
```yaml
security:
  authorization: enabled
```

**Redémarrer MongoDB :**
```bash
sudo systemctl restart mongod
```

**Mettre à jour le `.env` du backend :**
```bash
nano /var/www/romuo-ch/backend/.env
```

**Changer la ligne MONGO_URL :**
```bash
MONGO_URL=mongodb://romuoadmin:VotreMotDePasseMongoDB2025!@localhost:27017/romuo_production?authSource=admin
```

**Redémarrer le backend :**
```bash
sudo systemctl restart romuo-backend
```

---

## 🧪 ÉTAPE 8 : Tests de validation

```bash
# Test 1 : Backend est accessible
curl http://localhost:8001/api/vehicles

# Test 2 : API externe fonctionne
curl https://api.romuo.ch/api/vehicles

# Test 3 : Admin dashboard
curl https://romuo.ch/admin

# Test 4 : Logs du backend
sudo journalctl -u romuo-backend -f
```

---

## 📱 ÉTAPE 9 : Configuration DNS (Hostinger)

Sur votre panneau Hostinger :

1. **Ajouter des enregistrements A** :
   - `romuo.ch` → Votre IP VPS (ex: 123.45.67.89)
   - `www.romuo.ch` → Votre IP VPS
   - `api.romuo.ch` → Votre IP VPS

2. **Attendre 5-30 minutes** pour la propagation DNS

3. **Vérifier** :
   ```bash
   nslookup romuo.ch
   nslookup api.romuo.ch
   ```

---

## 🔑 ÉTAPE 10 : Ajouter votre clé Google Maps

```bash
nano /var/www/romuo-ch/backend/.env
```

**Ajouter (si pas déjà fait) :**
```bash
GOOGLE_MAPS_API_KEY=VotreCleGoogleMapsIci
```

**Redémarrer :**
```bash
sudo systemctl restart romuo-backend
```

---

## 📊 ÉTAPE 11 : Accès au Dashboard Admin

1. **URL** : https://romuo.ch/admin
2. **Mot de passe** : Celui défini dans `ADMIN_PASSWORD`
3. **Fonctionnalités** :
   - Voir tous les utilisateurs
   - Voir toutes les courses
   - Assigner manuellement des chauffeurs
   - Statistiques en temps réel

---

## 🔄 ÉTAPE 12 : Mises à jour futures

```bash
# Pull des changements depuis GitHub
cd /var/www/romuo-ch
git pull origin main

# Mettre à jour les dépendances si nécessaire
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Redémarrer le service
sudo systemctl restart romuo-backend
```

---

## 📱 ÉTAPE 13 : Build de l'application mobile (Expo)

**Sur votre machine locale** (pas sur le VPS) :

```bash
# Cloner le projet
git clone https://github.com/votre-username/romuo-ch.git
cd romuo-ch/frontend

# Installer les dépendances
npm install -g yarn eas-cli
yarn install

# Configurer les variables d'environnement
nano .env
```

**Contenu :**
```bash
EXPO_PUBLIC_BACKEND_URL=https://api.romuo.ch
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=VotreCleGoogleMaps
```

```bash
# Build pour Android
eas build --platform android

# Build pour iOS (nécessite un compte Apple Developer)
eas build --platform ios

# Les fichiers .apk et .ipa seront générés
```

---

## 🛡️ Checklist de Sécurité

- [ ] Firewall configuré (UFW) : `sudo ufw allow 80,443,22/tcp`
- [ ] MongoDB avec authentification activée
- [ ] Mot de passe admin changé (différent de l'exemple)
- [ ] Certificats SSL installés (HTTPS)
- [ ] Sauvegardes automatiques MongoDB : `mongodump --db romuo_production`
- [ ] Fail2Ban installé : `sudo apt install fail2ban`
- [ ] Clés SSH configurées (désactiver login par mot de passe)

---

## 📞 Commandes de Maintenance

```bash
# Voir les logs du backend
sudo journalctl -u romuo-backend -f

# Redémarrer le backend
sudo systemctl restart romuo-backend

# Redémarrer MongoDB
sudo systemctl restart mongod

# Redémarrer Nginx
sudo systemctl restart nginx

# Backup manuel de la base de données
mongodump --uri="mongodb://romuoadmin:VotrePass@localhost:27017/romuo_production?authSource=admin" --out=/backup/$(date +%Y%m%d)

# Restaurer un backup
mongorestore --uri="mongodb://romuoadmin:VotrePass@localhost:27017/romuo_production?authSource=admin" /backup/20250118/romuo_production
```

---

## ✅ SUCCÈS !

Votre plateforme Romuo.ch est maintenant en production sur votre VPS Hostinger !

**URLs :**
- API Backend : https://api.romuo.ch/docs (documentation auto-générée)
- Admin Dashboard : https://romuo.ch/admin
- App Mobile : À déployer sur Google Play / App Store

**Support** : Consultez `/docs` dans le projet pour la documentation complète.
