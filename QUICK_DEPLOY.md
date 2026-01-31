# Deploiement Rapide Romuo.ch

## 1. Configurer les Secrets GitHub

```
FTP_SERVER     = ftp.hostinger.com
FTP_USERNAME   = (depuis hPanel > FTP)
FTP_PASSWORD   = (depuis hPanel > FTP)
FTP_SERVER_DIR = /public_html/
```

## 2. Deployer

```bash
git push origin main
```

## 3. Verifier

```bash
./scripts/verify-deployment.sh romuo.ch
```

---

## Commandes Utiles

| Commande | Description |
|----------|-------------|
| `./hostinger-swiss-setup.sh --build` | Build le frontend |
| `./hostinger-swiss-setup.sh --check` | Verifier le deploiement |
| `./hostinger-swiss-setup.sh --env` | Generer .env.local |
| `./hostinger-swiss-setup.sh --help` | Afficher l'aide |

---

## URLs

- **Site:** https://romuo.ch
- **API:** https://api.romuo.ch
- **Admin:** https://romuo.ch/admin

---

*Romuo VTC - Suisse*
