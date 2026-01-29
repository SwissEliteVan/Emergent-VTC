# 🚀 Guide de Déploiement - Romuo.ch sur Hostinger

Ce guide vous explique **étape par étape** comment déployer automatiquement votre application React vers Hostinger via GitHub Actions.

---

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Un compte **Hostinger** actif avec un hébergement web
- ✅ Un compte **GitHub** avec le repository du projet
- ✅ Accès FTP à votre hébergement Hostinger
- ✅ Un nom de domaine configuré (ex: romuo.ch)

---

## 🔐 Étape 1 : Récupérer les Identifiants FTP Hostinger

### 1.1 Connexion au Panel Hostinger

1. Allez sur [https://www.hostinger.com](https://www.hostinger.com)
2. Connectez-vous avec vos identifiants
3. Accédez au **Panel Hostinger** (hPanel)

### 1.2 Accéder au Gestionnaire FTP

1. Dans le menu latéral, cliquez sur **Fichiers** → **Gestionnaire FTP**
2. Vous verrez la section **Comptes FTP**

### 1.3 Créer ou Utiliser un Compte FTP

**Option A - Utiliser le compte FTP principal :**

Le compte principal est automatiquement créé avec votre hébergement :

```
Serveur FTP : ftp.romuo.ch (ou l'IP fournie par Hostinger)
Nom d'utilisateur : u123456789 (fourni par Hostinger)
Mot de passe : (votre mot de passe d'hébergement)
Port : 21
```

**Option B - Créer un nouveau compte FTP (Recommandé) :**

1. Cliquez sur **Créer un compte FTP**
2. Remplissez les champs :
   - **Nom d'utilisateur** : `romuo-deploy` (exemple)
   - **Mot de passe** : Générez un mot de passe fort
   - **Répertoire** : `/public_html/` (ou `/domains/romuo.ch/public_html/`)
3. Cliquez sur **Créer**
4. **Notez précieusement ces informations** ⚠️

### 1.4 Exemple d'Identifiants

```
FTP_SERVER=ftp.romuo.ch
FTP_USERNAME=u123456789-romuo
FTP_PASSWORD=MyS3cur3P@ssw0rd!2026
FTP_SERVER_DIR=/public_html/
```

---

## 🗂️ Étape 2 : Identifier le Répertoire Cible

Le répertoire où seront déployés vos fichiers dépend de votre configuration :

### Configuration A : Site Principal (Domaine Principal)

Si **romuo.ch** est votre domaine principal sur Hostinger :

```
FTP_SERVER_DIR=/public_html/
```

**Résultat :** Vos fichiers seront accessibles sur `https://romuo.ch`

### Configuration B : Domaine Additionnel

Si **romuo.ch** est un domaine additionnel :

```
FTP_SERVER_DIR=/domains/romuo.ch/public_html/
```

**Résultat :** Vos fichiers seront accessibles sur `https://romuo.ch`

### Configuration C : Sous-Dossier

Si vous voulez déployer dans un sous-dossier :

```
FTP_SERVER_DIR=/public_html/app/
```

**Résultat :** Vos fichiers seront accessibles sur `https://votredomaine.com/app/`

### Comment Vérifier ?

1. Allez dans **Fichiers** → **Gestionnaire de Fichiers**
2. Naviguez dans l'arborescence pour voir où sont vos domaines
3. Notez le chemin exact

---

## 🔑 Étape 3 : Configurer les Secrets GitHub

### 3.1 Accéder aux Secrets du Repository

1. Allez sur **GitHub.com** et ouvrez votre repository
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu latéral, cliquez sur **Secrets and variables** → **Actions**
4. Vous êtes maintenant sur la page **Actions secrets**

### 3.2 Ajouter les 4 Secrets Obligatoires

Pour chaque secret, suivez ces étapes :

1. Cliquez sur **New repository secret**
2. Entrez le **Name** (nom du secret)
3. Entrez la **Value** (valeur du secret)
4. Cliquez sur **Add secret**

#### Secret #1 : FTP_SERVER

```
Name: FTP_SERVER
Value: ftp.romuo.ch
```

**Description :** Adresse du serveur FTP Hostinger

**Comment l'obtenir :**
- Allez dans Hostinger → Gestionnaire FTP
- Copiez la valeur "Serveur FTP" ou "FTP Host"
- Exemples : `ftp.romuo.ch`, `ftp.hostinger.com`, ou une IP `123.456.789.10`

---

#### Secret #2 : FTP_USERNAME

```
Name: FTP_USERNAME
Value: u123456789-romuo
```

**Description :** Nom d'utilisateur FTP

**Comment l'obtenir :**
- Depuis Hostinger → Gestionnaire FTP
- C'est le nom d'utilisateur que vous avez créé ou le compte principal
- Généralement au format `u123456789` ou `u123456789-nomsite`

---

#### Secret #3 : FTP_PASSWORD

```
Name: FTP_PASSWORD
Value: VotreMotDePasseSecurise123!
```

**Description :** Mot de passe FTP

**⚠️ IMPORTANT :** Utilisez un mot de passe fort et unique

**Comment l'obtenir :**
- C'est le mot de passe que vous avez défini lors de la création du compte FTP
- Si vous l'avez oublié, vous pouvez le réinitialiser dans Hostinger

---

#### Secret #4 : FTP_SERVER_DIR

```
Name: FTP_SERVER_DIR
Value: /public_html/
```

**Description :** Répertoire cible sur le serveur

**Valeurs possibles :**
- `/public_html/` (site principal)
- `/domains/romuo.ch/public_html/` (domaine additionnel)
- `/public_html/app/` (sous-dossier)

**⚠️ IMPORTANT :** Le chemin doit **commencer par `/`** et **se terminer par `/`**

---

### 3.3 Vérification

Une fois les 4 secrets ajoutés, vous devriez voir dans GitHub :

```
FTP_SERVER        ****   Updated X minutes ago
FTP_USERNAME      ****   Updated X minutes ago
FTP_PASSWORD      ****   Updated X minutes ago
FTP_SERVER_DIR    ****   Updated X minutes ago
```

---

## 🎬 Étape 4 : Activer le Déploiement Automatique

### 4.1 Vérifier le Workflow

Le fichier `.github/workflows/deploy.yml` est déjà configuré dans le projet.

**Emplacement :** `frontend-romuo/.github/workflows/deploy.yml`

### 4.2 Tester le Déploiement

**Option A - Push automatique :**

```bash
# Faire un commit et push sur main
git add .
git commit -m "Configure deployment to Hostinger"
git push origin main
```

**Option B - Déclenchement manuel :**

1. Allez sur GitHub → **Actions**
2. Sélectionnez **Deploy to Hostinger**
3. Cliquez sur **Run workflow**
4. Sélectionnez la branche `main`
5. Cliquez sur **Run workflow**

### 4.3 Suivre le Déploiement

1. Allez dans l'onglet **Actions** de votre repository
2. Cliquez sur le workflow en cours d'exécution
3. Vous verrez les étapes en temps réel :
   - ✅ Checkout repository
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build project
   - ✅ Deploy to Hostinger via FTP
   - ✅ Deployment successful

### 4.4 Durée du Déploiement

⏱️ **Temps total estimé :** 3-5 minutes

- Installation des dépendances : ~1 min
- Build React : ~1 min
- Upload FTP : ~1-3 min (selon la taille)

---

## ✅ Étape 5 : Vérifier le Déploiement

### 5.1 Accéder au Site

Une fois le workflow terminé avec succès :

1. Ouvrez votre navigateur
2. Allez sur **https://romuo.ch** (ou votre domaine)
3. Vous devriez voir l'application Romuo.ch ! 🎉

### 5.2 Que Vérifier ?

- ✅ La carte interactive s'affiche correctement
- ✅ La sidebar est visible avec le formulaire
- ✅ Les couleurs (or et anthracite) sont appliquées
- ✅ Les icônes Lucide React s'affichent
- ✅ Le formulaire de réservation fonctionne

### 5.3 Vérifier les Fichiers sur Hostinger

1. Allez dans Hostinger → **Gestionnaire de Fichiers**
2. Naviguez vers `/public_html/` (ou votre répertoire)
3. Vous devriez voir :
   ```
   /public_html/
   ├── assets/
   │   ├── index-abc123.js
   │   ├── index-def456.css
   ├── index.html
   └── romuo-icon.svg
   ```

---

## 🔧 Étape 6 : Configuration du Fichier .htaccess

Pour que React Router fonctionne correctement, vous devez créer un fichier `.htaccess`.

### 6.1 Créer le Fichier

**Méthode A - Via le Gestionnaire de Fichiers Hostinger :**

1. Allez dans **Fichiers** → **Gestionnaire de Fichiers**
2. Naviguez vers `/public_html/` (votre répertoire cible)
3. Cliquez sur **Nouveau fichier**
4. Nommez-le `.htaccess` (avec le point au début !)
5. Copiez-collez le contenu ci-dessous

**Méthode B - Via FTP :**

1. Connectez-vous avec FileZilla
2. Créez un fichier local `.htaccess`
3. Uploadez-le dans `/public_html/`

### 6.2 Contenu du Fichier .htaccess

```apache
# React Router - Redirection vers index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Ne pas réécrire les fichiers existants
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l

  # Rediriger tout vers index.html
  RewriteRule . /index.html [L]
</IfModule>

# Force HTTPS (SSL)
<IfModule mod_rewrite.c>
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# Compression Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache des assets statiques
<IfModule mod_expires.c>
  ExpiresActive On

  # Images
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"

  # CSS et JavaScript
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"

  # Fonts
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Sécurité
<IfModule mod_headers.c>
  # Empêcher le clickjacking
  Header always set X-Frame-Options "SAMEORIGIN"

  # Protection XSS
  Header always set X-XSS-Protection "1; mode=block"

  # Empêcher le MIME sniffing
  Header always set X-Content-Type-Options "nosniff"

  # Content Security Policy (ajustez selon vos besoins)
  Header always set Content-Security-Policy "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:"
</IfModule>

# Désactiver l'affichage du contenu des répertoires
Options -Indexes

# Page d'erreur personnalisée (optionnel)
ErrorDocument 404 /index.html
```

### 6.3 Vérifier que ça Fonctionne

Testez la redirection :

```
https://romuo.ch/test-route-inexistante
```

➡️ Devrait afficher l'application (pas d'erreur 404)

