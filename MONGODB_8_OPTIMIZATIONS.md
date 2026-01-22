# Optimisations MongoDB 8.0 - Guide de Résolution

**Date**: Janvier 2025
**Contexte**: Migration vers MongoDB 8.0 sur VPS Hostinger
**Branche**: claude/fix-mongodb-syntax-agjDx

---

## Résumé Exécutif

Ce document décrit les optimisations techniques critiques réalisées pour faire fonctionner Romuo.ch avec MongoDB 8.0. MongoDB 8.0 introduit une validation YAML extrêmement stricte qui nécessite une approche différente de la configuration par rapport aux versions précédentes.

---

## 1. Problème: Syntaxe Stricte MongoDB 8.0

### Symptôme
```
Error: Unrecognized option: security
MongoDB failed to start
systemctl status mongod → failed (code=exited, status=1/FAILURE)
```

### Cause Racine
MongoDB 8.0 est **extrêmement strict** sur le format YAML du fichier `/etc/mongod.conf`:
- L'indentation doit être **exactement 2 espaces** (pas de tabulations)
- Les blocs de texte copiés-collés introduisent des caractères invisibles
- La moindre erreur d'espacement empêche le démarrage complet

### Solution Appliquée

**Réécriture complète de `/etc/mongod.conf` avec `printf`** (évite les erreurs de copier-coller):

```bash
# Sauvegarder l'ancienne configuration
sudo cp /etc/mongod.conf /etc/mongod.conf.backup

# Créer une configuration minimale et valide
sudo bash -c 'printf "# MongoDB 8.0 Configuration\n\nstorage:\n  dbPath: /var/lib/mongodb\n\nsystemLog:\n  destination: file\n  path: /var/log/mongodb/mongod.log\n  logAppend: true\n\nnet:\n  port: 27017\n  bindIp: 127.0.0.1\n" > /etc/mongod.conf'

# Vérifier la syntaxe
cat /etc/mongod.conf

# Redémarrer MongoDB
sudo systemctl restart mongod
sudo systemctl status mongod
```

**Points Critiques**:
- Utiliser `printf` avec `\n` au lieu de heredocs (cat << EOF)
- Vérifier visuellement l'alignement avant de redémarrer
- Toujours garder une sauvegarde de la config qui fonctionnait

---

## 2. Problème: Authentification Corrompue

### Symptôme
```
MongoServerError: Authentication failed
Backend impossible de se connecter à MongoDB
```

### Cause Racine
- L'utilisateur administrateur `romuo_root` n'existait pas ou avait des permissions incorrectes
- Le backend tentait de se connecter avec des credentials obsolètes
- Le flag `authorization: enabled` était actif sans utilisateur valide

### Solution Appliquée

**Séquence de réinitialisation complète**:

```bash
# ÉTAPE 1: Désactiver temporairement la sécurité
sudo nano /etc/mongod.conf
# Commenter ou retirer la section security:
#security:
#  authorization: enabled

# Redémarrer MongoDB en mode ouvert
sudo systemctl restart mongod

# ÉTAPE 2: Créer l'utilisateur admin en force
mongosh
```

```javascript
// Dans mongosh
use admin

db.createUser({
  user: "romuo_root",
  pwd: "VotreMotDePasseSecuriseMongoDB2025!",
  roles: [
    { role: "root", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" }
  ]
})

// Vérifier la création
db.getUsers()

// Tester l'authentification
db.auth("romuo_root", "VotreMotDePasseSecuriseMongoDB2025!")

exit
```

```bash
# ÉTAPE 3: Réactiver la sécurité
sudo nano /etc/mongod.conf
# Ajouter (avec indentation stricte):
security:
  authorization: enabled

# ÉTAPE 4: Redémarrer MongoDB
sudo systemctl restart mongod

# ÉTAPE 5: Tester la connexion authentifiée
mongosh -u romuo_root -p VotreMotDePasseSecuriseMongoDB2025! --authenticationDatabase admin
```

**Points Critiques**:
- **Jamais** sauter l'étape de désactivation temporaire de l'auth
- Noter le mot de passe dans un gestionnaire sécurisé (1Password, Bitwarden)
- Toujours utiliser `authSource=admin` dans les connexions

---

## 3. Problème: Conflits Nginx

### Symptôme
```
nginx: [warn] conflicting server name "romuo.ch" on 0.0.0.0:80
nginx: [warn] conflicting server name "api.romuo.ch" on 0.0.0.0:80
```

### Cause Racine
Deux fichiers de configuration Nginx actifs pour le même domaine:
- `/etc/nginx/sites-available/romuo` (ancien)
- `/etc/nginx/sites-available/romuo.ch` (nouveau)

Les deux étaient liés dans `/etc/nginx/sites-enabled/`, créant un conflit.

### Solution Appliquée

