# Déploiement de Romuo VTC sur Hostinger

## Configuration des Secrets GitHub

Pour déployer automatiquement sur romuo.ch, vous devez configurer 4 secrets dans votre repository GitHub:

### 1. Aller sur GitHub
1. Ouvrez https://github.com/SwissEliteVan/Emergent-VTC
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

### 2. Ajouter les 4 secrets suivants:

#### Secret 1: `FTP_SERVER`
- **Name:** `FTP_SERVER`
- **Value:** L'adresse FTP de votre Hostinger (ex: `ftp.romuo.ch` ou IP comme `185.x.x.x`)
- Trouvez cette info dans Hostinger → File Manager → FTP Accounts

#### Secret 2: `FTP_USERNAME`
- **Name:** `FTP_USERNAME`
- **Value:** Votre nom d'utilisateur FTP Hostinger
- Exemple: `u123456789@romuo.ch`

#### Secret 3: `FTP_PASSWORD`
- **Name:** `FTP_PASSWORD`
- **Value:** Le mot de passe FTP de votre compte Hostinger

#### Secret 4: `FTP_SERVER_DIR`
- **Name:** `FTP_SERVER_DIR`
- **Value:** Le dossier de destination sur Hostinger
- **Recommandé:** `/public_html/` ou `/public_html/app/`
- ⚠️ **IMPORTANT:** Doit se terminer par `/`

## Déploiement Automatique

Une fois les secrets configurés, le déploiement se fait automatiquement:

1. **À chaque push sur `main` ou `claude/certificate-renewal-options-3sgBq`**
   ```bash
   git push origin claude/certificate-renewal-options-3sgBq
   ```

2. **Ou manuellement depuis GitHub:**
   - Allez sur https://github.com/SwissEliteVan/Emergent-VTC/actions
   - Cliquez sur **Deploy to Hostinger** (à gauche)
   - Cliquez sur **Run workflow** → **Run workflow**

## Vérification du Déploiement

1. Ouvrez https://github.com/SwissEliteVan/Emergent-VTC/actions
2. Vous verrez le workflow en cours d'exécution
3. Cliquez dessus pour voir les logs en temps réel
4. ✅ Si tout est vert, votre site est en ligne sur romuo.ch!

## Structure des Fichiers Déployés

Le workflow va:
1. Builder l'application React (`npm run build`)
2. Créer un dossier `dist/` avec les fichiers HTML/CSS/JS optimisés
3. Uploader automatiquement via FTP vers Hostinger
4. Fichiers déployés:
   - `index.html`
   - `assets/` (JavaScript, CSS, images)
   - `manifest.json` (pour PWA)
   - `sw.js` (Service Worker)
   - Icônes PWA

## Configuration Nginx sur Hostinger

Si vous avez un sous-dossier (ex: `/app/`), ajoutez cette configuration:

```nginx
location /app {
    try_files $uri $uri/ /app/index.html;
}
```

Pour la racine (recommandé):
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## Problèmes Courants

### ❌ Erreur: "Failed to connect to FTP server"
- Vérifiez `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` dans les secrets GitHub
- Vérifiez que votre IP n'est pas bloquée dans Hostinger

### ❌ Erreur: "Permission denied"
- Vérifiez que `FTP_SERVER_DIR` existe sur Hostinger
- Vérifiez les permissions du dossier (755 ou 775)

### ❌ Site affiche page blanche
- Ouvrez F12 → Console et vérifiez les erreurs
- Vérifiez que le chemin de base est correct dans `vite.config.js`

## Test Local Avant Déploiement

```bash
cd frontend-romuo
npm run build
npm run preview  # Teste le build en local sur http://localhost:4173
```

## URLs

- **Production:** https://romuo.ch
- **Local Dev:** http://localhost:3000
- **Backend API:** https://romuo.ch/api (ou port 8001)

---

## Déploiement PWA (Progressive Web App)

### Option 1: PWA React (Romuo.ch) - Recommandé

```bash
# Les fichiers sont dans pwa-react/
cd pwa-react

# Déploiement local pour test
npx serve .

# Pour Hostinger: uploader le contenu de pwa-react/ vers public_html/
```

**Fichiers à déployer:**
- `index.html` - Application complète
- `manifest.json` - Configuration PWA
- `service-worker.js` - Support offline
- `icons/` - Icônes de l'application

### Option 2: PWA Vanilla JS (Emergent VTC)

```bash
# Les fichiers sont dans pwa/
cd pwa

# Déploiement local pour test
python -m http.server 8000

# Pour Hostinger: uploader le contenu de pwa/ vers public_html/
```

**Fichiers à déployer:**
- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `icons/`

### Configuration Nginx pour PWA

```nginx
location / {
    root /var/www/pwa;
    try_files $uri $uri/ /index.html;

    # Cache pour assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - pas de cache
    location = /service-worker.js {
        expires off;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
```

### Note importante sur le Service Worker

Le Service Worker est **résilient**: il s'installe même si certaines icônes PNG sont manquantes. La stratégie utilise:

1. `cache.addAll()` pour les assets critiques (HTML, CSS, JS)
2. `Promise.allSettled()` pour les assets optionnels (icônes)

Cela garantit que l'app fonctionne en mode offline même sans toutes les ressources.
