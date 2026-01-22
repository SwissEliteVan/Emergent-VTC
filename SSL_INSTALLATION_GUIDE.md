# Guide d'Installation SSL avec Certbot

## Situation Actuelle

Le certificat SSL a été créé par Certbot mais n'a pas pu être installé automatiquement car Nginx n'a pas de bloc `server` configuré pour `api.romuo.ch`.

**Message d'erreur reçu :**
```
Could not automatically find a matching server block for api.romuo.ch.
Set the `server_name` directive to use the Nginx installer.
```

---

## Solution : Installation Complète du SSL

### ÉTAPE 1 : Vérifier la Configuration Nginx Actuelle

```bash
# Lister les configurations disponibles
ls -la /etc/nginx/sites-available/

# Lister les configurations actives
ls -la /etc/nginx/sites-enabled/

# Vérifier si romuo.ch existe
cat /etc/nginx/sites-available/romuo.ch
```

---

### ÉTAPE 2 : Créer/Modifier la Configuration Nginx

#### Option A : Si le fichier n'existe pas

```bash
# Créer le fichier de configuration
sudo nano /etc/nginx/sites-available/romuo.ch
```

#### Option B : Si le fichier existe mais est incomplet

```bash
# Éditer le fichier existant
sudo nano /etc/nginx/sites-available/romuo.ch
```

**Copiez-collez cette configuration complète :**

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