```bash
# ÉTAPE 1: Identifier les doublons
ls -la /etc/nginx/sites-enabled/
# Résultat: romuo -> ../sites-available/romuo
#           romuo.ch -> ../sites-available/romuo.ch

# ÉTAPE 2: Comparer les fichiers
diff /etc/nginx/sites-available/romuo /etc/nginx/sites-available/romuo.ch

# ÉTAPE 3: Garder uniquement romuo.ch (le plus récent)
sudo rm /etc/nginx/sites-enabled/romuo
sudo rm /etc/nginx/sites-available/romuo

# ÉTAPE 4: Vérifier qu'un seul fichier reste
ls -la /etc/nginx/sites-enabled/
# Résultat: romuo.ch -> ../sites-available/romuo.ch

# ÉTAPE 5: Tester la configuration
sudo nginx -t
# Résultat: nginx: configuration file /etc/nginx/nginx.conf test is successful

# ÉTAPE 6: Recharger Nginx
sudo systemctl reload nginx
```

**Configuration Finale de `/etc/nginx/sites-available/romuo.ch`**:

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

# Frontend
server {
    listen 80;
    server_name romuo.ch www.romuo.ch;

    client_max_body_size 20M;

    location /admin {
        proxy_pass http://127.0.0.1:8001/admin;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://127.0.0.1:8001/api;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
    }
}
```

**Points Critiques**:
- Toujours utiliser `nginx -t` avant de recharger
- Préférer `systemctl reload nginx` à `restart` (évite les downtimes)
- Garder un seul fichier par domaine dans `sites-available/`

---

## 4. Problème: Chaîne de Connexion Backend

### Symptôme
```
Backend logs: Cannot connect to MongoDB
pymongo.errors.OperationFailure: Authentication failed
```

### Cause Racine
Le fichier `/var/www/romuo-ch/backend/.env` contenait une chaîne de connexion sans authentification:
```bash
MONGO_URL=mongodb://localhost:27017
```

Avec MongoDB 8.0 et `authorization: enabled`, cette connexion ne fonctionne plus.

### Solution Appliquée

```bash
# Éditer le .env du backend
sudo nano /var/www/romuo-ch/backend/.env
```

**Nouvelle Configuration**:
```bash
# MongoDB 8.0 avec authentification
MONGO_URL=mongodb://romuo_root:VotreMotDePasseSecuriseMongoDB2025!@localhost:27017/romuo_production?authSource=admin

# Base de données
DB_NAME=romuo_production

# Admin dashboard
ADMIN_PASSWORD=RomuoAdmin2025!
```

**Format de la Chaîne de Connexion**:
```
mongodb://[utilisateur]:[mot_de_passe]@[host]:[port]/[database]?authSource=admin
```

**Paramètres Essentiels**:
- `authSource=admin` → **OBLIGATOIRE** pour l'authentification
- `romuo_production` → base de données par défaut
- Tout sur **une seule ligne** (pas de retours à la ligne)

```bash
# Redémarrer le backend
sudo systemctl restart romuo-backend

# Vérifier les logs
sudo journalctl -u romuo-backend -n 50 -f

# Test API
curl http://localhost:8001/api/vehicles
```

---

## 5. Recommandations pour Éviter ces Problèmes

### Règle 1: Éviter les Heredocs sur Terminal Limité
**Problème**: Les longs copier-coller peuvent introduire des caractères invisibles.

**Solution**:
```bash
# ❌ Éviter
cat << EOF > /etc/mongod.conf
storage:
  dbPath: /var/lib/mongodb
EOF

# ✅ Utiliser
printf "storage:\n  dbPath: /var/lib/mongodb\n" > /etc/mongod.conf
```

### Règle 2: Stratégie "Plan B" Systématique
Avant chaque modification critique, préparer les commandes de diagnostic:

```bash
# Avant de modifier mongod.conf
echo "Sauvegarde et diagnostics préparés"

# Sauvegarde
sudo cp /etc/mongod.conf /etc/mongod.conf.$(date +%Y%m%d_%H%M%S)

# Diagnostics prêts
alias check_mongo="sudo systemctl status mongod && sudo ss -ltnp | grep 27017"
alias check_backend="sudo systemctl status romuo-backend && sudo ss -ltnp | grep 8001"
alias check_nginx="sudo nginx -t && sudo systemctl status nginx"
```

### Règle 3: Isolation Docker vs Systemd
**Architecture Recommandée**:
- **Frontend**: Docker (port 3000) → `/var/www/romuo-ch/frontend`
- **Backend**: Systemd natif (port 8001) → `/var/www/romuo-ch/backend`
- **MongoDB**: Systemd natif (port 27017) → Service système
- **Nginx**: Systemd natif (ports 80/443) → Reverse proxy

**Commande de Vérification Globale**:
```bash
# Vérifier qu'aucun conflit de ports n'existe
sudo ss -ltnp | grep -E ":(3000|8001|27017|80|443)"

# Résultat attendu:
# *:27017  mongod
# *:8001   uvicorn (backend)
# *:80     nginx
# *:443    nginx
```

### Règle 4: Validation YAML Avant Redémarrage
**Pour MongoDB 8.0**:
```bash
# Valider visuellement l'indentation
cat /etc/mongod.conf | grep -E "^[^ ]|^  [^ ]"

