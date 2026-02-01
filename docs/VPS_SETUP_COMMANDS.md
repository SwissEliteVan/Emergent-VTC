# Configuration VPS Hostinger - Guide DevOps Complet

## Pre-requis
- VPS Hostinger Ubuntu 22.04
- Acces SSH root
- Domaine pointe vers l'IP du VPS

---

## 1. Mise a jour du systeme et dependances de base

### 1.1 Se connecter au VPS
```bash
ssh root@VOTRE_IP_VPS
```

### 1.2 Mettre a jour le systeme
```bash
# Mettre a jour la liste des paquets disponibles
apt update

# Mettre a niveau tous les paquets installes vers leurs dernieres versions
apt upgrade -y

# Supprimer les paquets obsoletes et nettoyer le cache
apt autoremove -y && apt autoclean
```

**Pourquoi:** Les mises a jour corrigent les failles de securite connues (CVE) et ameliorent la stabilite. Un systeme non mis a jour est vulnerable aux attaques.

### 1.3 Installer les dependances de base
```bash
# Outils essentiels pour le developpement et l'administration
apt install -y curl wget git unzip htop nano software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential
```

| Paquet | Utilite |
|--------|---------|
| `curl/wget` | Telecharger des fichiers et scripts |
| `git` | Cloner le code source depuis GitHub |
| `htop` | Monitorer les ressources en temps reel |
| `build-essential` | Compiler les modules natifs Node.js |
| `ca-certificates` | Certificats SSL pour connexions HTTPS |

### 1.4 Configurer le timezone Suisse
```bash
# Definir le fuseau horaire Europe/Zurich
timedatectl set-timezone Europe/Zurich

# Verifier
timedatectl
```

**Pourquoi:** Les logs et timestamps seront en heure suisse, facilitant le debugging et la conformite.

---

## 2. Installation de Node.js 20.x LTS

### 2.1 Ajouter le repository NodeSource
```bash
# Telecharger et executer le script d'installation du repo Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

**Pourquoi:** Le repo Ubuntu par defaut contient une version ancienne de Node.js. NodeSource fournit les versions LTS officielles.

### 2.2 Installer Node.js et npm
```bash
# Installer Node.js (npm est inclus)
apt install -y nodejs

# Verifier les versions installees
node -v    # Doit afficher v20.x.x
npm -v     # Doit afficher 10.x.x
```

### 2.3 Configurer npm pour l'utilisateur (optionnel mais recommande)
```bash
# Creer un dossier pour les packages globaux npm (evite sudo npm)
mkdir -p /usr/local/lib/npm-global
npm config set prefix '/usr/local/lib/npm-global'

# Ajouter au PATH
echo 'export PATH=/usr/local/lib/npm-global/bin:$PATH' >> /etc/profile.d/npm-global.sh
source /etc/profile.d/npm-global.sh
```

**Pourquoi:** Evite d'utiliser `sudo npm install -g` qui pose des problemes de permissions et de securite.

---

## 3. Installation et configuration de Nginx

### 3.1 Installer Nginx
```bash
# Installer le serveur web Nginx
apt install -y nginx

# Demarrer et activer au boot
systemctl start nginx
systemctl enable nginx

# Verifier le statut
systemctl status nginx
```

**Pourquoi:** Nginx sert de reverse proxy, gere SSL/TLS, la compression, le cache statique et protege Node.js des attaques directes.

### 3.2 Creer la configuration du site
```bash
# Creer le fichier de configuration pour romuo.ch
nano /etc/nginx/sites-available/romuo.ch
```

Coller cette configuration:
```nginx
# /etc/nginx/sites-available/romuo.ch
# Configuration Nginx pour Romuo VTC - Optimisee Suisse

# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name romuo.ch www.romuo.ch;

    # Redirection permanente vers HTTPS
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS principale
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name romuo.ch www.romuo.ch;

    # === SSL/TLS Configuration ===
    # Les certificats seront ajoutes par Certbot
    # ssl_certificate /etc/letsencrypt/live/romuo.ch/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/romuo.ch/privkey.pem;

    # Protocoles SSL securises (TLS 1.2 et 1.3 uniquement)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Session SSL
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # OCSP Stapling (performance SSL)
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # === Racine du site ===
    root /var/www/romuo.ch/dist;
    index index.html;

    # === Headers de Securite ===
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;

    # === Compression GZIP ===
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml
        font/woff
        font/woff2;

    # === Cache des assets statiques ===
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # === SPA Routing ===
    location / {
        try_files $uri $uri/ /index.html;
    }

    # === Proxy vers l'API Node.js ===
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
    }

    # === Bloquer les fichiers sensibles ===
    location ~ /\.(env|git|htaccess|htpasswd) {
        deny all;
        return 404;
    }

    # === Logs ===
    access_log /var/log/nginx/romuo.ch.access.log;
    error_log /var/log/nginx/romuo.ch.error.log warn;
}
```

### 3.3 Activer le site
```bash
# Creer le dossier pour le site
mkdir -p /var/www/romuo.ch/dist

# Creer un lien symbolique pour activer le site
ln -s /etc/nginx/sites-available/romuo.ch /etc/nginx/sites-enabled/

# Supprimer le site par defaut (optionnel)
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
nginx -t

# Si OK, recharger Nginx
systemctl reload nginx
```

**Pourquoi:**
- **Reverse proxy:** Nginx gere les connexions entrantes et les transmet a Node.js sur localhost (plus securise)
- **SSL termination:** Nginx gere le chiffrement, allege Node.js
- **Cache statique:** Assets servis directement par Nginx (ultra rapide)
- **Compression:** Reduit la bande passante de 70%

---

## 4. Installation de PM2

### 4.1 Installer PM2 globalement
```bash
# Installer PM2 - Process Manager pour Node.js
npm install -g pm2

# Verifier l'installation
pm2 -v
```

**Pourquoi:** PM2 maintient l'application en vie 24/7, la redemarre automatiquement en cas de crash, et gere les logs.

### 4.2 Configurer PM2 pour demarrer au boot
```bash
# Generer le script de demarrage automatique
pm2 startup systemd

# Cela affiche une commande a executer, par exemple:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
# Executez cette commande!
```

### 4.3 Creer le fichier de configuration PM2
```bash
# Creer le fichier ecosystem.config.js
nano /var/www/romuo.ch/ecosystem.config.js
```

Coller cette configuration:
```javascript
// /var/www/romuo.ch/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'romuo-api',
    script: './server.js',
    cwd: '/var/www/romuo.ch/backend',
    instances: 'max',           // Utilise tous les CPU disponibles
    exec_mode: 'cluster',       // Mode cluster pour haute disponibilite
    watch: false,               // Pas de watch en production
    max_memory_restart: '500M', // Redemarre si depasse 500MB RAM

    // Variables d'environnement
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      TZ: 'Europe/Zurich'
    },

    // Logs
    log_date_format: 'DD-MM-YYYY HH:mm:ss Z',
    error_file: '/var/log/pm2/romuo-error.log',
    out_file: '/var/log/pm2/romuo-out.log',
    merge_logs: true,

    // Restart policy
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 4.4 Commandes PM2 essentielles
```bash
# Demarrer l'application avec la config
pm2 start ecosystem.config.js

# Voir le statut des applications
pm2 status

# Voir les logs en temps reel
pm2 logs romuo-api

# Monitorer les ressources
pm2 monit

# Sauvegarder la liste des processus (pour redemarrage auto)
pm2 save

# Redemarrer une application
pm2 restart romuo-api

# Arreter une application
pm2 stop romuo-api

# Supprimer une application de PM2
pm2 delete romuo-api

# Recharger sans downtime (zero-downtime reload)
pm2 reload romuo-api
```

**Avantages PM2:**
| Fonctionnalite | Benefice |
|----------------|----------|
| Cluster mode | Utilise tous les coeurs CPU |
| Auto-restart | Redemarre apres crash |
| Log management | Rotation automatique des logs |
| Monitoring | Metriques CPU/RAM en temps reel |
| Zero-downtime | Reload sans interruption de service |

---

## 5. Configuration du pare-feu UFW

### 5.1 Installer et configurer UFW
```bash
# UFW est generalement pre-installe sur Ubuntu, sinon:
apt install -y ufw

# Politique par defaut: bloquer tout le trafic entrant
ufw default deny incoming

# Politique par defaut: autoriser tout le trafic sortant
ufw default allow outgoing
```