---

## 🔄 Workflow de Développement

### Développement Local → Production

```bash
# 1. Développer en local
npm run dev

# 2. Tester vos modifications
# Ouvrir http://localhost:3000

# 3. Commit et push
git add .
git commit -m "Add new feature"
git push origin main

# 4. GitHub Actions se déclenche automatiquement
# ⏳ Attendre 3-5 minutes

# 5. Vérifier sur https://romuo.ch
# ✅ Votre site est mis à jour !
```

### Fréquence de Déploiement

- **Automatique** : À chaque push sur `main`
- **Manuel** : Via l'onglet Actions sur GitHub

---

## 🐛 Dépannage

### Problème 1 : Le workflow échoue avec "Authentication failed"

**Cause :** Identifiants FTP incorrects

**Solutions :**
1. Vérifier que `FTP_USERNAME` et `FTP_PASSWORD` sont corrects
2. Tester la connexion FTP avec FileZilla :
   ```
   Hôte : ftp.romuo.ch
   Utilisateur : [votre FTP_USERNAME]
   Mot de passe : [votre FTP_PASSWORD]
   Port : 21
   ```
3. Si FileZilla se connecte mais pas GitHub Actions, le problème vient peut-être des caractères spéciaux dans le mot de passe. Essayez un mot de passe sans caractères spéciaux.

