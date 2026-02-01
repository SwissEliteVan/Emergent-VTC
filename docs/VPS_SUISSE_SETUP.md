# Configuration VPS Suisse - Guide Complet

> Guide DevOps pour héberger une application VTC en Suisse avec optimisations régionales

## Table des Matières

1. [Mise à jour système avec miroirs suisses](#1-mise-à-jour-système-avec-miroirs-suisses)
2. [Installation Node.js 22.x LTS](#2-installation-nodejs-22x-lts)
3. [Configuration Nginx optimisée](#3-configuration-nginx-optimisée)
4. [PM2 Haute Disponibilité](#4-pm2-haute-disponibilité)
5. [Pare-feu Swiss Standard](#5-pare-feu-swiss-standard)
6. [Optimisation réseau Europe Centrale](#6-optimisation-réseau-europe-centrale)
7. [Fuseau horaire et locale](#7-fuseau-horaire-et-locale)
8. [Certificats SSL Swiss Trust](#8-certificats-ssl-swiss-trust)
9. [Double facturation CHF/EUR](#9-double-facturation-chfeur)
10. [Backup automatique Suisse](#10-backup-automatique-suisse)
11. [Monitoring et conformité](#11-monitoring-et-conformité)
12. [Variables d'environnement régionales](#12-variables-denvironnement-régionales)

---

## 1. Mise à jour système avec miroirs suisses

```bash
# ============================================
# ÉTAPE 1: Configuration des miroirs SWITCH
# SWITCH est le réseau académique suisse
# Miroirs ultra-rapides depuis la Suisse
# ============================================

# Sauvegarder la configuration actuelle
sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup

# Détecter la version Ubuntu
UBUNTU_CODENAME=$(lsb_release -cs)
echo "Version Ubuntu détectée: $UBUNTU_CODENAME"

# Configurer les miroirs SWITCH (Suisse)
sudo tee /etc/apt/sources.list << EOF
# Miroirs SWITCH Suisse - Optimisés pour la Suisse
deb http://mirror.switch.ch/ftp/mirror/ubuntu/ ${UBUNTU_CODENAME} main restricted universe multiverse
deb http://mirror.switch.ch/ftp/mirror/ubuntu/ ${UBUNTU_CODENAME}-updates main restricted universe multiverse
deb http://mirror.switch.ch/ftp/mirror/ubuntu/ ${UBUNTU_CODENAME}-backports main restricted universe multiverse
deb http://mirror.switch.ch/ftp/mirror/ubuntu/ ${UBUNTU_CODENAME}-security main restricted universe multiverse

# Miroir secondaire - ETHZ (Zurich)
deb http://ubuntu.ethz.ch/ubuntu/ ${UBUNTU_CODENAME} main restricted universe multiverse
deb http://ubuntu.ethz.ch/ubuntu/ ${UBUNTU_CODENAME}-updates main restricted universe multiverse
EOF

# Mise à jour complète du système
sudo apt update && sudo apt upgrade -y && sudo apt dist-upgrade -y

# Installation des outils de base
sudo apt install -y \
    curl \
    wget \
    git \
    htop \
    iotop \
    iftop \
    net-tools \
    dnsutils \
    unzip \
    zip \
    jq \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Nettoyage
sudo apt autoremove -y && sudo apt autoclean
```

---

## 2. Installation Node.js 22.x LTS

```bash
# ============================================
# ÉTAPE 2: Node.js 22.x LTS
# Version LTS la plus récente pour production
# ============================================

# Supprimer anciennes versions
sudo apt remove -y nodejs npm 2>/dev/null
sudo rm -rf /usr/local/lib/node_modules
sudo rm -rf /usr/local/bin/node
sudo rm -rf /usr/local/bin/npm

# Installer Node.js 22.x via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # Devrait afficher v22.x.x
npm --version

# Configurer npm pour la Suisse
npm config set registry https://registry.npmjs.org/
npm config set prefer-offline true
npm config set fund false
npm config set audit-level high

# Installer les outils globaux essentiels
sudo npm install -g pm2@latest
sudo npm install -g npm@latest

# Créer le répertoire pour les applications
sudo mkdir -p /var/www/vtc-suisse
sudo chown -R $USER:$USER /var/www/vtc-suisse

# Configurer les permissions npm globales (éviter sudo)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

---

## 3. Configuration Nginx optimisée

```bash
# ============================================
# ÉTAPE 3: Nginx avec optimisation latence
# Configuration pour Europe Centrale
# ============================================

# Installer Nginx
sudo apt install -y nginx

# Sauvegarder config par défaut
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Configuration Nginx optimisée Suisse
sudo tee /etc/nginx/nginx.conf << 'EOF'
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    # ========================================
    # Optimisations de base
    # ========================================
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    types_hash_max_size 2048;
    server_tokens off;

    # ========================================
    # Optimisation latence Europe Centrale
    # ========================================
    keepalive_timeout 30;
    keepalive_requests 1000;
    reset_timedout_connection on;
    client_body_timeout 10;
    send_timeout 10;

    # ========================================
    # Buffers optimisés
    # ========================================
    client_body_buffer_size 16k;
    client_header_buffer_size 1k;
    client_max_body_size 16m;
    large_client_header_buffers 4 8k;

    # ========================================
    # Compression GZIP
    # ========================================
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # ========================================
    # Cache et performances
    # ========================================
    open_file_cache max=10000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # ========================================
    # Sécurité Headers
    # ========================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ========================================
    # Logs
    # ========================================
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log warn;

    # ========================================
    # Rate Limiting (protection DDoS)
    # ========================================
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # ========================================
    # Upstream Node.js (PM2 cluster)
    # ========================================
    upstream nodejs_backend {
        least_conn;
        server 127.0.0.1:3000 weight=5;
        server 127.0.0.1:3001 weight=5;
        server 127.0.0.1:3002 backup;
        keepalive 32;
    }

    # ========================================
    # Inclure les sites
    # ========================================
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

# Configuration du site VTC Suisse
sudo tee /etc/nginx/sites-available/vtc-suisse << 'EOF'
# ========================================
# VTC Suisse - Configuration Nginx
# ========================================

# Redirection HTTP vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name votredomaine.ch www.votredomaine.ch;

    # ACME challenge pour Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Serveur HTTPS principal
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name votredomaine.ch www.votredomaine.ch;

    # ========================================
    # SSL Configuration
    # ========================================
    ssl_certificate /etc/letsencrypt/live/votredomaine.ch/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votredomaine.ch/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/votredomaine.ch/chain.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Protocoles modernes
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS (15768000 secondes = 6 mois)
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # ========================================
    # Racine du site
    # ========================================
    root /var/www/vtc-suisse/public;
    index index.html;

    # ========================================
    # Logs par site
    # ========================================
    access_log /var/log/nginx/vtc-suisse-access.log;
    error_log /var/log/nginx/vtc-suisse-error.log;

    # ========================================
    # Headers de sécurité Suisse
    # ========================================
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(self), microphone=(), camera=()" always;

    # CSP pour conformité suisse
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https://*.tile.openstreetmap.org https://*.openstreetmap.org; connect-src 'self' https://nominatim.openstreetmap.org https://photon.komoot.io https://api.openrouteservice.org https://router.project-osrm.org; font-src 'self' https://cdnjs.cloudflare.com; frame-ancestors 'self';" always;

    # ========================================
    # API Backend (Node.js)
    # ========================================
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_conn conn_limit 10;

        proxy_pass http://nodejs_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts optimisés
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;

        # Buffers
        proxy_buffer_size 4k;
        proxy_buffers 8 16k;
        proxy_busy_buffers_size 24k;
    }

    # ========================================
    # Fichiers statiques avec cache
    # ========================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # ========================================
    # SPA Routing (Vue/React/Angular)
    # ========================================
    location / {
        limit_req zone=general burst=50 nodelay;
        try_files $uri $uri/ /index.html;
    }

    # ========================================
    # Health check endpoint
    # ========================================
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # ========================================
    # Bloquer fichiers sensibles
    # ========================================
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|git|gitignore|dockerignore)$ {
        deny all;
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/vtc-suisse /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Créer les répertoires nécessaires
sudo mkdir -p /var/www/vtc-suisse/public
sudo mkdir -p /var/www/certbot

# Tester et recharger Nginx
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## 4. PM2 Haute Disponibilité

```bash
# ============================================
# ÉTAPE 4: PM2 Cluster Mode
# Haute disponibilité avec auto-restart
# ============================================

# Créer le fichier de configuration PM2
sudo tee /var/www/vtc-suisse/ecosystem.config.cjs << 'EOF'
// PM2 Configuration - VTC Suisse
// Haute disponibilité avec cluster mode

module.exports = {
  apps: [
    {
      // ========================================
      // Application principale
      // ========================================
      name: 'vtc-suisse-api',
      script: './src/server.js',
      cwd: '/var/www/vtc-suisse',

      // Mode cluster pour haute disponibilité
      instances: 'max', // Utilise tous les CPUs
      exec_mode: 'cluster',

      // Ports (load balanced par PM2)
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // ========================================
      // Haute disponibilité
      // ========================================
      // Redémarrage automatique
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // Redémarrage gracieux
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Délai entre redémarrages
      restart_delay: 1000,

      // Limite de redémarrages
      max_restarts: 15,
      min_uptime: '10s',

      // ========================================
      // Logs
      // ========================================
      log_file: '/var/log/pm2/vtc-suisse-combined.log',
      out_file: '/var/log/pm2/vtc-suisse-out.log',
      error_file: '/var/log/pm2/vtc-suisse-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ========================================
      // Variables d'environnement Production
      // ========================================
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,

        // Suisse
        TZ: 'Europe/Zurich',
        LOCALE: 'fr-CH',
        COUNTRY: 'CH',
        CURRENCY: 'CHF',
        CURRENCY_SECONDARY: 'EUR',

        // APIs
        OPENROUTESERVICE_API_KEY: 'your-api-key',

        // Sécurité
        RATE_LIMIT_WINDOW: '60000',
        RATE_LIMIT_MAX: '100',

        // Régions suisses
        SWISS_REGIONS: 'GE,VD,VS,NE,FR,BE,ZH,BS,TI,LU,SG,AG,TG,GR,SO,BL,SZ,ZG,SH,AR,AI,GL,NW,OW,UR,JU',
      },
    },

    {
      // ========================================
      // Worker de backup (optionnel)
      // ========================================
      name: 'vtc-suisse-worker',
      script: './src/worker.js',
      cwd: '/var/www/vtc-suisse',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      cron_restart: '0 3 * * *', // Restart quotidien à 3h

      env_production: {
        NODE_ENV: 'production',
        TZ: 'Europe/Zurich',
      },
    },
  ],

  // ========================================
  // Déploiement automatique
  // ========================================
  deploy: {
    production: {
      user: 'deploy',
      host: ['votreserveur.ch'],
      ref: 'origin/main',
      repo: 'git@github.com:votre-repo/vtc-suisse.git',
      path: '/var/www/vtc-suisse',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
  },
};
EOF

# Créer le répertoire des logs PM2
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Configuration PM2 startup (démarrage automatique)
pm2 startup systemd -u $USER --hp /home/$USER
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

# Commandes PM2 utiles
echo "
# ========================================
# Commandes PM2 utiles
# ========================================
# Démarrer l'application
pm2 start ecosystem.config.cjs --env production

# Voir le statut
pm2 status

# Voir les logs
pm2 logs vtc-suisse-api

# Monitoring temps réel
pm2 monit

# Redémarrage gracieux (zero-downtime)
pm2 reload vtc-suisse-api

# Sauvegarder la configuration
pm2 save

# Scaling manuel
pm2 scale vtc-suisse-api +2  # Ajouter 2 instances
pm2 scale vtc-suisse-api 4   # Fixer à 4 instances
"

# Configuration logrotate pour PM2
sudo tee /etc/logrotate.d/pm2 << 'EOF'
/var/log/pm2/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

---

## 5. Pare-feu Swiss Standard

```bash
# ============================================
# ÉTAPE 5: UFW Firewall
# Configuration sécurisée pour la Suisse
# ============================================

# Installer UFW si nécessaire
sudo apt install -y ufw

# Réinitialiser les règles
sudo ufw --force reset

# Politique par défaut
sudo ufw default deny incoming
sudo ufw default allow outgoing

# ========================================
# Ports standards
# ========================================
# SSH (avec rate limiting)
sudo ufw limit 22/tcp comment 'SSH avec rate limiting'

# HTTP/HTTPS
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# ========================================
# Ports applicatifs (localhost uniquement)
# ========================================
# Node.js (accès local seulement via Nginx)
sudo ufw allow from 127.0.0.1 to any port 3000:3010 proto tcp comment 'Node.js cluster local'

# ========================================
# Ports optionnels Suisse
# ========================================
# DNS (si serveur DNS local)
# sudo ufw allow 53/tcp comment 'DNS TCP'
# sudo ufw allow 53/udp comment 'DNS UDP'

# NTP (synchronisation horaire - important pour transactions)
sudo ufw allow out 123/udp comment 'NTP sortant'

# ========================================
# Règles spécifiques datacenters suisses
# ========================================
# Infomaniak (Genève) - backup
# sudo ufw allow from 83.166.0.0/16 to any comment 'Infomaniak GE'

# SWITCH (réseau académique)
# sudo ufw allow from 130.59.0.0/16 to any comment 'SWITCH network'

# ========================================
# Protection contre les attaques
# ========================================
# Bloquer les réseaux malveillants connus
sudo ufw deny from 10.0.0.0/8 comment 'Block private network'
sudo ufw deny from 172.16.0.0/12 comment 'Block private network'
sudo ufw deny from 192.168.0.0/16 comment 'Block private network'

# Note: Décommenter si votre serveur n'est pas dans un réseau privé

# Activer le pare-feu
sudo ufw --force enable

# Afficher le statut
sudo ufw status verbose

# ========================================
# Configuration fail2ban (protection SSH)
# ========================================
sudo apt install -y fail2ban

sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 120
bantime = 600

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
```

---

## 6. Optimisation réseau Europe Centrale

```bash
# ============================================
# ÉTAPE 6: Optimisation TCP/IP
# Configuration pour latence réduite en Europe
# ============================================

# Sauvegarder la configuration actuelle
sudo cp /etc/sysctl.conf /etc/sysctl.conf.backup

# Optimisations réseau
sudo tee -a /etc/sysctl.conf << 'EOF'

# ========================================
# Optimisations VTC Suisse
# Europe Centrale - Latence réduite
# ========================================

# TCP/IP Stack Optimization
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.rmem_default = 1048576
net.core.wmem_default = 1048576
net.core.optmem_max = 65536
net.core.netdev_max_backlog = 50000

# TCP Memory
net.ipv4.tcp_rmem = 4096 1048576 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_mem = 65536 131072 262144

# TCP Optimization pour Europe Centrale
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15

# Congestion Control (BBR pour meilleure performance)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Connection tracking
net.ipv4.tcp_max_syn_backlog = 30000
net.ipv4.tcp_max_tw_buckets = 2000000
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 2

# File descriptors
fs.file-max = 2097152
fs.nr_open = 2097152

# Sécurité réseau
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# IPv6 (garder activé pour modernité)
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
EOF

# Appliquer les changements
sudo sysctl -p

# Configurer les limites système
sudo tee /etc/security/limits.d/99-vtc-suisse.conf << 'EOF'
# Limites pour application VTC Suisse
* soft nofile 1048576
* hard nofile 1048576
* soft nproc 65535
* hard nproc 65535
root soft nofile 1048576
root hard nofile 1048576
www-data soft nofile 65535
www-data hard nofile 65535
EOF

# Vérifier que BBR est actif
echo "Congestion control actif:"
sysctl net.ipv4.tcp_congestion_control
```

---

## 7. Fuseau horaire et locale

```bash
# ============================================
# ÉTAPE 7: Configuration Suisse
# Fuseau horaire et locale fr-CH
# ============================================

# Configurer le fuseau horaire
sudo timedatectl set-timezone Europe/Zurich

# Vérifier
timedatectl

# ========================================
# Installer et configurer les locales
# ========================================
sudo apt install -y locales

# Générer les locales suisses
sudo sed -i '/^#.*fr_CH.UTF-8/s/^#//' /etc/locale.gen
sudo sed -i '/^#.*de_CH.UTF-8/s/^#//' /etc/locale.gen
sudo sed -i '/^#.*it_CH.UTF-8/s/^#//' /etc/locale.gen
sudo sed -i '/^#.*en_US.UTF-8/s/^#//' /etc/locale.gen

sudo locale-gen

# Définir la locale par défaut
sudo update-locale LANG=fr_CH.UTF-8 LC_ALL=fr_CH.UTF-8

# Variables d'environnement locale
sudo tee /etc/default/locale << 'EOF'
LANG=fr_CH.UTF-8
LC_ALL=fr_CH.UTF-8
LC_CTYPE=fr_CH.UTF-8
LC_MESSAGES=fr_CH.UTF-8
LC_COLLATE=fr_CH.UTF-8
LC_MONETARY=fr_CH.UTF-8
LC_NUMERIC=fr_CH.UTF-8
LC_TIME=fr_CH.UTF-8
EOF

# ========================================
# Synchronisation NTP (précision horaire)
# Important pour transactions financières
# ========================================
sudo apt install -y chrony

# Configuration avec serveurs NTP suisses
sudo tee /etc/chrony/chrony.conf << 'EOF'
# Serveurs NTP suisses (METAS - Institut fédéral de métrologie)
server ntp.metas.ch iburst prefer
server time.ethz.ch iburst
server time.epfl.ch iburst

# Serveurs européens de backup
pool europe.pool.ntp.org iburst maxsources 4

# Paramètres
driftfile /var/lib/chrony/drift
makestep 1.0 3
rtcsync
keyfile /etc/chrony/chrony.keys
leapsectz right/UTC
logdir /var/log/chrony
EOF

sudo systemctl enable chrony
sudo systemctl restart chrony

# Vérifier la synchronisation
chronyc tracking
chronyc sources
```

---

## 8. Certificats SSL Swiss Trust

```bash
# ============================================
# ÉTAPE 8: SSL/TLS avec Let's Encrypt
# Configuration avec racines de confiance suisses
# ============================================

# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# ========================================
# Option A: Certificat Let's Encrypt (gratuit)
# ========================================
# Remplacer votredomaine.ch par votre domaine réel
DOMAIN="votredomaine.ch"
EMAIL="admin@votredomaine.ch"

# Obtenir le certificat
sudo certbot certonly --nginx \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

# Renouvellement automatique
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test de renouvellement
sudo certbot renew --dry-run

# ========================================
# Option B: Certificat Swiss Sign (payant)
# Pour clients enterprise nécessitant CA suisse
# ========================================
echo "
Pour SwissSign (CA suisse officielle):
1. Commander sur https://www.swisssign.com/
2. Générer la CSR:
   openssl req -new -newkey rsa:4096 -nodes \\
     -keyout /etc/ssl/private/$DOMAIN.key \\
     -out /etc/ssl/certs/$DOMAIN.csr \\
     -subj '/C=CH/ST=Geneve/L=Geneve/O=VotreEntreprise/CN=$DOMAIN'
3. Soumettre la CSR à SwissSign
4. Installer le certificat reçu
"

# ========================================
# Ajouter les racines de confiance suisses
# ========================================
sudo mkdir -p /usr/local/share/ca-certificates/swiss

# Télécharger les certificats racine suisses
cd /usr/local/share/ca-certificates/swiss

# SwissSign Root CA
sudo wget -q https://www.swisssign.com/fileadmin/download/SwissSign_Gold_CA_G2.crt
sudo wget -q https://www.swisssign.com/fileadmin/download/SwissSign_Silver_CA_G2.crt
sudo wget -q https://www.swisssign.com/fileadmin/download/SwissSign_Platinum_CA_G2.crt

# Mettre à jour le store de certificats
sudo update-ca-certificates

cd ~

# ========================================
# Configuration SSL forte
# ========================================
# Générer les paramètres DH (peut prendre quelques minutes)
sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048

# Ajouter à la config Nginx
sudo tee /etc/nginx/snippets/ssl-params.conf << 'EOF'
# Paramètres SSL renforcés
ssl_dhparam /etc/nginx/dhparam.pem;

# Configuration moderne
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Session
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:50m;
ssl_session_tickets off;
EOF

# Recharger Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. Double facturation CHF/EUR

```bash
# ============================================
# ÉTAPE 9: Module de facturation CHF/EUR
# Conversion automatique avec taux BCE
# ============================================

# Créer le module de facturation
sudo tee /var/www/vtc-suisse/src/billing.js << 'EOF'
/**
 * Module de facturation VTC Suisse
 * Support CHF/EUR avec conversion automatique
 * Conforme aux réglementations suisses (OTV)
 */

import axios from 'axios';

// ========================================
// Configuration
// ========================================
const CONFIG = {
  // Devise par défaut
  defaultCurrency: 'CHF',

  // Devises supportées
  currencies: {
    CHF: {
      code: 'CHF',
      symbol: 'CHF',
      name: 'Franc suisse',
      locale: 'fr-CH',
      decimals: 2,
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      locale: 'fr-FR',
      decimals: 2,
    },
  },

  // TVA Suisse (véhicules avec chauffeur)
  vatRate: 0.077, // 7.7%

  // API taux de change
  exchangeRateAPI: 'https://api.frankfurter.app/latest',

  // Cache taux de change (1 heure)
  exchangeRateCacheDuration: 3600000,
};

// Cache pour les taux de change
let exchangeRateCache = {
  rates: null,
  lastUpdate: null,
};

// ========================================
// Taux de change
// ========================================

/**
 * Récupérer les taux de change actuels
 */
async function getExchangeRates() {
  const now = Date.now();

  // Retourner le cache si valide
  if (
    exchangeRateCache.rates &&
    exchangeRateCache.lastUpdate &&
    now - exchangeRateCache.lastUpdate < CONFIG.exchangeRateCacheDuration
  ) {
    return exchangeRateCache.rates;
  }

  try {
    // API Frankfurter (gratuite, données BCE)
    const response = await axios.get(CONFIG.exchangeRateAPI, {
      params: {
        from: 'CHF',
        to: 'EUR',
      },
      timeout: 5000,
    });

    const rates = {
      CHF_EUR: response.data.rates.EUR,
      EUR_CHF: 1 / response.data.rates.EUR,
      lastUpdate: new Date().toISOString(),
      source: 'BCE (Banque Centrale Européenne)',
    };

    // Mettre en cache
    exchangeRateCache = {
      rates,
      lastUpdate: now,
    };

    console.log(`[Billing] Taux de change mis à jour: 1 CHF = ${rates.CHF_EUR.toFixed(4)} EUR`);

    return rates;
  } catch (error) {
    console.error('[Billing] Erreur récupération taux de change:', error.message);

    // Taux de secours (approximatif)
    return {
      CHF_EUR: 0.95,
      EUR_CHF: 1.05,
      lastUpdate: new Date().toISOString(),
      source: 'Taux de secours (approximatif)',
      fallback: true,
    };
  }
}

/**
 * Convertir un montant entre devises
 */
async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates();
  const rateKey = `${fromCurrency}_${toCurrency}`;

  if (!rates[rateKey]) {
    throw new Error(`Conversion ${fromCurrency} -> ${toCurrency} non supportée`);
  }

  return amount * rates[rateKey];
}

// ========================================
// Calcul de prix
// ========================================

/**
 * Calculer le prix d'une course
 */
function calculatePrice(params) {
  const {
    distanceKm,
    durationMin,
    vehicleType = 'berline',
    pickupTime = new Date(),
    currency = 'CHF',
  } = params;

  // Tarifs de base (en CHF)
  const tariffs = {
    eco: { base: 6, perKm: 2.20, perMin: 0.40 },
    berline: { base: 10, perKm: 2.80, perMin: 0.50 },
    van: { base: 15, perKm: 3.50, perMin: 0.60 },
    luxe: { base: 25, perKm: 4.50, perMin: 0.80 },
  };

  const tariff = tariffs[vehicleType] || tariffs.berline;

  // Calcul de base
  let baseFare = tariff.base;
  let distanceFare = distanceKm * tariff.perKm;
  let timeFare = durationMin * tariff.perMin;

  // Suppléments
  let nightSurcharge = 0;
  let weekendSurcharge = 0;
  let airportSurcharge = 0;

  // Supplément nuit (22h - 6h)
  const hour = pickupTime.getHours();
  if (hour >= 22 || hour < 6) {
    nightSurcharge = (baseFare + distanceFare + timeFare) * 0.20;
  }

  // Supplément week-end
  const day = pickupTime.getDay();
  if (day === 0 || day === 6) {
    weekendSurcharge = (baseFare + distanceFare + timeFare) * 0.10;
  }

  // Calcul HT
  const totalHT = baseFare + distanceFare + timeFare + nightSurcharge + weekendSurcharge + airportSurcharge;

  // TVA
  const vat = totalHT * CONFIG.vatRate;

  // Total TTC
  const totalTTC = totalHT + vat;

  return {
    currency,
    breakdown: {
      baseFare: round(baseFare, 2),
      distanceFare: round(distanceFare, 2),
      timeFare: round(timeFare, 2),
      nightSurcharge: round(nightSurcharge, 2),
      weekendSurcharge: round(weekendSurcharge, 2),
      airportSurcharge: round(airportSurcharge, 2),
    },
    subtotal: round(totalHT, 2),
    vatRate: CONFIG.vatRate,
    vatAmount: round(vat, 2),
    total: round(totalTTC, 2),
    formatted: formatCurrency(totalTTC, currency),
  };
}

// ========================================
// Génération de facture
// ========================================

/**
 * Générer une facture avec double devise
 */
async function generateInvoice(booking, options = {}) {
  const {
    primaryCurrency = 'CHF',
    showSecondary = true,
    secondaryCurrency = 'EUR',
  } = options;

  // Calculer le prix dans la devise principale
  const primaryPrice = calculatePrice({
    ...booking,
    currency: primaryCurrency,
  });

  // Calculer le prix dans la devise secondaire
  let secondaryPrice = null;
  if (showSecondary) {
    const convertedTotal = await convertCurrency(
      primaryPrice.total,
      primaryCurrency,
      secondaryCurrency
    );

    secondaryPrice = {
      currency: secondaryCurrency,
      total: round(convertedTotal, 2),
      formatted: formatCurrency(convertedTotal, secondaryCurrency),
    };
  }

  // Numéro de facture
  const invoiceNumber = generateInvoiceNumber();

  // Date de facture
  const invoiceDate = new Date();

  return {
    invoiceNumber,
    invoiceDate: invoiceDate.toISOString(),
    invoiceDateFormatted: formatDate(invoiceDate),

    // Client
    customer: {
      name: booking.customerName,
      email: booking.customerEmail,
      phone: booking.customerPhone,
    },

    // Course
    trip: {
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      pickupTime: booking.pickupTime,
      distanceKm: booking.distanceKm,
      durationMin: booking.durationMin,
      vehicleType: booking.vehicleType,
    },

    // Prix principal
    price: primaryPrice,

    // Prix secondaire (converti)
    priceSecondary: secondaryPrice,

    // Taux de change utilisé
    exchangeRate: secondaryPrice ? {
      from: primaryCurrency,
      to: secondaryCurrency,
      rate: round(secondaryPrice.total / primaryPrice.total, 4),
      source: (await getExchangeRates()).source,
    } : null,

    // Mentions légales Suisse
    legalMentions: {
      company: 'VTC Suisse Sàrl',
      address: 'Rue du Lac 1, 1201 Genève',
      ide: 'CHE-123.456.789',
      vatNumber: 'CHE-123.456.789 TVA',
      phone: '+41 22 123 45 67',
      email: 'contact@vtc-suisse.ch',
    },

    // Conditions
    terms: [
      'Paiement à réception de la facture',
      'TVA 7.7% incluse',
      'Tarifs conformes à l\'OTV (Ordonnance sur le transport de voyageurs)',
    ],
  };
}

// ========================================
// Utilitaires
// ========================================

function round(value, decimals) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function formatCurrency(amount, currency) {
  const config = CONFIG.currencies[currency];
  if (!config) return `${amount} ${currency}`;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('fr-CH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VTC-${year}${month}-${random}`;
}

// ========================================
// Exports
// ========================================
export {
  CONFIG,
  getExchangeRates,
  convertCurrency,
  calculatePrice,
  generateInvoice,
  formatCurrency,
  formatDate,
  generateInvoiceNumber,
};

export default {
  getExchangeRates,
  convertCurrency,
  calculatePrice,
  generateInvoice,
};
EOF

echo "Module de facturation CHF/EUR créé: /var/www/vtc-suisse/src/billing.js"
```

---

## 10. Backup automatique Suisse

```bash
# ============================================
# ÉTAPE 10: Backup automatique
# Stockage sur infrastructure suisse
# ============================================

# Créer le script de backup
sudo tee /usr/local/bin/vtc-backup.sh << 'EOF'
#!/bin/bash
# ========================================
# Script de backup VTC Suisse
# Stockage sur infrastructure suisse
# ========================================

set -e

# Configuration
BACKUP_DIR="/var/backups/vtc-suisse"
APP_DIR="/var/www/vtc-suisse"
LOG_FILE="/var/log/vtc-backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Créer les répertoires
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}

# Fonction de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "Début du backup - $DATE"
log "=========================================="

# ========================================
# 1. Backup de l'application
# ========================================
log "Backup de l'application..."
BACKUP_NAME="vtc-suisse_${DATE}.tar.gz"

tar -czf "$BACKUP_DIR/daily/$BACKUP_NAME" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="*.log" \
    -C "$(dirname $APP_DIR)" \
    "$(basename $APP_DIR)"

log "Application sauvegardée: $BACKUP_NAME"

# ========================================
# 2. Backup de la base de données (si SQLite)
# ========================================
if [ -f "$APP_DIR/data/vtc.db" ]; then
    log "Backup de la base de données SQLite..."
    cp "$APP_DIR/data/vtc.db" "$BACKUP_DIR/daily/vtc_db_${DATE}.db"

    # Compresser
    gzip -f "$BACKUP_DIR/daily/vtc_db_${DATE}.db"
    log "Base de données sauvegardée"
fi

# ========================================
# 3. Backup de la configuration Nginx
# ========================================
log "Backup de la configuration Nginx..."
tar -czf "$BACKUP_DIR/daily/nginx_config_${DATE}.tar.gz" \
    /etc/nginx/sites-available \
    /etc/nginx/nginx.conf

# ========================================
# 4. Backup des certificats SSL
# ========================================
if [ -d "/etc/letsencrypt" ]; then
    log "Backup des certificats SSL..."
    tar -czf "$BACKUP_DIR/daily/ssl_certs_${DATE}.tar.gz" \
        /etc/letsencrypt
fi

# ========================================
# 5. Rotation des backups
# ========================================
log "Rotation des backups..."

# Garder uniquement les 7 derniers jours de backups quotidiens
find "$BACKUP_DIR/daily" -type f -mtime +7 -delete

# Copier vers weekly le dimanche
if [ $(date +%u) -eq 7 ]; then
    cp "$BACKUP_DIR/daily/$BACKUP_NAME" "$BACKUP_DIR/weekly/"
    find "$BACKUP_DIR/weekly" -type f -mtime +28 -delete
fi

# Copier vers monthly le 1er du mois
if [ $(date +%d) -eq 01 ]; then
    cp "$BACKUP_DIR/daily/$BACKUP_NAME" "$BACKUP_DIR/monthly/"
    find "$BACKUP_DIR/monthly" -type f -mtime +365 -delete
fi

# ========================================
# 6. Synchronisation vers stockage suisse (optionnel)
# ========================================
# Option A: Infomaniak Swiss Backup (S3 compatible)
# if command -v rclone &> /dev/null; then
#     log "Synchronisation vers Infomaniak Swiss Backup..."
#     rclone sync "$BACKUP_DIR" infomaniak:vtc-backup/ \
#         --transfers 4 \
#         --checkers 8 \
#         --log-file "$LOG_FILE"
# fi

# Option B: Exoscale SOS (Stockage Object Suisse)
# if command -v aws &> /dev/null; then
#     log "Synchronisation vers Exoscale SOS..."
#     aws s3 sync "$BACKUP_DIR" s3://vtc-backup/ \
#         --endpoint-url https://sos-ch-gva-2.exo.io
# fi

# ========================================
# 7. Vérification et rapport
# ========================================
BACKUP_SIZE=$(du -sh "$BACKUP_DIR/daily/$BACKUP_NAME" | cut -f1)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "=========================================="
log "Backup terminé avec succès"
log "Taille du backup: $BACKUP_SIZE"
log "Espace total utilisé: $TOTAL_SIZE"
log "=========================================="

# ========================================
# 8. Notification (optionnel)
# ========================================
# Envoyer une notification par email ou webhook
# curl -X POST "https://hooks.slack.com/services/xxx" \
#     -H "Content-Type: application/json" \
#     -d "{\"text\": \"✅ Backup VTC Suisse réussi - $BACKUP_SIZE\"}"

exit 0
EOF

# Rendre exécutable
sudo chmod +x /usr/local/bin/vtc-backup.sh

# Créer le cron job pour backup quotidien à 3h du matin
sudo tee /etc/cron.d/vtc-backup << 'EOF'
# Backup VTC Suisse - Quotidien à 3h00
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

0 3 * * * root /usr/local/bin/vtc-backup.sh >> /var/log/vtc-backup.log 2>&1
EOF

# ========================================
# Configuration rclone pour Infomaniak (optionnel)
# ========================================
echo "
# Pour configurer rclone avec Infomaniak Swiss Backup:
#
# 1. Installer rclone:
#    sudo apt install -y rclone
#
# 2. Créer un Swiss Backup sur https://manager.infomaniak.com
#
# 3. Configurer rclone:
#    rclone config
#    - Name: infomaniak
#    - Type: s3
#    - Provider: Other
#    - Access Key: votre_access_key
#    - Secret Key: votre_secret_key
#    - Endpoint: s3.swiss-backup01.infomaniak.com
#    - Region: (laisser vide)
#
# 4. Décommenter la section rclone dans le script de backup
"

# Créer le répertoire de données
sudo mkdir -p /var/www/vtc-suisse/data
sudo chown -R $USER:$USER /var/www/vtc-suisse/data
```

---

## 11. Monitoring et conformité

```bash
# ============================================
# ÉTAPE 11: Monitoring avec alertes
# Conformité suisse et RGPD
# ============================================

# Installer les outils de monitoring
sudo apt install -y prometheus-node-exporter

# Créer le script de monitoring
sudo tee /usr/local/bin/vtc-monitor.sh << 'EOF'
#!/bin/bash
# ========================================
# Monitoring VTC Suisse
# Alertes pour conformité suisse
# ========================================

# Configuration
ALERT_EMAIL="admin@votredomaine.ch"
SLACK_WEBHOOK="" # Optionnel
LOG_FILE="/var/log/vtc-monitor.log"
HEALTH_URL="http://localhost:3000/api/health"

# Seuils d'alerte
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
RESPONSE_TIME_THRESHOLD=2000 # ms

# Fonction de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Fonction d'alerte
send_alert() {
    local severity=$1
    local message=$2

    log "ALERTE [$severity]: $message"

    # Email
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "[VTC Suisse] Alerte $severity" "$ALERT_EMAIL" 2>/dev/null
    fi

    # Slack
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -s -X POST "$SLACK_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"🚨 *VTC Suisse - $severity*\n$message\"}" \
            > /dev/null 2>&1
    fi
}

# ========================================
# Vérifications système
# ========================================

# CPU
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d'.' -f1)
if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
    send_alert "WARNING" "Utilisation CPU élevée: ${CPU_USAGE}%"
fi

# Mémoire
MEMORY_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
    send_alert "WARNING" "Utilisation mémoire élevée: ${MEMORY_USAGE}%"
fi

# Disque
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
    send_alert "CRITICAL" "Espace disque faible: ${DISK_USAGE}% utilisé"
fi

# ========================================
# Vérifications application
# ========================================

# Santé API
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null)
if [ "$HEALTH_CHECK" != "200" ]; then
    send_alert "CRITICAL" "API ne répond pas (HTTP $HEALTH_CHECK)"

    # Tenter un redémarrage automatique
    pm2 restart vtc-suisse-api
    sleep 5

    # Revérifier
    HEALTH_CHECK2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null)
    if [ "$HEALTH_CHECK2" != "200" ]; then
        send_alert "CRITICAL" "API toujours indisponible après redémarrage"
    else
        log "API redémarrée avec succès"
    fi
fi

# Temps de réponse
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$HEALTH_URL" 2>/dev/null)
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d'.' -f1)
if [ -n "$RESPONSE_MS" ] && [ "$RESPONSE_MS" -gt "$RESPONSE_TIME_THRESHOLD" ]; then
    send_alert "WARNING" "Temps de réponse élevé: ${RESPONSE_MS}ms"
fi

# ========================================
# Vérifications conformité suisse
# ========================================

# Vérifier le certificat SSL
CERT_EXPIRY=$(echo | openssl s_client -servername localhost -connect localhost:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
if [ -n "$CERT_EXPIRY" ]; then
    EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

    if [ "$DAYS_LEFT" -lt 14 ]; then
        send_alert "WARNING" "Certificat SSL expire dans $DAYS_LEFT jours"
    fi
fi

# Vérifier la synchronisation NTP (important pour conformité)
NTP_SYNC=$(timedatectl show --property=NTPSynchronized --value 2>/dev/null)
if [ "$NTP_SYNC" != "yes" ]; then
    send_alert "WARNING" "Synchronisation NTP désactivée - conformité horaire compromise"
fi

# Vérifier le fuseau horaire
TIMEZONE=$(timedatectl show --property=Timezone --value 2>/dev/null)
if [ "$TIMEZONE" != "Europe/Zurich" ]; then
    send_alert "WARNING" "Fuseau horaire incorrect: $TIMEZONE (attendu: Europe/Zurich)"
fi

# ========================================
# Vérifications PM2
# ========================================
PM2_STATUS=$(pm2 jlist 2>/dev/null)
if [ -n "$PM2_STATUS" ]; then
    STOPPED_APPS=$(echo "$PM2_STATUS" | jq -r '.[] | select(.pm2_env.status != "online") | .name' 2>/dev/null)
    if [ -n "$STOPPED_APPS" ]; then
        send_alert "CRITICAL" "Applications PM2 arrêtées: $STOPPED_APPS"
    fi
fi

# ========================================
# Métriques pour Prometheus (optionnel)
# ========================================
METRICS_FILE="/var/lib/prometheus/node-exporter/vtc_metrics.prom"
mkdir -p "$(dirname $METRICS_FILE)" 2>/dev/null

cat > "$METRICS_FILE" << METRICS
# HELP vtc_cpu_usage CPU usage percentage
# TYPE vtc_cpu_usage gauge
vtc_cpu_usage $CPU_USAGE

# HELP vtc_memory_usage Memory usage percentage
# TYPE vtc_memory_usage gauge
vtc_memory_usage $MEMORY_USAGE

# HELP vtc_disk_usage Disk usage percentage
# TYPE vtc_disk_usage gauge
vtc_disk_usage $DISK_USAGE

# HELP vtc_api_response_time_ms API response time in milliseconds
# TYPE vtc_api_response_time_ms gauge
vtc_api_response_time_ms ${RESPONSE_MS:-0}

# HELP vtc_ssl_days_remaining Days until SSL certificate expiry
# TYPE vtc_ssl_days_remaining gauge
vtc_ssl_days_remaining ${DAYS_LEFT:-0}
METRICS

log "Monitoring terminé - CPU: ${CPU_USAGE}%, MEM: ${MEMORY_USAGE}%, DISK: ${DISK_USAGE}%"

exit 0
EOF

# Rendre exécutable
sudo chmod +x /usr/local/bin/vtc-monitor.sh

# Créer le cron job pour monitoring toutes les 5 minutes
sudo tee /etc/cron.d/vtc-monitor << 'EOF'
# Monitoring VTC Suisse - Toutes les 5 minutes
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

*/5 * * * * root /usr/local/bin/vtc-monitor.sh >> /var/log/vtc-monitor.log 2>&1
EOF

# ========================================
# Logrotate pour les logs de monitoring
# ========================================
sudo tee /etc/logrotate.d/vtc-monitor << 'EOF'
/var/log/vtc-monitor.log /var/log/vtc-backup.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 root root
}
EOF

# ========================================
# Installer bc pour les calculs
# ========================================
sudo apt install -y bc mailutils
```

---

## 12. Variables d'environnement régionales

```bash
# ============================================
# ÉTAPE 12: Variables d'environnement Suisse
# Configuration par région (cantons)
# ============================================

# Créer le fichier d'environnement
sudo tee /var/www/vtc-suisse/.env << 'EOF'
# ========================================
# VTC Suisse - Variables d'environnement
# ========================================

# Application
NODE_ENV=production
PORT=3000
APP_NAME="VTC Suisse"
APP_URL=https://votredomaine.ch

# ========================================
# Localisation Suisse
# ========================================
TZ=Europe/Zurich
LOCALE=fr-CH
COUNTRY=CH
LANGUAGE=fr

# ========================================
# Devises
# ========================================
CURRENCY_PRIMARY=CHF
CURRENCY_SECONDARY=EUR
VAT_RATE=0.077

# ========================================
# Régions suisses (cantons)
# ========================================
# Suisse romande
REGIONS_ROMANDIE=GE,VD,VS,NE,FR,JU

# Suisse alémanique
REGIONS_ALEMANIQUE=ZH,BE,LU,SG,AG,TG,BL,BS,SO,SZ,ZG,SH,AR,AI,GL,NW,OW,UR,GR

# Tessin
REGIONS_TESSIN=TI

# Toutes les régions
SWISS_REGIONS=GE,VD,VS,NE,FR,BE,ZH,BS,TI,LU,SG,AG,TG,GR,SO,BL,SZ,ZG,SH,AR,AI,GL,NW,OW,UR,JU

# ========================================
# Configuration par canton
# ========================================
# Genève
CANTON_GE_NAME="Genève"
CANTON_GE_LANGUAGE=fr
CANTON_GE_AIRPORT=GVA
CANTON_GE_TIMEZONE=Europe/Zurich

# Vaud
CANTON_VD_NAME="Vaud"
CANTON_VD_LANGUAGE=fr
CANTON_VD_AIRPORT=GVA
CANTON_VD_TIMEZONE=Europe/Zurich

# Valais
CANTON_VS_NAME="Valais"
CANTON_VS_LANGUAGE=fr,de
CANTON_VS_AIRPORTS=SIR,GVA
CANTON_VS_TIMEZONE=Europe/Zurich

# Zurich
CANTON_ZH_NAME="Zürich"
CANTON_ZH_LANGUAGE=de
CANTON_ZH_AIRPORT=ZRH
CANTON_ZH_TIMEZONE=Europe/Zurich

# Bâle
CANTON_BS_NAME="Basel-Stadt"
CANTON_BS_LANGUAGE=de
CANTON_BS_AIRPORT=BSL
CANTON_BS_TIMEZONE=Europe/Zurich

# Tessin
CANTON_TI_NAME="Ticino"
CANTON_TI_LANGUAGE=it
CANTON_TI_AIRPORT=LUG
CANTON_TI_TIMEZONE=Europe/Zurich

# ========================================
# Aéroports suisses
# ========================================
AIRPORTS_SWISS=GVA,ZRH,BSL,BRN,LUG,SIR

AIRPORT_GVA_NAME="Genève Aéroport"
AIRPORT_GVA_CITY="Genève"
AIRPORT_GVA_LAT=46.2381
AIRPORT_GVA_LON=6.1089

AIRPORT_ZRH_NAME="Zürich Flughafen"
AIRPORT_ZRH_CITY="Zürich"
AIRPORT_ZRH_LAT=47.4647
AIRPORT_ZRH_LON=8.5492

AIRPORT_BSL_NAME="EuroAirport Basel-Mulhouse"
AIRPORT_BSL_CITY="Basel"
AIRPORT_BSL_LAT=47.5896
AIRPORT_BSL_LON=7.5299

# ========================================
# Gares principales
# ========================================
TRAIN_STATIONS=GVA_CORNAVIN,ZRH_HB,BRN_HB,BSL_SBB,LSN_GARE

STATION_GVA_CORNAVIN_NAME="Gare de Genève-Cornavin"
STATION_GVA_CORNAVIN_LAT=46.2103
STATION_GVA_CORNAVIN_LON=6.1423

STATION_ZRH_HB_NAME="Zürich Hauptbahnhof"
STATION_ZRH_HB_LAT=47.3783
STATION_ZRH_HB_LON=8.5403

# ========================================
# APIs
# ========================================
OPENROUTESERVICE_API_KEY=your-api-key-here
NOMINATIM_USER_AGENT="VTC-Suisse/1.0"

# ========================================
# Sécurité
# ========================================
JWT_SECRET=your-super-secret-jwt-key-here
CORS_ORIGINS=https://votredomaine.ch,https://www.votredomaine.ch
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# ========================================
# Base de données (optionnel)
# ========================================
# DATABASE_URL=postgresql://user:pass@localhost:5432/vtc_suisse
# REDIS_URL=redis://localhost:6379

# ========================================
# Email (optionnel)
# ========================================
# SMTP_HOST=mail.infomaniak.com
# SMTP_PORT=587
# SMTP_USER=contact@votredomaine.ch
# SMTP_PASS=your-password
# SMTP_FROM="VTC Suisse <contact@votredomaine.ch>"

# ========================================
# Conformité
# ========================================
GDPR_ENABLED=true
DATA_RETENTION_DAYS=730
LOG_RETENTION_DAYS=90
EOF

# Sécuriser le fichier .env
sudo chmod 600 /var/www/vtc-suisse/.env
sudo chown $USER:$USER /var/www/vtc-suisse/.env

# ========================================
# Module de configuration régionale
# ========================================
sudo tee /var/www/vtc-suisse/src/regions.js << 'EOF'
/**
 * Configuration des régions suisses
 * Cantons, aéroports, gares, langues
 */

// ========================================
// Cantons suisses
// ========================================
export const CANTONS = {
  // Suisse romande
  GE: { name: 'Genève', nameFr: 'Genève', nameDe: 'Genf', nameIt: 'Ginevra', language: 'fr', region: 'romandie' },
  VD: { name: 'Vaud', nameFr: 'Vaud', nameDe: 'Waadt', nameIt: 'Vaud', language: 'fr', region: 'romandie' },
  VS: { name: 'Valais', nameFr: 'Valais', nameDe: 'Wallis', nameIt: 'Vallese', language: 'fr,de', region: 'romandie' },
  NE: { name: 'Neuchâtel', nameFr: 'Neuchâtel', nameDe: 'Neuenburg', nameIt: 'Neuchâtel', language: 'fr', region: 'romandie' },
  FR: { name: 'Fribourg', nameFr: 'Fribourg', nameDe: 'Freiburg', nameIt: 'Friburgo', language: 'fr,de', region: 'romandie' },
  JU: { name: 'Jura', nameFr: 'Jura', nameDe: 'Jura', nameIt: 'Giura', language: 'fr', region: 'romandie' },

  // Suisse alémanique
  ZH: { name: 'Zürich', nameFr: 'Zurich', nameDe: 'Zürich', nameIt: 'Zurigo', language: 'de', region: 'alemanique' },
  BE: { name: 'Bern', nameFr: 'Berne', nameDe: 'Bern', nameIt: 'Berna', language: 'de,fr', region: 'alemanique' },
  LU: { name: 'Luzern', nameFr: 'Lucerne', nameDe: 'Luzern', nameIt: 'Lucerna', language: 'de', region: 'alemanique' },
  SG: { name: 'St. Gallen', nameFr: 'Saint-Gall', nameDe: 'St. Gallen', nameIt: 'San Gallo', language: 'de', region: 'alemanique' },
  AG: { name: 'Aargau', nameFr: 'Argovie', nameDe: 'Aargau', nameIt: 'Argovia', language: 'de', region: 'alemanique' },
  TG: { name: 'Thurgau', nameFr: 'Thurgovie', nameDe: 'Thurgau', nameIt: 'Turgovia', language: 'de', region: 'alemanique' },
  BL: { name: 'Basel-Landschaft', nameFr: 'Bâle-Campagne', nameDe: 'Basel-Landschaft', nameIt: 'Basilea Campagna', language: 'de', region: 'alemanique' },
  BS: { name: 'Basel-Stadt', nameFr: 'Bâle-Ville', nameDe: 'Basel-Stadt', nameIt: 'Basilea Città', language: 'de', region: 'alemanique' },
  SO: { name: 'Solothurn', nameFr: 'Soleure', nameDe: 'Solothurn', nameIt: 'Soletta', language: 'de', region: 'alemanique' },
  SZ: { name: 'Schwyz', nameFr: 'Schwytz', nameDe: 'Schwyz', nameIt: 'Svitto', language: 'de', region: 'alemanique' },
  ZG: { name: 'Zug', nameFr: 'Zoug', nameDe: 'Zug', nameIt: 'Zugo', language: 'de', region: 'alemanique' },
  SH: { name: 'Schaffhausen', nameFr: 'Schaffhouse', nameDe: 'Schaffhausen', nameIt: 'Sciaffusa', language: 'de', region: 'alemanique' },
  AR: { name: 'Appenzell Ausserrhoden', nameFr: 'Appenzell Rhodes-Extérieures', nameDe: 'Appenzell Ausserrhoden', nameIt: 'Appenzello Esterno', language: 'de', region: 'alemanique' },
  AI: { name: 'Appenzell Innerrhoden', nameFr: 'Appenzell Rhodes-Intérieures', nameDe: 'Appenzell Innerrhoden', nameIt: 'Appenzello Interno', language: 'de', region: 'alemanique' },
  GL: { name: 'Glarus', nameFr: 'Glaris', nameDe: 'Glarus', nameIt: 'Glarona', language: 'de', region: 'alemanique' },
  NW: { name: 'Nidwalden', nameFr: 'Nidwald', nameDe: 'Nidwalden', nameIt: 'Nidvaldo', language: 'de', region: 'alemanique' },
  OW: { name: 'Obwalden', nameFr: 'Obwald', nameDe: 'Obwalden', nameIt: 'Obvaldo', language: 'de', region: 'alemanique' },
  UR: { name: 'Uri', nameFr: 'Uri', nameDe: 'Uri', nameIt: 'Uri', language: 'de', region: 'alemanique' },
  GR: { name: 'Graubünden', nameFr: 'Grisons', nameDe: 'Graubünden', nameIt: 'Grigioni', language: 'de,rm,it', region: 'alemanique' },

  // Tessin
  TI: { name: 'Ticino', nameFr: 'Tessin', nameDe: 'Tessin', nameIt: 'Ticino', language: 'it', region: 'tessin' },
};

// ========================================
// Aéroports suisses
// ========================================
export const AIRPORTS = {
  GVA: {
    code: 'GVA',
    name: 'Genève Aéroport',
    city: 'Genève',
    canton: 'GE',
    coordinates: { lat: 46.2381, lon: 6.1089 },
    surcharge: 5.00, // CHF
  },
  ZRH: {
    code: 'ZRH',
    name: 'Zürich Flughafen',
    city: 'Zürich',
    canton: 'ZH',
    coordinates: { lat: 47.4647, lon: 8.5492 },
    surcharge: 5.00,
  },
  BSL: {
    code: 'BSL',
    name: 'EuroAirport Basel-Mulhouse-Freiburg',
    city: 'Basel',
    canton: 'BS',
    coordinates: { lat: 47.5896, lon: 7.5299 },
    surcharge: 5.00,
  },
  BRN: {
    code: 'BRN',
    name: 'Bern Airport',
    city: 'Bern',
    canton: 'BE',
    coordinates: { lat: 46.9141, lon: 7.4971 },
    surcharge: 3.00,
  },
  LUG: {
    code: 'LUG',
    name: 'Lugano Airport',
    city: 'Lugano',
    canton: 'TI',
    coordinates: { lat: 46.0040, lon: 8.9106 },
    surcharge: 3.00,
  },
  SIR: {
    code: 'SIR',
    name: 'Sion Airport',
    city: 'Sion',
    canton: 'VS',
    coordinates: { lat: 46.2196, lon: 7.3267 },
    surcharge: 3.00,
  },
};

// ========================================
// Gares principales
// ========================================
export const TRAIN_STATIONS = {
  GENEVE_CORNAVIN: {
    name: 'Gare de Genève-Cornavin',
    city: 'Genève',
    canton: 'GE',
    coordinates: { lat: 46.2103, lon: 6.1423 },
  },
  ZURICH_HB: {
    name: 'Zürich Hauptbahnhof',
    city: 'Zürich',
    canton: 'ZH',
    coordinates: { lat: 47.3783, lon: 8.5403 },
  },
  BERN_HB: {
    name: 'Bern Bahnhof',
    city: 'Bern',
    canton: 'BE',
    coordinates: { lat: 46.9490, lon: 7.4392 },
  },
  BASEL_SBB: {
    name: 'Basel SBB',
    city: 'Basel',
    canton: 'BS',
    coordinates: { lat: 47.5476, lon: 7.5897 },
  },
  LAUSANNE: {
    name: 'Gare de Lausanne',
    city: 'Lausanne',
    canton: 'VD',
    coordinates: { lat: 46.5171, lon: 6.6291 },
  },
};

// ========================================
// Fonctions utilitaires
// ========================================

/**
 * Obtenir le canton par code
 */
export function getCanton(code) {
  return CANTONS[code.toUpperCase()] || null;
}

/**
 * Obtenir les cantons par région
 */
export function getCantonsByRegion(region) {
  return Object.entries(CANTONS)
    .filter(([_, canton]) => canton.region === region)
    .map(([code, canton]) => ({ code, ...canton }));
}

/**
 * Obtenir les cantons francophones
 */
export function getFrenchSpeakingCantons() {
  return Object.entries(CANTONS)
    .filter(([_, canton]) => canton.language.includes('fr'))
    .map(([code, canton]) => ({ code, ...canton }));
}

/**
 * Obtenir l'aéroport le plus proche
 */
export function getNearestAirport(lat, lon) {
  let nearest = null;
  let minDistance = Infinity;

  for (const [code, airport] of Object.entries(AIRPORTS)) {
    const distance = haversineDistance(
      lat, lon,
      airport.coordinates.lat, airport.coordinates.lon
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = { code, ...airport, distance };
    }
  }

  return nearest;
}

/**
 * Calculer la distance haversine (en km)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export default {
  CANTONS,
  AIRPORTS,
  TRAIN_STATIONS,
  getCanton,
  getCantonsByRegion,
  getFrenchSpeakingCantons,
  getNearestAirport,
};
EOF

echo "Configuration régionale créée: /var/www/vtc-suisse/src/regions.js"
```

---

## Récapitulatif des commandes

```bash
# ========================================
# Commandes de vérification
# ========================================

# Vérifier le système
timedatectl                          # Fuseau horaire
locale                               # Locale
cat /etc/apt/sources.list | head -5  # Miroirs

# Vérifier Node.js
node --version
npm --version

# Vérifier Nginx
sudo nginx -t
sudo systemctl status nginx

# Vérifier PM2
pm2 status
pm2 monit

# Vérifier le pare-feu
sudo ufw status verbose

# Vérifier SSL
sudo certbot certificates

# Vérifier les backups
ls -la /var/backups/vtc-suisse/

# Vérifier le monitoring
sudo /usr/local/bin/vtc-monitor.sh

# ========================================
# Commandes de déploiement
# ========================================

# Déployer l'application
cd /var/www/vtc-suisse
git pull origin main
npm install --production
pm2 reload ecosystem.config.cjs --env production

# Redémarrer les services
sudo systemctl restart nginx
pm2 restart all

# Voir les logs
pm2 logs vtc-suisse-api --lines 100
sudo tail -f /var/log/nginx/vtc-suisse-access.log
```

---

## Contact et support

- **Documentation officielle**: [docs.hostinger.com](https://docs.hostinger.com)
- **Support Hostinger Suisse**: support@hostinger.com
- **Infomaniak Swiss Backup**: [www.infomaniak.com](https://www.infomaniak.com)
- **SWITCH (miroirs)**: [mirror.switch.ch](https://mirror.switch.ch)

---

*Guide créé pour VTC Suisse - Optimisé pour Hostinger VPS en Suisse*