**Pourquoi:** Par defaut, on bloque tout et on autorise uniquement les ports necessaires (principe du moindre privilege).

### 5.2 Ouvrir les ports necessaires
```bash
# SSH (port 22) - CRITIQUE: a faire AVANT d'activer UFW!
ufw allow ssh
# Equivalent a: ufw allow 22/tcp

# HTTP (port 80) - Pour Let's Encrypt et redirection
ufw allow http
# Equivalent a: ufw allow 80/tcp

# HTTPS (port 443) - Trafic web securise
ufw allow https
# Equivalent a: ufw allow 443/tcp
```

### 5.3 Securite supplementaire SSH
```bash
# Limiter les tentatives de connexion SSH (anti brute-force)
# Bloque une IP apres 6 tentatives en 30 secondes
ufw limit ssh
```

### 5.4 Activer le pare-feu
```bash
# ATTENTION: Assurez-vous que SSH est autorise avant!
ufw enable

# Confirmer avec 'y'

# Verifier le statut et les regles
ufw status verbose
```

Resultat attendu:
```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22/tcp                     LIMIT       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
22/tcp (v6)                LIMIT       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)
```

### 5.5 Commandes UFW utiles
```bash
# Voir le statut
ufw status

# Voir les regles numerotees
ufw status numbered

# Supprimer une regle par numero
ufw delete 3

# Desactiver temporairement (debug)
ufw disable

# Reinitialiser toutes les regles
ufw reset
```

**Ports bloques (securite):**
- Port 3000 (Node.js) - Accessible uniquement via Nginx
- Port 27017 (MongoDB) - Jamais expose a Internet
- Tous les autres ports - Bloques par defaut

---

## 6. Creation d'un utilisateur dedie

### 6.1 Creer l'utilisateur
```bash
# Creer un utilisateur 'romuo' avec son dossier home
adduser --system --group --home /var/www/romuo.ch --shell /bin/bash romuo

# Alternative si vous voulez un utilisateur interactif:
adduser romuo
# Suivez les instructions pour le mot de passe
```

**Pourquoi:** Ne jamais executer une application en root. Si l'app est compromise, l'attaquant a acces root a tout le serveur.

### 6.2 Configurer les permissions
```bash
# Donner la propriete des fichiers a l'utilisateur romuo
chown -R romuo:romuo /var/www/romuo.ch

# Permissions appropriees
chmod -R 755 /var/www/romuo.ch

# Ajouter www-data au groupe romuo (pour que Nginx puisse lire)
usermod -aG romuo www-data
```

### 6.3 Configurer PM2 pour l'utilisateur romuo
```bash
# Se connecter en tant que romuo
su - romuo

# Configurer PM2 pour cet utilisateur
pm2 startup systemd

# IMPORTANT: Executez la commande affichee en tant que root!
# Sortir pour revenir a root
exit

# Executer la commande PM2 startup (exemple):
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u romuo --hp /var/www/romuo.ch
```

### 6.4 Permettre a l'utilisateur de recharger Nginx (optionnel)
```bash
# Editer sudoers pour permettre reload nginx sans mot de passe
visudo

# Ajouter cette ligne a la fin:
romuo ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx
```

### 6.5 Securiser SSH pour l'utilisateur
```bash
# Creer le dossier .ssh pour romuo
mkdir -p /var/www/romuo.ch/.ssh
chmod 700 /var/www/romuo.ch/.ssh

# Copier votre cle publique (depuis votre machine locale)
# Sur votre machine locale:
# cat ~/.ssh/id_rsa.pub | ssh root@VOTRE_IP "cat >> /var/www/romuo.ch/.ssh/authorized_keys"

# Corriger les permissions
chmod 600 /var/www/romuo.ch/.ssh/authorized_keys
chown -R romuo:romuo /var/www/romuo.ch/.ssh
```

### 6.6 Desactiver le login root SSH (recommande)
```bash
# Editer la configuration SSH
nano /etc/ssh/sshd_config

# Modifier ces lignes:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Redemarrer SSH
systemctl restart sshd
```