---

### Problème 2 : Le workflow réussit mais le site ne se met pas à jour

**Cause :** Mauvais répertoire cible ou cache navigateur

**Solutions :**

1. **Vérifier le répertoire :**
   - Allez sur Hostinger → Gestionnaire de Fichiers
   - Vérifiez que les fichiers sont bien dans le bon dossier
   - Comparez avec `FTP_SERVER_DIR`

2. **Vider le cache navigateur :**
   - Windows/Linux : `Ctrl + Shift + R`
   - Mac : `Cmd + Shift + R`

3. **Vérifier dans un navigateur privé :**
   - Ouvrez une fenêtre de navigation privée
   - Allez sur https://romuo.ch

---

### Problème 3 : La carte ne s'affiche pas

**Cause :** CSS Leaflet non chargé ou bloqué par CSP

**Solutions :**

1. **Vérifier la console navigateur :**
   - Ouvrir les Developer Tools (F12)
   - Onglet Console
   - Chercher les erreurs Leaflet

2. **Vérifier que le CSS est chargé :**
   - Dans `index.html`, vérifier cette ligne :
   ```html
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
   ```

3. **Ajuster le .htaccess :**
   - Assouplir la Content Security Policy si nécessaire

---

### Problème 4 : Erreur 404 sur les routes React

