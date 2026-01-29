# Guide de Deploiement Hostinger - Romuo.ch

Ce guide explique comment deployer l'application Romuo VTC sur un hebergement mutualise Hostinger.

## Table des matieres

1. [Prerequis](#prerequis)
2. [Configuration du compte Hostinger](#configuration-du-compte-hostinger)
3. [Deploiement automatique via GitHub Actions](#deploiement-automatique-via-github-actions)
4. [Deploiement manuel via FTP](#deploiement-manuel-via-ftp)
5. [Resolution des problemes](#resolution-des-problemes)
6. [Verification du deploiement](#verification-du-deploiement)

---

## Prerequis

- Compte Hostinger avec hebergement web (Premium, Business ou Cloud)
- Nom de domaine configure (ex: romuo.ch)
- Acces au panneau de controle Hostinger (hPanel)
- Node.js 18+ installe localement pour les tests

---

## Configuration du compte Hostinger

### 1. Verifier les parametres PHP/Apache

1. Connectez-vous a **hPanel** (https://hpanel.hostinger.com)
2. Allez dans **Avance** > **Configuration PHP**
3. Verifiez que ces modules sont actives:
   - `mod_rewrite` (CRITIQUE pour le routage SPA)
   - `mod_deflate` (compression GZIP)
   - `mod_expires` (cache navigateur)
   - `mod_headers` (headers de securite)

### 2. Configurer SSL/HTTPS

1. Dans hPanel, allez a **SSL**
2. Activez **Let's Encrypt SSL** pour votre domaine
3. Activez **Forcer HTTPS** dans les parametres

### 3. Creer un compte FTP

1. Dans hPanel, allez a **Fichiers** > **Comptes FTP**
2. Creez un nouveau compte avec ces parametres:
   - **Nom d'utilisateur**: `deploy` (ou autre)
   - **Mot de passe**: generer un mot de passe fort
   - **Repertoire**: `/public_html`
3. Notez les informations de connexion:
   - Serveur FTP: `ftp.votredomaine.com` ou l'adresse IP du serveur
   - Port: `21`

---

## Deploiement automatique via GitHub Actions

### 1. Configurer les secrets GitHub

Dans votre repository GitHub:

1. Allez a **Settings** > **Secrets and variables** > **Actions**
2. Ajoutez ces secrets:

| Nom du secret | Valeur | Exemple |
|--------------|--------|---------|
| `FTP_SERVER` | Adresse du serveur FTP | `ftp.romuo.ch` ou `185.x.x.x` |
| `FTP_USERNAME` | Nom d'utilisateur FTP | `u123456789.deploy` |
| `FTP_PASSWORD` | Mot de passe FTP | `VotreMotDePasse123!` |
| `FTP_SERVER_DIR` | Repertoire cible | `/public_html/` |

**IMPORTANT**: Le `FTP_SERVER_DIR` doit:
- Commencer par `/`
- Se terminer par `/`
- Pointer vers `public_html` (ou le dossier racine de votre domaine)

### 2. Declencher le deploiement

Le deploiement se declenche automatiquement lors d'un push sur la branche `main` qui modifie:
- Les fichiers dans `frontend-romuo/`
- Le workflow `.github/workflows/deploy-frontend.yml`

Pour declencher manuellement:
1. Allez a **Actions** > **Deploy to Hostinger**
2. Cliquez sur **Run workflow**

### 3. Verifier les logs

Apres le deploiement:
1. Verifiez que l'etape "Ensure .htaccess is in dist" affiche le contenu du `.htaccess`
2. Verifiez que l'etape "Deploy to Hostinger via FTP" reussit

---

## Deploiement manuel via FTP

Si le deploiement automatique echoue, suivez ces etapes manuelles:

### 1. Generer le build localement

```bash
cd frontend-romuo
npm install
npm run build
```

### 2. Verifier le contenu du build

```bash
ls -la dist/
```

Vous devez voir:
- `index.html` - Point d'entree de l'application
- `.htaccess` - Configuration Apache (CRITIQUE)
- `htaccess` - Copie de backup sans le point
- `assets/` - JavaScript, CSS, images
- `manifest.json` - Manifest PWA
- `sw.js` - Service Worker

### 3. Uploader via FileZilla

1. Ouvrez FileZilla ou votre client FTP
2. Connectez-vous avec vos identifiants FTP
3. Naviguez vers `/public_html/`
4. **IMPORTANT**: Activez l'affichage des fichiers caches (dans FileZilla: Serveur > Forcer l'affichage des fichiers caches)
5. Uploadez **tout le contenu** du dossier `dist/`:
   - Ne pas uploader le dossier `dist` lui-meme, mais son contenu

### 4. Verifier le .htaccess sur le serveur

Apres l'upload, verifiez que le fichier `.htaccess` est present dans `/public_html/`:

```
/public_html/
├── .htaccess        <-- DOIT ETRE PRESENT
├── index.html
├── manifest.json
├── sw.js
├── assets/
│   ├── js/
│   ├── css/
│   └── images/
└── ...
```

**Si le .htaccess est absent**, uploadez le fichier `htaccess` (sans le point) et renommez-le en `.htaccess` directement sur le serveur via le gestionnaire de fichiers hPanel.

---

## Resolution des problemes

### Erreur "Not Found" (404)

**Cause principale**: Le fichier `.htaccess` n'est pas present ou mal configure.

**Solutions**:

1. **Verifiez que .htaccess existe sur le serveur**:
   - Connectez-vous via FTP ou hPanel File Manager
   - Activez l'affichage des fichiers caches
   - Verifiez que `.htaccess` est dans `/public_html/`

2. **Si .htaccess est absent**:
   - Uploadez manuellement depuis `frontend-romuo/public/.htaccess`
   - Ou renommez le fichier `htaccess` en `.htaccess`

3. **Verifiez mod_rewrite**:
   - Contactez le support Hostinger si le probleme persiste
   - Demandez d'activer `mod_rewrite` pour votre hebergement

### Erreur "500 Internal Server Error"

**Cause**: Syntaxe incorrecte dans le `.htaccess` ou module Apache manquant.

**Solutions**:

1. Verifiez la syntaxe du `.htaccess` via un validateur
2. Testez en commentant des sections du `.htaccess`
3. Contactez le support Hostinger

### Les assets ne chargent pas (404 sur les fichiers JS/CSS)

**Cause**: Chemin de base incorrect ou fichiers non uploades.

**Solutions**:

1. Verifiez que le dossier `assets/` existe sur le serveur
2. Verifiez que `vite.config.js` a `base: '/'`
3. Re-buildez et re-deployez

### Service Worker ne fonctionne pas

**Cause**: HTTPS non active ou SW non enregistre.

**Solutions**:

1. Verifiez que HTTPS est force dans Hostinger
2. Verifiez que `sw.js` est dans `/public_html/`
3. Videz le cache du navigateur

---

## Verification du deploiement

Apres le deploiement, testez:

### 1. Page principale
- [ ] https://romuo.ch charge correctement
- [ ] La carte s'affiche
- [ ] Les styles sont appliques

### 2. Routage SPA
- [ ] https://romuo.ch/test renvoie vers la page principale (pas d'erreur 404)
- [ ] Le rafraichissement de page fonctionne

### 3. Performance
- [ ] Ouvrez DevTools > Network
- [ ] Verifiez que les fichiers sont compresses (colonne "Size" vs "Content")
- [ ] Verifiez que le cache fonctionne (colonne "Status" = 304 au rechargement)

### 4. HTTPS
- [ ] Le cadenas vert s'affiche dans la barre d'adresse
- [ ] http:// redirige vers https://

### 5. PWA (si applicable)
- [ ] L'icone "Installer" apparait dans la barre d'adresse
- [ ] L'application fonctionne hors ligne

---

## Structure des fichiers deployes

```
/public_html/
├── .htaccess                 # Configuration Apache
├── htaccess                  # Backup (a supprimer ou renommer si .htaccess absent)
├── index.html                # Point d'entree HTML
├── manifest.json             # Manifest PWA
├── sw.js                     # Service Worker
├── robots.txt                # Instructions pour les moteurs de recherche
├── sitemap.xml               # Plan du site
├── icon-*.png                # Icones PWA
├── assets/
│   ├── js/
│   │   ├── index-[hash].js       # JavaScript principal
│   │   ├── react-vendor-[hash].js
│   │   ├── leaflet-vendor-[hash].js
│   │   └── icons-[hash].js
│   ├── css/
│   │   └── index-[hash].css      # Styles
│   └── images/
│       └── ...                   # Images optimisees
└── *.gz                      # Fichiers pre-compresses (optionnel)
```

---

## Contacts et support

- **Support Hostinger**: https://www.hostinger.fr/support
- **Documentation Hostinger**: https://www.hostinger.fr/tutoriels/
- **Issues du projet**: Ouvrir une issue sur le repository GitHub

---

*Derniere mise a jour: Janvier 2026*
