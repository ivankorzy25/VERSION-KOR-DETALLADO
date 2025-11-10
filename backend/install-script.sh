#!/bin/bash

# ============================================
# Script de Instalación Automática
# KOR Generadores Backend en Ubuntu 24.04
# ============================================

set -e  # Salir si hay error

echo "🚀 Iniciando instalación del backend KOR Generadores..."
echo ""

# ============================================
# 1. VERIFICAR SISTEMA
# ============================================

echo "📋 Verificando sistema..."
if [ ! -f /etc/os-release ]; then
    echo "❌ No se puede detectar el sistema operativo"
    exit 1
fi

. /etc/os-release
echo "✅ Sistema: $PRETTY_NAME"
echo ""

# ============================================
# 2. ACTUALIZAR SISTEMA
# ============================================

echo "📦 Actualizando sistema..."
sudo apt update -qq
sudo apt upgrade -y -qq
echo "✅ Sistema actualizado"
echo ""

# ============================================
# 3. INSTALAR NODE.JS 20.x
# ============================================

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js ya instalado: $NODE_VERSION"
else
    echo "📥 Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    NODE_VERSION=$(node --version)
    echo "✅ Node.js instalado: $NODE_VERSION"
fi
echo ""

# ============================================
# 4. INSTALAR GIT
# ============================================

if command -v git &> /dev/null; then
    echo "✅ Git ya instalado: $(git --version)"
else
    echo "📥 Instalando Git..."
    sudo apt install -y git
    echo "✅ Git instalado"
fi
echo ""

# ============================================
# 5. BUSCAR PUERTO DISPONIBLE
# ============================================

echo "🔍 Buscando puerto disponible..."

check_port() {
    if sudo netstat -tuln | grep -q ":$1 "; then
        return 1  # Puerto en uso
    else
        return 0  # Puerto libre
    fi
}

# Buscar puerto desde 3001 hasta 3100
BACKEND_PORT=""
for port in {3001..3100}; do
    if check_port $port; then
        BACKEND_PORT=$port
        break
    fi
done

if [ -z "$BACKEND_PORT" ]; then
    echo "❌ No se encontró puerto disponible entre 3001-3100"
    exit 1
fi

echo "✅ Puerto disponible encontrado: $BACKEND_PORT"
echo ""

# ============================================
# 6. CLONAR REPOSITORIO
# ============================================

PROJECTS_DIR="$HOME/projects"
REPO_DIR="$PROJECTS_DIR/VERSION-KOR-DETALLADO"

echo "📁 Preparando directorio..."
mkdir -p "$PROJECTS_DIR"

if [ -d "$REPO_DIR" ]; then
    echo "⚠️  El repositorio ya existe, actualizando..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "📥 Clonando repositorio..."
    cd "$PROJECTS_DIR"
    git clone https://github.com/ivankorzy25/VERSION-KOR-DETALLADO.git
    cd "$REPO_DIR"
fi

echo "✅ Repositorio listo en: $REPO_DIR"
echo ""

# ============================================
# 7. CONFIGURAR BACKEND
# ============================================

echo "⚙️  Configurando backend..."
cd "$REPO_DIR/backend"

# Instalar dependencias
echo "📦 Instalando dependencias de Node.js..."
npm install --quiet

# Crear archivo .env
echo "📝 Creando archivo .env..."
cat > .env << EOF
# Puerto del servidor
PORT=$BACKEND_PORT

# Contraseña del modo interno
INTERNAL_MODE_PASSWORD=2323

# Secret para JWT (generado aleatoriamente)
JWT_SECRET=kor_gen_$(openssl rand -hex 32)

# Ruta al repositorio
REPO_PATH=$REPO_DIR

# URL del frontend (GitHub Pages)
FRONTEND_URL=https://ivankorzy25.github.io

# Modo de producción
NODE_ENV=production
EOF

echo "✅ Configuración creada"
echo ""

# ============================================
# 8. CONFIGURAR FIREWALL
# ============================================

echo "🔥 Configurando firewall..."

# Verificar si UFW está instalado
if command -v ufw &> /dev/null; then
    # Verificar si UFW está activo
    if sudo ufw status | grep -q "Status: active"; then
        echo "✅ UFW ya está activo"
    else
        echo "🔓 Habilitando UFW..."
        sudo ufw --force enable
    fi

    # Asegurar que SSH esté permitido
    sudo ufw allow 22/tcp &>/dev/null

    # Permitir puerto del backend
    sudo ufw allow $BACKEND_PORT/tcp

    echo "✅ Puerto $BACKEND_PORT abierto en firewall"
else
    echo "⚠️  UFW no instalado, saltando configuración de firewall"
fi
echo ""

# ============================================
# 9. INSTALAR PM2
# ============================================

if command -v pm2 &> /dev/null; then
    echo "✅ PM2 ya instalado: $(pm2 --version)"
else
    echo "📥 Instalando PM2..."
    sudo npm install -g pm2
    echo "✅ PM2 instalado"
fi
echo ""

# ============================================
# 10. INICIAR SERVIDOR
# ============================================

echo "🚀 Iniciando servidor..."

# Detener proceso anterior si existe
pm2 delete kor-backend 2>/dev/null || true

# Iniciar servidor
cd "$REPO_DIR/backend"
pm2 start server.js --name "kor-backend"

# Configurar inicio automático
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true
pm2 save

echo "✅ Servidor iniciado con PM2"
echo ""

# ============================================
# 11. VERIFICAR INSTALACIÓN
# ============================================

echo "🧪 Verificando instalación..."
sleep 3

# Test health endpoint
HEALTH_CHECK=$(curl -s http://localhost:$BACKEND_PORT/api/health | grep -o '"status":"OK"' || echo "")

if [ -n "$HEALTH_CHECK" ]; then
    echo "✅ Backend funcionando correctamente"
else
    echo "⚠️  Backend iniciado pero no responde aún"
    echo "   Espera 10 segundos y verifica con: pm2 logs kor-backend"
fi
echo ""

# ============================================
# 12. INFORMACIÓN FINAL
# ============================================

# Obtener IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "════════════════════════════════════════════════════════"
echo "✅ ¡INSTALACIÓN COMPLETADA!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📊 INFORMACIÓN DEL BACKEND:"
echo "   Puerto: $BACKEND_PORT"
echo "   URL Local: http://localhost:$BACKEND_PORT/api"
echo "   URL Interna: http://$LOCAL_IP:$BACKEND_PORT/api"
echo ""
echo "🔑 CREDENCIALES:"
echo "   Contraseña modo interno: 2323"
echo ""
echo "📁 UBICACIÓN:"
echo "   Repositorio: $REPO_DIR"
echo "   Backend: $REPO_DIR/backend"
echo ""
echo "🛠️  COMANDOS ÚTILES:"
echo "   Ver estado:   pm2 status"
echo "   Ver logs:     pm2 logs kor-backend"
echo "   Reiniciar:    pm2 restart kor-backend"
echo "   Detener:      pm2 stop kor-backend"
echo "   Monitorear:   pm2 monit"
echo ""
echo "🌐 PRÓXIMO PASO:"
echo "   Edita el archivo api.js en tu proyecto local:"
echo "   baseURL: 'http://$LOCAL_IP:$BACKEND_PORT/api'"
echo ""
echo "🧪 TEST RÁPIDO:"
echo "   curl http://localhost:$BACKEND_PORT/api/health"
echo ""
echo "════════════════════════════════════════════════════════"
