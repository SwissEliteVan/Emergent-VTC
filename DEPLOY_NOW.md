# ⚡ DÉPLOIEMENT ULTRA-RAPIDE - ROMUO.CH

**VPS**: 76.13.6.218 | **OS**: Ubuntu 24.04 | **Durée**: 15-20 minutes

---

## 🚀 MÉTHODE 1: INSTALLATION AUTOMATIQUE (RECOMMANDÉE)

### Étape 1: Connectez-vous au VPS

```bash
ssh root@76.13.6.218
```

### Étape 2: Lancez le script d'installation

```bash
curl -fsSL https://raw.githubusercontent.com/SwissEliteVan/Emergent-VTC/main/install_rapide.sh | bash
```

**OU** si la branche n'est pas encore mergée:

```bash
curl -fsSL https://raw.githubusercontent.com/SwissEliteVan/Emergent-VTC/claude/fix-mongodb-syntax-agjDx/install_rapide.sh | bash
```

**C'EST TOUT!** Le script installe automatiquement:
- Python 3.11
- MongoDB 8.0 (avec authentification sécurisée)
- Backend FastAPI
- Nginx
- Firewall UFW

---

## 🌐 ÉTAPE 3: CONFIGURER LE DNS

**Pendant que le script s'exécute**, configurez votre DNS sur Hostinger:

1. Allez sur **Hostinger Panel** → **Domains** → **romuo.ch**
2. Cliquez sur **DNS Zone**
3. Ajoutez ces 3 enregistrements:

| Type | Nom | Pointe vers | TTL |
|------|-----|-------------|-----|
| **A** | **@** | **76.13.6.218** | 3600 |
| **A** | **www** | **76.13.6.218** | 3600 |
| **A** | **api** | **76.13.6.218** | 3600 |

4. **Cliquez sur "Ajouter"** pour chaque enregistrement
5. **Attendez 5-30 minutes** pour la propagation DNS

---

## 🔒 ÉTAPE 4: INSTALLER SSL/HTTPS

**Après propagation DNS** (testez avec `nslookup romuo.ch`):

```bash
# Se reconnecter au VPS
ssh root@76.13.6.218

# Installer les certificats SSL
certbot --nginx -d romuo.ch -d www.romuo.ch -d api.romuo.ch
```

**Répondez aux questions**:
- Email: `votre@email.com`
- Terms: `Y`
- Share email: `N`
- Redirect to HTTPS: `2` (oui)

---

## ✅ TESTS FINAUX

### Test 1: API via IP

```bash
curl http://76.13.6.218/api/vehicles
```

**Résultat attendu**: JSON avec les véhicules (eco, berline, van)

### Test 2: Vérifier les services

```bash
/root/romuo_health.sh
```

**Résultat attendu**:
```
MongoDB: active
Backend: active
Nginx: active
API: OK
```

### Test 3: Navigateur (après DNS + SSL)

Ouvrez ces URLs dans votre navigateur:

1. **API Vehicles**: https://api.romuo.ch/api/vehicles
2. **Documentation API**: https://api.romuo.ch/docs
3. **Admin Dashboard**: https://romuo.ch/admin
   - Mot de passe: `RomuoAdmin2025!`

---

## 📋 INFORMATIONS IMPORTANTES

### Credentials

| Service | Utilisateur | Mot de passe |
|---------|-------------|--------------|
| **MongoDB** | romuo_root | Romuo2025SecurePassword! |
| **Admin Dashboard** | - | RomuoAdmin2025! |

### URLs de Production

| Service | URL |
|---------|-----|
| **API Backend** | https://api.romuo.ch |
| **Documentation** | https://api.romuo.ch/docs |
| **Admin Dashboard** | https://romuo.ch/admin |

### Commandes Utiles

```bash
# Health check
/root/romuo_health.sh

# Voir les logs du backend
journalctl -u romuo-backend -f

# Redémarrer tous les services
systemctl restart mongod romuo-backend nginx

# Backup MongoDB
mongodump --uri="mongodb://romuo_root:Romuo2025SecurePassword!@localhost:27017/romuo_production?authSource=admin" --out=/backup/mongodb/$(date +%Y%m%d)
```

