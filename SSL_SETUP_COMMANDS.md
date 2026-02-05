# Commandes pour la configuration SSL avec Certbot sur Ubuntu 24.04

## Installation de Certbot
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

## Génération du certificat pour votre domaine
Remplacez `mondomaine.ch` par votre nom de domaine.
```bash
sudo certbot --nginx -d mondomaine.ch
```

## Configuration du renouvellement automatique
Certbot configure automatiquement un cron job pour le renouvellement. Vous pouvez tester le renouvellement avec :
```bash
sudo certbot renew --dry-run
```

## Vérification
Assurez-vous que votre site est accessible via `https://mondomaine.ch`.