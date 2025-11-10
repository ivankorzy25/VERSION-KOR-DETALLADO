#!/bin/bash

# Script para configurar HTTPS con certificado autofirmado
# Solución temporal hasta que DNS propague globalmente

set -e

echo "🔐 Configurando HTTPS con certificado autofirmado..."
echo ""

SUDO_PASS="Alvlgeddl2025"
DOMAIN="lista-precios.duckdns.org"

# ============================================
# 1. CREAR CERTIFICADO AUTOFIRMADO
# ============================================

echo "📜 Creando certificado SSL autofirmado..."

# Crear directorio para certificados
echo "$SUDO_PASS" | sudo -S mkdir -p /etc/nginx/ssl

# Generar certificado autofirmado (válido por 365 días)
echo "$SUDO_PASS" | sudo -S openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/$DOMAIN.key \
  -out /etc/nginx/ssl/$DOMAIN.crt \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=KOR/CN=$DOMAIN"

echo "✅ Certificado autofirmado creado"
echo ""

# ============================================
# 2. CONFIGURAR NGINX CON HTTPS
# ============================================

echo "⚙️  Configurando Nginx con HTTPS..."

echo "$SUDO_PASS" | sudo -S tee /etc/nginx/sites-available/kor-backend > /dev/null << 'EOF'
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name lista-precios.duckdns.org 190.50.173.83;

    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl;
    server_name lista-precios.duckdns.org 190.50.173.83;

    # Certificados SSL
    ssl_certificate /etc/nginx/ssl/lista-precios.duckdns.org.crt;
    ssl_certificate_key /etc/nginx/ssl/lista-precios.duckdns.org.key;

    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

        if ($request_method = 'OPTIONS') {
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

echo "✅ Nginx configurado con HTTPS"
echo ""

# ============================================
# 3. VERIFICAR BACKEND
# ============================================

echo "🔍 Verificando backend..."

if pm2 list | grep -q "kor-backend"; then
    echo "✅ Backend corriendo"
else
    echo "⚠️  Iniciando backend..."
    cd ~/projects/VERSION-KOR-DETALLADO/backend
    pm2 start server.js --name "kor-backend"
    pm2 save
fi

echo ""

# ============================================
# 4. TEST
# ============================================

echo "🧪 Probando HTTPS..."
sleep 2

# Test local
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost/api/health)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ HTTPS funcionando localmente"
else
    echo "⚠️  HTTPS responde con código: $HTTP_CODE"
fi

echo ""

# ============================================
# INFORMACIÓN FINAL
# ============================================

echo "════════════════════════════════════════════════════════"
echo "✅ ¡HTTPS CONFIGURADO CON CERTIFICADO AUTOFIRMADO!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   Este es un certificado autofirmado (self-signed)"
echo "   El navegador mostrará una advertencia de seguridad"
echo "   Para obtener un certificado válido de Let's Encrypt:"
echo "   1. Espera 2-4 horas para que DNS propague globalmente"
echo "   2. Ejecuta: sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🌐 URL DE LA API:"
echo "   https://$DOMAIN/api"
echo ""
echo "🧪 TEST (desde el servidor):"
echo "   curl -k https://localhost/api/health"
echo ""
echo "📝 PRÓXIMO PASO:"
echo "   Actualiza api.js:"
echo "   baseURL: 'https://$DOMAIN/api'"
echo ""
echo "🔒 SEGURIDAD:"
echo "   - HTTPS activado (autofirmado)"
echo "   - HTTP redirige a HTTPS"
echo "   - CORS configurado"
echo ""
echo "════════════════════════════════════════════════════════"