**ATTENTION:** Testez d'abord que vous pouvez vous connecter avec l'utilisateur romuo avant de desactiver root!

---

## 7. Installation du certificat SSL (Let's Encrypt)

### 7.1 Installer Certbot
```bash
# Installer Certbot avec le plugin Nginx
apt install -y certbot python3-certbot-nginx
```

### 7.2 Obtenir le certificat
```bash
# Obtenir et installer le certificat SSL automatiquement
certbot --nginx -d romuo.ch -d www.romuo.ch

# Suivez les instructions:
# - Entrez votre email
# - Acceptez les conditions
# - Choisissez de rediriger HTTP vers HTTPS (recommande)
```

### 7.3 Configurer le renouvellement automatique
```bash
# Tester le renouvellement (dry run)
certbot renew --dry-run

# Le renouvellement automatique est configure via systemd timer
systemctl status certbot.timer
```

**Pourquoi:** Let's Encrypt fournit des certificats SSL gratuits. Le renouvellement automatique evite les expirations.

---

## 8. Resume des commandes (script complet)

Voici un script qui execute toutes les etapes:

```bash
#!/bin/bash
# VPS Setup Script pour Romuo VTC
# Usage: curl -sSL URL_DU_SCRIPT | bash

set -e

echo "=== Configuration VPS Hostinger pour Romuo.ch ==="
echo ""

# Variables
DOMAIN="romuo.ch"
APP_USER="romuo"
APP_DIR="/var/www/${DOMAIN}"

# 1. Mise a jour systeme
echo "[1/7] Mise a jour du systeme..."
apt update && apt upgrade -y
apt install -y curl wget git unzip htop nano software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release build-essential

# 2. Timezone Suisse
echo "[2/7] Configuration timezone..."
timedatectl set-timezone Europe/Zurich

# 3. Node.js 20
echo "[3/7] Installation Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Nginx
echo "[4/7] Installation Nginx..."
apt install -y nginx
systemctl enable nginx

# 5. PM2
echo "[5/7] Installation PM2..."
npm install -g pm2

# 6. UFW
echo "[6/7] Configuration pare-feu..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw limit ssh
echo "y" | ufw enable

# 7. Utilisateur dedie
echo "[7/7] Creation utilisateur ${APP_USER}..."
adduser --system --group --home ${APP_DIR} --shell /bin/bash ${APP_USER}
mkdir -p ${APP_DIR}/dist ${APP_DIR}/backend
chown -R ${APP_USER}:${APP_USER} ${APP_DIR}
usermod -aG ${APP_USER} www-data

# Resume
echo ""
echo "=== CONFIGURATION TERMINEE ==="
echo ""
echo "Versions installees:"
echo "  - Node.js: $(node -v)"
echo "  - npm: $(npm -v)"
echo "  - PM2: $(pm2 -v)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo ""
echo "Prochaines etapes:"
echo "  1. Configurer Nginx: /etc/nginx/sites-available/${DOMAIN}"
echo "  2. Obtenir SSL: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "  3. Deployer l'application dans ${APP_DIR}"
echo "  4. Demarrer avec PM2: pm2 start ecosystem.config.js"
echo ""
```

---

## 9. Checklist de securite

- [x] Systeme mis a jour
- [x] Pare-feu UFW active (ports 22, 80, 443 uniquement)
- [x] Utilisateur dedie (pas root)
- [x] SSL/TLS actif (Let's Encrypt)
- [x] Headers de securite Nginx
- [x] SSH limite (anti brute-force)
- [ ] Desactiver login root SSH
- [ ] Configurer fail2ban (optionnel)
- [ ] Backups automatiques

---

## 10. Commandes de maintenance

```bash
# Voir l'utilisation disque
df -h

# Voir l'utilisation memoire
free -h

# Voir les processus
htop

# Logs Nginx
tail -f /var/log/nginx/romuo.ch.access.log
tail -f /var/log/nginx/romuo.ch.error.log

# Logs PM2
pm2 logs

# Redemarrer les services
systemctl restart nginx
pm2 restart all

# Mise a jour de securite
apt update && apt upgrade -y
```

---

*Guide cree pour Romuo VTC - Janvier 2026*
