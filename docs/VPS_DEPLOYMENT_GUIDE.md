# VPS Deployment Guide (Hostinger Ubuntu 24.04)

## System Setup
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo apt install -y nginx
```

## Nginx Reverse Proxy
```bash
sudo bash -c 'cat > /etc/nginx/sites-available/vtc-app <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'
sudo ln -s /etc/nginx/sites-available/vtc-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

## HTTPS Setup
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## File Transfer
### SCP Method
```bash
scp -r /local/path root@76.13.6.218:/var/www/vtc-app
```

### FileZilla Settings
- Host: 76.13.6.218
- Username: root
- Port: 22

## Application Launch
```bash
cd /var/www/vtc-app
npm install
pm2 start src/server.js --name "vtc-app"
pm2 save
pm2 startup