# Guide d'Integration Hostinger - Romuo.ch

## Deploiement Rapide en 5 Minutes

Ce guide vous permet de deployer Romuo.ch sur Hostinger en quelques etapes simples.

---

## Option 1: Hebergement Mutualise (Recommande)

### Etape 1: Preparer les Secrets GitHub

1. Allez sur votre repo GitHub > **Settings** > **Secrets and variables** > **Actions**
2. Ajoutez ces 4 secrets:

| Secret | Valeur | Ou trouver |
|--------|--------|------------|
| `FTP_SERVER` | `ftp.hostinger.com` | hPanel > Fichiers > Comptes FTP |
| `FTP_USERNAME` | `u123456789` | hPanel > Fichiers > Comptes FTP |
| `FTP_PASSWORD` | `votre_mot_de_passe` | hPanel > Fichiers > Comptes FTP |
| `FTP_SERVER_DIR` | `/public_html/` | Toujours `/public_html/` |

### Etape 2: Deployer

```bash
# Depuis votre machine locale
git add .
git commit -m "Deploy to Hostinger"
git push origin main
```

Le workflow GitHub Actions se declenche automatiquement et deploie le site.

### Etape 3: Verifier

```bash
./scripts/verify-deployment.sh romuo.ch
```

**C'est tout!** Votre site est en ligne sur https://romuo.ch

---

## Option 2: VPS Hostinger

### Etape 1: Se connecter au VPS

```bash
ssh root@VOTRE_IP_VPS
```

### Etape 2: Executer le script d'installation

```bash
# Telecharger et executer
curl -sSL https://raw.githubusercontent.com/SwissEliteVan/Emergent-VTC/main/hostinger-swiss-setup.sh | bash -s -- --vps
```

### Etape 3: Configurer le domaine

1. Dans hPanel > **DNS Zone**
2. Ajouter un enregistrement A:
   - Type: `A`
   - Nom: `@`
   - Pointe vers: `VOTRE_IP_VPS`
3. Ajouter pour www:
   - Type: `CNAME`
   - Nom: `www`
   - Pointe vers: `romuo.ch`

### Etape 4: Obtenir le certificat SSL

```bash
certbot --nginx -d romuo.ch -d www.romuo.ch
```

---

## Configuration DNS Hostinger

### Pour le domaine principal

```
Type    Nom     Valeur              TTL
A       @       IP_HOSTINGER        14400
CNAME   www     romuo.ch            14400
```

### Pour l'API (si VPS separe)

```
Type    Nom     Valeur              TTL
A       api     IP_VPS_API          14400
```

---

## Checklist Pre-Deploiement

- [ ] Domaine `romuo.ch` configure sur Hostinger
- [ ] SSL active (automatique sur mutualise)
- [ ] Secrets GitHub configures
- [ ] DNS propage (attendre 24-48h si nouveau)

---

## Commandes Utiles

### Script principal

```bash
# Afficher l'aide
./hostinger-swiss-setup.sh --help

# Build le frontend
./hostinger-swiss-setup.sh --build

# Deployer le frontend
./hostinger-swiss-setup.sh --frontend

# Verifier le deploiement
./hostinger-swiss-setup.sh --check

# Generer .env.local
./hostinger-swiss-setup.sh --env

# Configurer les secrets GitHub
./hostinger-swiss-setup.sh --secrets
```

### Verification manuelle

```bash
# Tester la connectivite
curl -I https://romuo.ch

# Tester le SPA routing
curl -I https://romuo.ch/reservation

# Tester la compression
curl -I -H "Accept-Encoding: gzip" https://romuo.ch
```

---

## Structure des Fichiers Deployes

```
/public_html/
├── index.html          # Point d'entree SPA
├── .htaccess           # Config Apache (SPA routing, compression, securite)
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker
├── favicon.ico
├── robots.txt
└── assets/
    ├── js/             # JavaScript (bundle React)
    ├── css/            # Styles CSS
    ├── images/         # Images optimisees
    └── fonts/          # Polices
```

---

## Configuration Suisse

Le projet est configure pour la Suisse:

| Element | Valeur |
|---------|--------|
| Devise | CHF (Franc Suisse) |
| Langue | Francais (fr-CH) |
| Fuseau horaire | Europe/Zurich |
| TVA | 8.1% |
| Format date | DD.MM.YYYY |
| Paiements | Cash, CB, TWINT |

### Villes desservies

- **Geneve** (GE) - Aeroport GVA
- **Lausanne** (VD)
- **Montreux** (VD)
- **Vevey** (VD)
- **Sion** (VS)
- **Martigny** (VS)
- **Fribourg** (FR)
- **Neuchatel** (NE)
- Zurich, Bale, Berne...

### Tarifs (CHF)

| Vehicule | Base | Par km |
|----------|------|--------|
| Eco | 6 CHF | 2.50 CHF |
| Berline Luxe | 10 CHF | 3.50 CHF |
| Van Premium | 15 CHF | 4.50 CHF |
| Minibus | 25 CHF | 6.00 CHF |

---

## Depannage

### Erreur 404 sur les routes

**Cause:** `.htaccess` non deploye ou `mod_rewrite` desactive

**Solution:**
1. Verifier que `.htaccess` est dans `/public_html/`
2. Dans hPanel > PHP Configuration > activer `mod_rewrite`

### Site non accessible

**Cause:** DNS pas encore propage

**Solution:**
1. Attendre 24-48h
2. Verifier avec: `nslookup romuo.ch`
3. Vider le cache DNS local

### Certificat SSL invalide

**Cause:** SSL pas encore active

**Solution (mutualise):**
1. hPanel > SSL > Activer SSL gratuit

**Solution (VPS):**
```bash
certbot --nginx -d romuo.ch -d www.romuo.ch
```

### Build echoue

**Cause:** Dependances manquantes

**Solution:**
```bash
cd frontend-romuo
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Support

- **Documentation:** Ce fichier
- **Issues:** https://github.com/SwissEliteVan/Emergent-VTC/issues
- **Email:** contact@romuo.ch

---

## Liens Utiles

- [hPanel Hostinger](https://hpanel.hostinger.com)
- [Documentation Hostinger](https://support.hostinger.com)
- [Let's Encrypt](https://letsencrypt.org)
- [GitHub Actions](https://docs.github.com/actions)

---

*Guide mis a jour: Janvier 2026*
*Version: 2.0.0*