**Cause :** Fichier `.htaccess` manquant ou mal configuré

**Solutions :**

1. Vérifier que le fichier `.htaccess` existe dans `/public_html/`
2. Vérifier qu'il contient les règles de réécriture pour React Router
3. Tester avec une URL directe comme `https://romuo.ch/test`

---

### Problème 5 : Le déploiement prend trop de temps (>10 min)

**Cause :** Connexion FTP lente ou gros fichiers

**Solutions :**

1. **Optimiser le build :**
   ```bash
   # Vérifier la taille du dossier dist/
   npm run build
   du -sh dist/
   ```

2. **Exclure des fichiers inutiles :**
   - Dans `deploy.yml`, vérifier la section `exclude`

3. **Passer en SFTP (plus rapide) :**
   - Modifier `deploy.yml` pour utiliser SFTP au lieu de FTP
   - Port 22 au lieu de 21

---

## 📊 Monitoring et Analytics

### Vérifier les Déploiements

Sur GitHub → **Actions**, vous avez l'historique complet :

- ✅ Builds réussis
- ❌ Builds échoués
- ⏱️ Durée de chaque déploiement
- 📦 Logs détaillés

### Ajouter des Notifications (Optionnel)

Vous pouvez recevoir des notifications par email ou Slack en cas d'échec :

Ajoutez à la fin de `deploy.yml` :

```yaml
- name: Notify on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "❌ Déploiement Romuo.ch échoué"
    body: "Le déploiement sur Hostinger a échoué. Vérifiez les logs."
    to: votre-email@example.com
    from: noreply@romuo.ch
```

---

## 🎓 Ressources Supplémentaires

### Documentation Officielle

- [GitHub Actions](https://docs.github.com/en/actions)
- [FTP-Deploy-Action](https://github.com/SamKirkland/FTP-Deploy-Action)
- [Hostinger Docs](https://support.hostinger.com)
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [React-Leaflet](https://react-leaflet.js.org)

### Tutoriels Vidéo Recommandés

1. **Déploiement React sur Hostinger :** Rechercher sur YouTube
2. **GitHub Actions CI/CD :** Documentation GitHub
3. **FTP vs SFTP :** Différences et sécurité

---

## ✅ Checklist Finale

Avant de considérer le déploiement comme terminé :

- [ ] Les 4 secrets GitHub sont configurés
- [ ] Le workflow GitHub Actions s'exécute sans erreur
- [ ] Le site est accessible sur https://romuo.ch
- [ ] Le certificat SSL (HTTPS) fonctionne
- [ ] La carte interactive s'affiche
- [ ] Le formulaire de réservation fonctionne
- [ ] Les styles Tailwind sont appliqués
- [ ] Le fichier `.htaccess` est en place
- [ ] Les routes React fonctionnent (pas de 404)
- [ ] Le site est responsive (mobile/desktop)
- [ ] Les performances sont bonnes (PageSpeed Insights)

---

## 🎉 Félicitations !

Votre application Romuo.ch est maintenant **déployée et opérationnelle** !

Chaque fois que vous pushez sur `main`, votre site se met à jour automatiquement. 🚀

---

**Besoin d'aide ?** Consultez les logs GitHub Actions ou contactez le support.
