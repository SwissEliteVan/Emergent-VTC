#!/bin/bash

# ==============================================
# INSTALLATION STACK LEMP SUR VPS HOSTINGER
# Ubuntu 24.04 - Nginx, MariaDB, PHP 8.2
# ==============================================

# Configuration initiale
set -e

# Fonction pour vérifier les erreurs
error_check() {
    if [ $? -ne 0 ]; then
        echo "[ERREUR] Échec à l'étape: $1"
        exit 1
    fi
}

# -------------------------
# 1. NETTOYAGE DU SERVEUR
# -------------------------
echo "[ÉTAPE 1/7] Nettoyage du serveur..."

# Arrêt et désinstallation des services existants
for service in apache2 nginx node; do
    if systemctl is-active --quiet $service; then
        systemctl stop $service
    fi
    if dpkg -l | grep -q $service; then
        apt-get purge -y $service*
    fi

done

# Suppression des fichiers par défaut
rm -rf /var/www/html/*

# Mise à jour du système
apt-get update
apt-get upgrade -y
apt-get autoremove -y
apt-get clean

error_check "Nettoyage du serveur"

# --------------------------------
# 2. INSTALLATION ET CONFIG NGINX
# --------------------------------
echo "[ÉTAPE 2/7] Installation de Nginx..."

# Installation Nginx
apt-get install -y nginx

# Configuration optimisée
CPU_COUNT=$(grep -c processor /proc/cpuinfo)
sed -i "s/worker_processes auto;/worker_processes $CPU_COUNT;/" /etc/nginx/nginx.conf

# Optimisation des buffers
cat >> /etc/nginx/nginx.conf <<EOL
client_body_buffer_size 10K;
client_header_buffer_size 1k;
client_max_body_size 8m;
large_client_header_buffers 2 1k;
EOL

# Configuration des timeouts
sed -i '/http {/a \    keepalive_timeout 30;\n    client_body_timeout 12;\n    client_header_timeout 12;\n    send_timeout 10;' /etc/nginx/nginx.conf

# Activation Gzip
sed -i 's/# gzip on;/gzip on;/' /etc/nginx/nginx.conf
sed -i 's/# gzip_types/gzip_types/' /etc/nginx/nginx.conf

systemctl enable nginx
systemctl start nginx

error_check "Installation Nginx"

# ---------------------------------
# 3. INSTALLATION ET SÉCURISATION MARIADB
# ---------------------------------
echo "[ÉTAPE 3/7] Installation de MariaDB..."

# Installation MariaDB
apt-get install -y mariadb-server

# Sécurisation automatique
echo -e "\n\n\n\n\n\n" | mysql_secure_installation

# Création de la base de données et utilisateur
DB_PASS=$(openssl rand -base64 12)
mysql -e "CREATE DATABASE app_db;"
mysql -e "CREATE USER 'app_user'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON app_db.* TO 'app_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Optimisation my.cnf pour VPS
MEM_TOTAL=$(free -m | awk '/Mem:/ {print $2}')
INNODB_BUFFER=$(($MEM_TOTAL / 4))

cat >> /etc/mysql/my.cnf <<EOL
[mysqld]
innodb_buffer_pool_size = ${INNODB_BUFFER}M
innodb_log_file_size = 64M
innodb_flush_log_at_trx_commit = 2
query_cache_type = 1
query_cache_limit = 1M
query_cache_size = 16M
EOL

systemctl restart mariadb

error_check "Installation MariaDB"

# ------------------------------
# 4. INSTALLATION PHP 8.2 AVEC FPM
# ------------------------------
echo "[ÉTAPE 4/7] Installation de PHP 8.2..."

# Ajout du dépôt
apt-get install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt-get update

# Installation PHP et extensions
apt-get install -y php8.2-fpm php8.2-mysql php8.2-gd php8.2-curl php8.2-mbstring php8.2-xml php8.2-zip php8.2-opcache

# Configuration php.ini
PHP_INI="/etc/php/8.2/fpm/php.ini"
sed -i 's/memory_limit = .*/memory_limit = 256M/' $PHP_INI
sed -i 's/upload_max_filesize = .*/upload_max_filesize = 64M/' $PHP_INI
sed -i 's/post_max_size = .*/post_max_size = 64M/' $PHP_INI
sed -i 's/max_execution_time = .*/max_execution_time = 180/' $PHP_INI

