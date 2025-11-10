# 🐧 Instalación del Backend en Ubuntu 24.04

## 📋 Requisitos Previos

- Ubuntu 24.04 LTS
- Acceso root o sudo
- Puerto 3001 disponible (o el que elijas)

---

## 🚀 Paso 1: Instalar Node.js y npm

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar curl si no lo tienes
sudo apt install -y curl

# Instalar Node.js 20.x (LTS recomendado)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v20.x.x
npm --version   # Debe mostrar 10.x.x
```

---

## 📁 Paso 2: Clonar o Copiar el Repositorio

### Opción A: Clonar desde GitHub

```bash
# Instalar git si no lo tienes
sudo apt install -y git

# Crear directorio para proyectos
mkdir -p ~/projects
cd ~/projects

# Clonar repositorio
git clone https://github.com/ivankorzy25/VERSION-KOR-DETALLADO.git
cd VERSION-KOR-DETALLADO/backend
```

### Opción B: Copiar archivos manualmente

```bash
# Crear directorio
mkdir -p ~/projects/VERSION-KOR-DETALLADO/backend
cd ~/projects/VERSION-KOR-DETALLADO/backend

# Luego copia los archivos via SFTP o SCP:
# - package.json
# - server.js
# - .env.example
```

---

## ⚙️ Paso 3: Configurar el Backend

```bash
# Instalar dependencias
npm install

# Crear archivo .env desde el ejemplo
cp .env.example .env

# Editar configuración
nano .env
```

**Configuración del archivo `.env` para Ubuntu:**

```bash
# Puerto del servidor (asegúrate de que esté abierto en el firewall)
PORT=3001

# Contraseña del modo interno
INTERNAL_MODE_PASSWORD=2323

# Secret para JWT (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=kor_generadores_2025_secret_key_ultra_segura_cambiame

# Ruta al repositorio en Ubuntu
REPO_PATH=/home/TU_USUARIO/projects/VERSION-KOR-DETALLADO

# URL del frontend (GitHub Pages)
FRONTEND_URL=https://ivankorzy25.github.io

# Modo de producción
NODE_ENV=production
```

**💡 Reemplaza `TU_USUARIO` con tu usuario real de Ubuntu**

---

## 🔥 Paso 4: Configurar el Firewall

```bash
# Habilitar UFW si no está habilitado
sudo ufw enable

# Permitir SSH (IMPORTANTE antes de habilitar UFW)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir el puerto del backend
sudo ufw allow 3001/tcp

# Verificar reglas
sudo ufw status
```

---

## 🧪 Paso 5: Probar el Servidor

```bash
# Iniciar en modo desarrollo (para pruebas)
npm run dev
```

Deberías ver:
```
🚀 Servidor KOR Generadores Backend
📍 Escuchando en http://localhost:3001
🌍 Entorno: production
📁 Repositorio: /home/usuario/projects/VERSION-KOR-DETALLADO
✅ Servidor listo para recibir peticiones
```

**Prueba desde otro equipo:**
```bash
curl http://TU_IP_SERVIDOR:3001/api/health
```

---

## 🔄 Paso 6: Configurar PM2 (Gestor de Procesos)

PM2 mantiene el servidor corriendo 24/7 y lo reinicia automáticamente si falla.

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar el servidor con PM2
cd ~/projects/VERSION-KOR-DETALLADO/backend
pm2 start server.js --name "kor-backend"

# Configurar PM2 para iniciar al bootear
pm2 startup
# Copia y ejecuta el comando que te muestra

pm2 save

# Comandos útiles de PM2
pm2 status              # Ver estado
pm2 logs kor-backend    # Ver logs en tiempo real
pm2 restart kor-backend # Reiniciar
pm2 stop kor-backend    # Detener
pm2 delete kor-backend  # Eliminar
```

---

## 🌐 Paso 7: Configurar Nginx (Opcional pero Recomendado)

Nginx actúa como proxy reverso y permite usar HTTPS.

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/kor-backend
```

**Contenido del archivo:**

```nginx
server {
    listen 80;
    server_name TU_DOMINIO.com;  # O usa tu IP

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
    }
}
```

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/kor-backend /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Habilitar Nginx al inicio
sudo systemctl enable nginx

# Permitir Nginx en el firewall
sudo ufw allow 'Nginx Full'
```

---

## 🔒 Paso 8: Configurar HTTPS con Let's Encrypt (Opcional)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d TU_DOMINIO.com

# El certificado se renovará automáticamente
# Verificar renovación automática:
sudo systemctl status certbot.timer
```

---

## 📝 Paso 9: Configurar el Frontend

Edita el archivo `api.js` en el frontend y cambia la URL del backend:

```javascript
const API_CONFIG = {
    // Con Nginx:
    baseURL: 'http://TU_IP_O_DOMINIO/api',

    // Sin Nginx:
    // baseURL: 'http://TU_IP_SERVIDOR:3001/api',

    timeout: 30000
};
```

Luego sube el cambio a GitHub:

```bash
git add api.js
git commit -m "Actualizar URL del backend"
git push
```

---

## 🧰 Comandos Útiles

### Ver logs del servidor
```bash
# Con PM2
pm2 logs kor-backend

# Sin PM2 (si está corriendo manualmente)
# Los logs aparecen en la consola
```

### Actualizar el código
```bash
cd ~/projects/VERSION-KOR-DETALLADO
git pull origin main
cd backend
npm install  # Por si hay nuevas dependencias
pm2 restart kor-backend
```

### Ver uso de recursos
```bash
pm2 monit
```

### Backup de imágenes
```bash
# Hacer backup de assets
cd ~/projects/VERSION-KOR-DETALLADO
tar -czf backup-assets-$(date +%Y%m%d).tar.gz assets/
```

---

## 🔍 Resolución de Problemas

### El servidor no inicia
```bash
# Ver logs de PM2
pm2 logs kor-backend --lines 50

# Verificar que el puerto no esté en uso
sudo netstat -tulpn | grep 3001

# Verificar permisos de archivos
ls -la ~/projects/VERSION-KOR-DETALLADO
```

### Error de permisos al subir archivos
```bash
# Dar permisos de escritura a la carpeta assets
chmod -R 755 ~/projects/VERSION-KOR-DETALLADO/assets
chown -R $USER:$USER ~/projects/VERSION-KOR-DETALLADO/assets
```

### No puedo conectar desde el frontend
```bash
# Verificar que el firewall permita el puerto
sudo ufw status

# Verificar que el servidor esté escuchando
sudo netstat -tulpn | grep 3001

# Probar desde el propio servidor
curl http://localhost:3001/api/health

# Probar desde fuera
curl http://TU_IP:3001/api/health
```

---

## 📊 Monitoreo

### Ver estado del sistema
```bash
# CPU y memoria
htop

# Procesos de Node.js
ps aux | grep node

# Espacio en disco
df -h
```

---

## 🔐 Seguridad Adicional

### Cambiar puerto por defecto
Edita `.env` y cambia `PORT=3001` a otro puerto aleatorio.

### Restringir acceso por IP
En Nginx, agrega:
```nginx
allow TU_IP_CASA;
allow TU_IP_OFICINA;
deny all;
```

### Actualizar sistema regularmente
```bash
sudo apt update && sudo apt upgrade -y
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `pm2 logs kor-backend`
2. Verifica el archivo `.env`
3. Asegúrate de que el firewall permita el tráfico
4. Prueba con `curl http://localhost:3001/api/health`

---

**¡Listo! Tu backend está configurado y funcionando en Ubuntu 24.04** 🎉