---

## 🔧 DÉPANNAGE RAPIDE

### Problème: API ne répond pas

```bash
# Vérifier le statut
systemctl status romuo-backend

# Voir les logs
journalctl -u romuo-backend -n 50

# Redémarrer
systemctl restart romuo-backend
```

### Problème: MongoDB erreur authentification

```bash
# Tester la connexion
mongosh -u romuo_root -p Romuo2025SecurePassword! --authenticationDatabase admin

# Vérifier la config
cat /etc/mongod.conf

# Redémarrer MongoDB
systemctl restart mongod
```

### Problème: Nginx 502 Bad Gateway

```bash
# Vérifier que le backend écoute sur le port 8001
ss -ltnp | grep 8001

# Tester l'API localement
curl http://localhost:8001/api/vehicles

# Voir les logs Nginx
tail -f /var/log/nginx/error.log
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consultez:

- **Guide complet**: `DEPLOIEMENT_RAPIDE_VPS.md`
- **Optimisations MongoDB 8.0**: `MONGODB_8_OPTIMIZATIONS.md`
- **Guide de production**: `PRODUCTION_GUIDE.md`

---

## 📞 RÉSUMÉ DU DÉPLOIEMENT

### Ce qui est installé:
- ✅ MongoDB 8.0 (avec authentification sécurisée)
- ✅ Backend FastAPI (port 8001)
- ✅ Nginx reverse proxy (ports 80/443)
- ✅ Firewall UFW (SSH, HTTP, HTTPS)
- ✅ Script de monitoring automatique

### Ce qui reste à faire:
- [ ] Configurer le DNS sur Hostinger
- [ ] Installer SSL avec Certbot
- [ ] Tester l'API sur https://api.romuo.ch
- [ ] Se connecter à l'admin: https://romuo.ch/admin

---

## PROCHAINES ÉTAPES (Optionnel)

1. **Installer le Frontend Mobile** (optionnel)
2. **Configurer Google Maps API**
3. **Mettre en place les backups automatiques**
4. **Ajouter un monitoring externe** (Uptime Robot)

---

## DÉPLOIEMENT PWA WEB (Alternative au Mobile)

Si vous souhaitez déployer uniquement la version web (PWA):

### Option rapide: PWA React (pwa-react/)

```bash
# Sur votre VPS
cd /var/www
git clone https://github.com/SwissEliteVan/Emergent-VTC.git romuo-pwa
cd romuo-pwa/pwa-react

# Configurer Nginx
cat > /etc/nginx/sites-available/pwa << 'EOF'
server {
    listen 80;
    server_name romuo.ch www.romuo.ch;

    root /var/www/romuo-pwa/pwa-react;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache assets
    location ~* \.(js|css|png|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location = /service-worker.js {
        expires off;
        add_header Cache-Control "no-store";
    }
}
EOF

ln -sf /etc/nginx/sites-available/pwa /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### PWA Features

| Feature | PWA React | PWA Vanilla |
|---------|-----------|-------------|
| Framework | React 18 + Tailwind | Vanilla JS + CSS |
| Dossier | `pwa-react/` | `pwa/` |
| Taille | ~50KB | ~80KB |
| Offline | Oui (SW résilient) | Oui (SW résilient) |
| Design | Swiss Style | Corporate |
| Pricing | CHF (Suisse) | EUR |

### Test PWA Local

```bash
# PWA React
cd pwa-react && npx serve .
# Ouvrir http://localhost:3000

# PWA Vanilla
cd pwa && python -m http.server 8000
# Ouvrir http://localhost:8000
```

### Service Worker Résilient

Les Service Workers sont configurés pour être **résilients**:
- Les assets critiques (HTML, CSS, JS) doivent être cachés
- Les assets optionnels (icônes PNG) utilisent `Promise.allSettled()`
- L'app s'installe même si certaines ressources manquent

---

**Bon déploiement!**

**Support**: Consultez `DEPLOIEMENT_RAPIDE_VPS.md` pour le guide détaillé