# Frontend and Admin
server {
    listen 80;
    server_name romuo.ch www.romuo.ch;

    client_max_body_size 20M;

    # Admin dashboard
    location /admin {
        proxy_pass http://127.0.0.1:8001/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Documentation Swagger
    location /docs {
        proxy_pass http://127.0.0.1:8001/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Documentation Redoc
    location /redoc {
        proxy_pass http://127.0.0.1:8001/redoc;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Root - toutes les autres requêtes
    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enregistrez le fichier :**
- Appuyez sur `Ctrl + X`
- Tapez `Y` pour confirmer
- Appuyez sur `Enter`

---

### ÉTAPE 3 : Activer la Configuration

```bash
# Créer le lien symbolique vers sites-enabled
sudo ln -sf /etc/nginx/sites-available/romuo.ch /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut si elle existe
sudo rm -f /etc/nginx/sites-enabled/default
```

---

### ÉTAPE 4 : Tester la Configuration Nginx

```bash
# Tester la syntaxe de la configuration
sudo nginx -t
```

**Vous devez voir :**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Si vous voyez une erreur :**
- Vérifiez que vous avez bien copié toute la configuration
- Vérifiez qu'il n'y a pas de fautes de frappe dans `server_name`
- Relancez `sudo nginx -t` après correction

---

### ÉTAPE 5 : Recharger Nginx

```bash
# Recharger la configuration Nginx
sudo systemctl reload nginx

# Vérifier le statut
sudo systemctl status nginx
```

**Vous devez voir :**
```
● nginx.service - A high performance web server
   Active: active (running)
```

---

### ÉTAPE 6 : Installer le Certificat SSL

Maintenant que Nginx est correctement configuré, installez le certificat :

```bash
# Installer le certificat déjà créé
sudo certbot install --cert-name romuo.ch
```

**Certbot va vous demander :**

1. **Select the appropriate numbers separated by commas and/or spaces**
   - Tapez : `1 2 3` (ou tapez simplement `Enter` pour sélectionner tous les domaines)
   - Cela installera le certificat pour `romuo.ch`, `www.romuo.ch`, et `api.romuo.ch`

2. **Please choose whether or not to redirect HTTP traffic to HTTPS**
   - Tapez : `2` (pour activer la redirection automatique HTTP → HTTPS)

**Vous devriez voir :**
```
Congratulations! You have successfully enabled HTTPS
```

---

### ÉTAPE 7 : Vérifier l'Installation SSL

```bash
# Vérifier la configuration Nginx après installation SSL
cat /etc/nginx/sites-available/romuo.ch
```

Vous devriez maintenant voir des blocs supplémentaires ajoutés par Certbot :
- `listen 443 ssl;` pour HTTPS
- `ssl_certificate` et `ssl_certificate_key`
- Redirection automatique de HTTP vers HTTPS

---

### ÉTAPE 8 : Tester le Renouvellement Automatique

```bash
# Tester le renouvellement automatique (simulation - ne renouvelle pas vraiment)
sudo certbot renew --dry-run
```

**Vous devez voir :**
```
Congratulations, all simulated renewals succeeded
```

---

### ÉTAPE 9 : Vérifier que le SSL Fonctionne

#### Test en ligne de commande :

```bash
# Tester l'API en HTTPS
curl -I https://api.romuo.ch

# Tester le site principal
curl -I https://romuo.ch

# Tester avec www
curl -I https://www.romuo.ch
```

**Vous devez voir `HTTP/2 200` ou `HTTP/1.1 200` dans la réponse**

#### Test dans le navigateur :

Ouvrez ces URLs dans votre navigateur :

1. https://api.romuo.ch/docs (Documentation Swagger)
2. https://romuo.ch (Site principal)
3. https://www.romuo.ch (Doit rediriger vers romuo.ch)
4. https://api.romuo.ch/api/vehicles (API)

**Vérifiez :**
- Le cadenas 🔒 est affiché dans la barre d'adresse
- Aucun avertissement de sécurité
- Le certificat est valide (cliquez sur le cadenas pour vérifier)

---

## SOLUTION ALTERNATIVE : Réinstaller Complètement

Si l'installation manuelle ne fonctionne pas, vous pouvez réinstaller complètement :

```bash
# Supprimer les certificats existants
sudo certbot delete --cert-name romuo.ch

# Réinstaller en une seule commande
sudo certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch
```

**Répondez :**
1. Email : votre email
2. Terms of Service : `Y`
3. Share email : `N`
4. Redirect HTTP to HTTPS : `2`

---

## Dépannage

### Problème 1 : "Connection refused" lors du test curl

**Cause :** Le backend FastAPI n'est pas en cours d'exécution

**Solution :**
```bash
# Vérifier si le backend tourne
sudo systemctl status emergent-vtc

# Si non actif, le démarrer
sudo systemctl start emergent-vtc
```

---

### Problème 2 : "502 Bad Gateway"

**Cause :** Nginx ne peut pas se connecter au backend sur le port 8001

**Solution :**
```bash
# Vérifier que le port 8001 écoute
sudo netstat -tlnp | grep 8001

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Vérifier les logs du backend
sudo journalctl -u emergent-vtc -f
```

---

### Problème 3 : Certificat non trouvé

**Cause :** Le certificat n'a pas été créé correctement

**Solution :**
```bash
# Vérifier les certificats existants
sudo certbot certificates

# Si aucun certificat, en créer un nouveau
sudo certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch
```

---

### Problème 4 : "nginx: [emerg] could not build server_names_hash"

**Cause :** Trop de domaines ou noms trop longs

**Solution :**
```bash
# Éditer la configuration principale
sudo nano /etc/nginx/nginx.conf

# Ajouter dans le bloc http {}
server_names_hash_bucket_size 64;

# Sauvegarder et recharger
sudo nginx -t
sudo systemctl reload nginx
```

---

## Commandes Utiles

```bash
# Voir tous les certificats installés
sudo certbot certificates

# Renouveler manuellement les certificats
sudo certbot renew

# Renouveler avec verbose pour voir les détails
sudo certbot renew --verbose

# Vérifier l'expiration des certificats
sudo certbot certificates | grep "Expiry Date"

# Forcer le renouvellement même si pas encore expiré
sudo certbot renew --force-renewal

# Voir les logs de Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## Renouvellement Automatique

Les certificats Let's Encrypt expirent après **90 jours**.

Certbot configure automatiquement un timer systemd pour le renouvellement :

```bash
# Vérifier que le timer est actif
sudo systemctl status certbot.timer

# Voir quand aura lieu le prochain renouvellement
sudo systemctl list-timers | grep certbot
```

Le renouvellement automatique se fait 2 fois par jour. Si le certificat expire dans moins de 30 jours, il sera renouvelé automatiquement.

---

## Sécurité SSL Renforcée (Optionnel)

Pour améliorer la sécurité SSL, vous pouvez ajouter ces configurations :

```bash
# Éditer la configuration Nginx
sudo nano /etc/nginx/sites-available/romuo.ch
```

**Ajoutez dans chaque bloc `server` HTTPS (listen 443) :**

```nginx
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;

    # HSTS (optionnel - force HTTPS pour 6 mois)
    add_header Strict-Transport-Security "max-age=15768000; includeSubDomains" always;

    # Autres headers de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
```

```bash
# Tester et recharger
sudo nginx -t
sudo systemctl reload nginx
```

---

## Vérification Finale

Pour confirmer que tout fonctionne correctement :

1. **SSL Labs Test** : https://www.ssllabs.com/ssltest/analyze.html?d=romuo.ch
   - Doit obtenir au moins un **A** ou **A+**

2. **Vérifier HTTPS** : https://api.romuo.ch/docs
   - Doit afficher le cadenas vert/gris
   - Aucun avertissement de sécurité

3. **Vérifier la redirection** : http://romuo.ch
   - Doit automatiquement rediriger vers https://romuo.ch

---

## Support

Si vous rencontrez des problèmes :

1. Consultez les logs :
   - Nginx : `/var/log/nginx/error.log`
   - Certbot : `/var/log/letsencrypt/letsencrypt.log`
   - Backend : `sudo journalctl -u emergent-vtc`

2. Community Let's Encrypt : https://community.letsencrypt.org

3. Testez la configuration avec :
   ```bash
   sudo nginx -t
   sudo certbot certificates
   curl -I https://api.romuo.ch
   ```

---

**Certificats configurés ! 🔒**

Vos trois domaines sont maintenant sécurisés avec HTTPS :
- ✅ https://romuo.ch
- ✅ https://www.romuo.ch
- ✅ https://api.romuo.ch
