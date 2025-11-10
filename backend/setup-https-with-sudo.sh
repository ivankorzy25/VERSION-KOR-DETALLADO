#!/bin/bash

# Wrapper para ejecutar setup-https.sh con sudo password
# Contraseña sudo: Alvlgeddl2025

set -e  # Salir si hay error

SUDO_PASS="Alvlgeddl2025"

echo "🔐 Iniciando configuración HTTPS..."
echo ""

# ============================================
# 1. OBTENER IP PÚBLICA
# ============================================

echo "🌐 Obteniendo IP pública (IPv4)..."
PUBLIC_IP=$(curl -4 -s ifconfig.me)
echo "✅ Tu IP pública es: $PUBLIC_IP"
echo ""

# ============================================
# 2. INSTALAR NGINX
# ============================================

echo "📦 Instalando Nginx..."
echo "$SUDO_PASS" | sudo -S apt update -qq
echo "$SUDO_PASS" | sudo -S apt install -y nginx
echo "$SUDO_PASS" | sudo -S systemctl enable nginx
echo "$SUDO_PASS" | sudo -S systemctl start nginx
echo "✅ Nginx instalado"
echo ""

# ============================================
# 3. CONFIGURAR DUCKDNS (DNS DINÁMICO)
# ============================================

echo "🦆 Configurando DuckDNS..."
echo ""
echo "ℹ️  Usando configuración existente:"
echo "   Subdominio: lista-precios"
echo "   Dominio: lista-precios.duckdns.org"
echo ""

# Ya configurado anteriormente
DUCKDNS_SUBDOMAIN="lista-precios"
DUCKDNS_TOKEN="80c609d9-beed-49f2-8e97-d1b7e0b93617"
DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"

# Actualizar DuckDNS con la IP actual
if [ -f ~/duckdns/duck.sh ]; then
    ~/duckdns/duck.sh
    echo "✅ DuckDNS actualizado: $DOMAIN"
else
    echo "⚠️  Script DuckDNS no encontrado, creando..."
    mkdir -p ~/duckdns
    cat > ~/duckdns/duck.sh << EOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF
    chmod +x ~/duckdns/duck.sh
    ~/duckdns/duck.sh

    # Agregar a cron si no existe
    (crontab -l 2>/dev/null | grep -q "duck.sh") || (crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -
    echo "✅ DuckDNS configurado: $DOMAIN"
fi
echo ""

# ============================================
# 4. CONFIGURAR NGINX
# ============================================

echo "⚙️  Configurando Nginx..."

echo "$SUDO_PASS" | sudo -S tee /etc/nginx/sites-available/kor-backend > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN $PUBLIC_IP;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
EOF

# Habilitar el sitio
echo "$SUDO_PASS" | sudo -S ln -sf /etc/nginx/sites-available/kor-backend /etc/nginx/sites-enabled/

# Probar configuración
echo "$SUDO_PASS" | sudo -S nginx -t

# Reiniciar Nginx
echo "$SUDO_PASS" | sudo -S systemctl reload nginx

echo "✅ Nginx configurado"
echo ""

# ============================================
# 5. ABRIR PUERTOS EN FIREWALL
# ============================================

echo "🔥 Configurando firewall..."

# Permitir HTTP (80) y HTTPS (443)
echo "$SUDO_PASS" | sudo -S ufw allow 80/tcp 2>/dev/null || true
echo "$SUDO_PASS" | sudo -S ufw allow 443/tcp 2>/dev/null || true

echo "✅ Puertos 80 y 443 configurados"
echo ""

# ============================================
# 6. INSTALAR CERTBOT (Let's Encrypt)
# ============================================

echo "📜 Instalando Certbot..."

echo "$SUDO_PASS" | sudo -S apt install -y certbot python3-certbot-nginx

echo "✅ Certbot instalado"
echo ""

# ============================================
# 7. OBTENER CERTIFICADO SSL
# ============================================

echo "🔐 Obteniendo certificado SSL de Let's Encrypt..."
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que:"
echo "   1. Tu router tenga port forwarding configurado (puertos 80 y 443 → 192.168.1.100)"
echo "   2. Tu dominio $DOMAIN apunte a tu IP pública $PUBLIC_IP"
echo ""

# Usar email predefinido o solicitar uno
EMAIL="ivan@korzy.com"

echo "📧 Usando email: $EMAIL"
echo ""

echo "$SUDO_PASS" | sudo -S certbot --nginx \
    -d $DOMAIN \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    --redirect

echo "✅ Certificado SSL obtenido e instalado"
echo ""

# ============================================
# 8. RENOVACIÓN AUTOMÁTICA
# ============================================

echo "🔄 Configurando renovación automática..."

# Certbot ya crea un timer systemd, verificar que esté activo
echo "$SUDO_PASS" | sudo -S systemctl enable certbot.timer
echo "$SUDO_PASS" | sudo -S systemctl start certbot.timer

echo "✅ Renovación automática configurada"
echo ""

# ============================================
# 9. VERIFICAR PM2
# ============================================

echo "🔍 Verificando que el backend esté corriendo..."

if pm2 list | grep -q "kor-backend"; then
    echo "✅ Backend corriendo en PM2"
else
    echo "⚠️  Backend no encontrado en PM2"
    cd ~/projects/VERSION-KOR-DETALLADO/backend
    pm2 start server.js --name "kor-backend"
    pm2 save
fi

echo ""

# ============================================
# 10. INFORMACIÓN FINAL
# ============================================

echo "════════════════════════════════════════════════════════"
echo "✅ ¡HTTPS CONFIGURADO EXITOSAMENTE!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "🌐 TU DOMINIO:"
echo "   https://$DOMAIN"
echo ""
echo "📡 URL DE LA API:"
echo "   https://$DOMAIN/api"
echo ""
echo "🧪 TEST:"
echo "   curl https://$DOMAIN/api/health"
echo ""
echo "📝 PRÓXIMOS PASOS:"
echo "   1. Actualiza api.js en tu proyecto:"
echo "      baseURL: 'https://$DOMAIN/api'"
echo ""
echo "   2. Sube los cambios a GitHub"
echo ""
echo "🔒 SEGURIDAD:"
echo "   - Certificado SSL válido por 90 días"
echo "   - Renovación automática configurada"
echo "   - HTTPS forzado (HTTP redirige a HTTPS)"
echo ""
echo "════════════════════════════════════════════════════════"