# Chaque niveau d'indentation = 2 espaces exactement
# Niveau 0: storage:, systemLog:, net:, security:
# Niveau 1:   dbPath:, destination:, port:, authorization:
```

**Checklist Visuelle**:
- [ ] Pas de tabulations (seulement des espaces)
- [ ] Indentation = multiples de 2 espaces
- [ ] Pas de lignes vides à l'intérieur des blocs
- [ ] Tous les blocs principaux au niveau 0

---

## 6. Commandes de Diagnostic Rapide

### Vérifier l'État des Services
```bash
# Statut complet
sudo systemctl status mongod romuo-backend nginx

# Ports d'écoute
sudo ss -ltnp | grep -E ":(27017|8001|80|443)"

# Logs en temps réel
sudo journalctl -u mongod -f
sudo journalctl -u romuo-backend -f
sudo journalctl -u nginx -f
```

### Test de Connexion MongoDB
```bash
# Sans authentification (mode debug)
mongosh

# Avec authentification
mongosh -u romuo_root -p --authenticationDatabase admin

# Tester une base spécifique
mongosh -u romuo_root -p --authenticationDatabase admin romuo_production
```

### Test de l'API Backend
```bash
# Test local
curl http://localhost:8001/api/vehicles

# Test via domaine
curl https://api.romuo.ch/api/vehicles

# Test avec headers
curl -H "Authorization: Bearer token_abc123" http://localhost:8001/api/auth/me
```

---

## 7. Checklist Post-Optimisation

### Vérifications Critiques
- [x] MongoDB démarre sans erreur: `systemctl status mongod`
- [x] Port 27017 ouvert: `ss -ltnp | grep 27017`
- [x] Authentification fonctionne: `mongosh -u romuo_root -p`
- [x] Backend se connecte: `journalctl -u romuo-backend -n 50`
- [x] API répond: `curl http://localhost:8001/api/vehicles`
- [x] Nginx sans warnings: `nginx -t`
- [x] HTTPS actif: `curl https://api.romuo.ch/api/vehicles`

### Configuration Finale
```bash
# MongoDB 8.0
/etc/mongod.conf → Syntaxe YAML valide, authorization: enabled

# Backend
/var/www/romuo-ch/backend/.env → Chaîne de connexion avec authSource=admin

# Nginx
/etc/nginx/sites-available/romuo.ch → Un seul fichier, pas de conflits

# Services
systemctl status mongod → active (running)
systemctl status romuo-backend → active (running)
systemctl status nginx → active (running)
```

---

## 8. Résumé des Optimisations

| Composant | Problème | Solution | Résultat |
|-----------|----------|----------|----------|
| **MongoDB Config** | Syntaxe YAML stricte | Réécriture avec `printf` | Démarrage réussi |
| **MongoDB Auth** | Utilisateur corrompu | Réinitialisation complète | Connexion validée |
| **Nginx** | Conflits de domaine | Suppression des doublons | Warnings éliminés |
| **Backend .env** | Chaîne sans auth | Ajout `authSource=admin` | API opérationnelle |
| **Architecture** | Ports Docker vs Systemd | Isolation claire | Pas de conflits |

---

## 9. Prochaines Étapes

### Sécurisation Renforcée
```bash
# Créer un utilisateur dédié pour le backend (au lieu de root)
mongosh -u romuo_root -p --authenticationDatabase admin
```

```javascript
use admin

db.createUser({
  user: "romuo_backend",
  pwd: "MotDePasseBackendDifferent2025!",
  roles: [
    { role: "readWrite", db: "romuo_production" }
  ]
})
```

### Monitoring Automatisé
```bash
# Script de santé système
sudo nano /root/health_check.sh
```

```bash
#!/bin/bash
echo "=== Romuo Health Check $(date) ===" >> /var/log/romuo_health.log

# MongoDB
echo -n "MongoDB: " >> /var/log/romuo_health.log
systemctl is-active mongod >> /var/log/romuo_health.log

# Backend
echo -n "Backend: " >> /var/log/romuo_health.log
systemctl is-active romuo-backend >> /var/log/romuo_health.log

# API Test
curl -s http://localhost:8001/api/vehicles > /dev/null && echo "API: OK" >> /var/log/romuo_health.log || echo "API: FAILED" >> /var/log/romuo_health.log
```

```bash
# Rendre exécutable
sudo chmod +x /root/health_check.sh

# Ajouter au cron (toutes les 5 minutes)
echo "*/5 * * * * /root/health_check.sh" | sudo crontab -
```

---

## Contact & Support

**Documentation Associée**:
- `GUIDE_COMPLET_DEPLOIEMENT.md` - Guide initial (MongoDB 7.0)
- `PRODUCTION_GUIDE.md` - Guide complet de production
- `MONGODB_8_OPTIMIZATIONS.md` - Ce fichier (MongoDB 8.0)

**Branche Git**: `claude/fix-mongodb-syntax-agjDx`
**Date**: Janvier 2025
**Status**: ✅ Optimisations validées en production

---

**Note Importante**: Ce document reflète les optimisations spécifiques nécessaires pour MongoDB 8.0. Si vous déployez avec MongoDB 7.0, référez-vous au `GUIDE_COMPLET_DEPLOIEMENT.md` original.