# Optimisation pool PHP-FPM
POOL_CONF="/etc/php/8.2/fpm/pool.d/www.conf"
sed -i 's/pm.max_children = .*/pm.max_children = 20/' $POOL_CONF
sed -i 's/pm.start_servers = .*/pm.start_servers = 4/' $POOL_CONF
sed -i 's/pm.min_spare_servers = .*/pm.min_spare_servers = 2/' $POOL_CONF
sed -i 's/pm.max_spare_servers = .*/pm.max_spare_servers = 6/' $POOL_CONF

systemctl restart php8.2-fpm

error_check "Installation PHP"

# ------------------------------
# 5. CONFIGURATION SITE PAR DÉFAUT
# ------------------------------
echo "[ÉTAPE 5/7] Configuration du site..."

# Création du répertoire
mkdir -p /var/www/html
chown -R www-data:www-data /var/www/html

# Fichier index.php
echo "<?php phpinfo(); ?>" > /var/www/html/index.php

# Fichier test MySQL
cat > /var/www/html/test_mysql.php <<EOL
<?php
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
innodb_file_per_table = 1
innodb_thread_concurrency = 0
query_cache_type = 0
query_cache_size = 0
tmp_table_size = 32M
max_heap_table_size = 32M
key_buffer_size = 16M
max_connections = 50
thread_cache_size = 50
open_files_limit = 65535
table_definition_cache = 4096
table_open_cache = 4096
EOF

# Redémarrage MariaDB
systemctl restart mariadb

# ----------------------------------------------------
# 4. INSTALLATION PHP 8.2 AVEC FPM
# ----------------------------------------------------
echo "\n[4/7] INSTALLATION DE PHP 8.2"
echo "----------------------------------------"

# Ajout dépôt ondrej/php
apt-get install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt-get update

# Installation PHP et extensions
apt-get install -y php8.2-fpm php8.2-mysql php8.2-gd php8.2-curl \
  php8.2-mbstring php8.2-xml php8.2-zip php8.2-opcache

# Configuration php.ini
PHP_INI="/etc/php/8.2/fpm/php.ini"
sed -i "s/^memory_limit = .*/memory_limit = 256M/" $PHP_INI
sed -i "s/^upload_max_filesize = .*/upload_max_filesize = 64M/" $PHP_INI
sed -i "s/^post_max_size = .*/post_max_size = 64M/" $PHP_INI
sed -i "s/^max_execution_time = .*/max_execution_time = 180/" $PHP_INI
sed -i "s/^;cgi.fix_pathinfo=1/cgi.fix_pathinfo=0/" $PHP_INI

# Optimisation pool PHP-FPM
POOL_CONF="/etc/php/8.2/fpm/pool.d/www.conf"
sed -i "s/^pm = .*/pm = dynamic/" $POOL_CONF
sed -i "s/^pm.max_children = .*/pm.max_children = 10/" $POOL_CONF
sed -i "s/^pm.start_servers = .*/pm.start_servers = 4/" $POOL_CONF
sed -i "s/^pm.min_spare_servers = .*/pm.min_spare_servers = 2/" $POOL_CONF
sed -i "s/^pm.max_spare_servers = .*/pm.max_spare_servers = 6/" $POOL_CONF

# Redémarrage PHP-FPM
systemctl restart php8.2-fpm

# ----------------------------------------------------
# 5. CONFIGURATION DU SITE PAR DÉFAUT
# ----------------------------------------------------
echo "\n[5/7] CONFIGURATION DU SITE"
echo "----------------------------------------"

# Création répertoire web
mkdir -p /var/www/html
chown -R www-data:www-data /var/www/html

# Fichier test PHP
cat > /var/www/html/index.php <<EOF
<?php
phpinfo();
?>
EOF

# Fichier test MySQL
cat > /var/www/html/test_mysql.php <<EOF
<?php
