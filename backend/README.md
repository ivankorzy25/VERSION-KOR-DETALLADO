# 🔧 KOR Generadores - Backend API

Backend Node.js/Express para gestión de imágenes y PDFs del sistema KOR Generadores.

## 🚀 Características

- ✅ **Autenticación JWT** - Login seguro con contraseña
- ✅ **Upload de imágenes** - Subir múltiples imágenes (jpg, png, webp, gif)
- ✅ **Upload de videos** - Soporte para mp4 y webm
- ✅ **Eliminar archivos** - Borrar imágenes/videos
- ✅ **Reordenar imágenes** - Cambiar orden de visualización
- ✅ **Upload de PDFs** - Subir fichas técnicas
- ✅ **CORS configurado** - Funciona con GitHub Pages
- ✅ **Rate limiting** - Protección contra abuso
- ✅ **Helmet security** - Headers de seguridad
- ✅ **Validación de archivos** - Solo tipos permitidos

## 📦 Stack Tecnológico

- **Node.js** 20.x LTS
- **Express** 4.x - Framework web
- **Multer** - Upload de archivos
- **JWT** - Autenticación
- **Cors** - Cross-Origin Resource Sharing
- **Helmet** - Seguridad HTTP
- **Express Rate Limit** - Limitación de requests

## 🛠️ Instalación Rápida

### En tu máquina local (Windows):

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus rutas locales
npm run dev
```

### En Ubuntu Server:

Ver el archivo [`INSTALL_UBUNTU.md`](./INSTALL_UBUNTU.md) para instrucciones completas.

## 📡 API Endpoints

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{
  "password": "2323"
}

Response:
{
  "success": true,
  "token": "eyJhbGci...",
  "expiresIn": 86400
}
```

```http
GET /api/auth/verify
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Imágenes

#### Subir imágenes
```http
POST /api/images/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- images: [File, File, ...]
- productName: "Logus GL3300AM"
- category: "generadores-nafta"
```

#### Listar imágenes
```http
GET /api/images/:category/:productName
Authorization: Bearer {token}

Example: /api/images/generadores-nafta/Logus GL3300AM
```

#### Eliminar imágenes
```http
DELETE /api/images/delete
Authorization: Bearer {token}
Content-Type: application/json

{
  "images": [
    "assets/products/generadores-nafta/gl3300am/image1.webp",
    "assets/products/generadores-nafta/gl3300am/image2.webp"
  ]
}
```

#### Reordenar imágenes
```http
POST /api/images/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "generadores-nafta",
  "productName": "Logus GL3300AM",
  "orderedImages": [
    "assets/products/.../image3.webp",
    "assets/products/.../image1.webp",
    "assets/products/.../image2.webp"
  ]
}
```

### PDFs

#### Subir PDF
```http
POST /api/pdfs/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- pdf: File
- productName: "Logus GL3300AM"
- category: "generadores-nafta"
```

### Health Check

```http
GET /api/health

Response:
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "uptime": 12345.67,
  "environment": "production"
}
```

## 🔒 Seguridad

- **JWT Authentication** - Todas las rutas protegidas excepto /api/health
- **Rate Limiting** - Máximo 100 requests por IP cada 15 minutos
- **Helmet** - Headers de seguridad HTTP
- **CORS** - Configurado para GitHub Pages
- **Validación de archivos** - Solo tipos permitidos
- **Límite de tamaño** - 10MB por archivo
- **Environment variables** - Secretos en .env

## 📁 Estructura de Archivos

```
backend/
├── server.js           # Servidor principal
├── package.json        # Dependencias
├── .env.example        # Variables de entorno (ejemplo)
├── .env                # Variables de entorno (no commitear)
├── .gitignore          # Archivos ignorados
├── README.md           # Este archivo
└── INSTALL_UBUNTU.md   # Guía de instalación Ubuntu
```

## ⚙️ Variables de Entorno

```bash
PORT=3001                           # Puerto del servidor
INTERNAL_MODE_PASSWORD=2323         # Contraseña para autenticación
JWT_SECRET=tu_secret_aqui           # Secret para JWT
REPO_PATH=/ruta/al/repositorio      # Ruta completa al repositorio
FRONTEND_URL=https://...            # URL del frontend
NODE_ENV=production                 # Entorno (development/production)
```

## 🧪 Testing

```bash
# Instalar e iniciar el servidor
npm install
npm run dev

# En otra terminal, probar endpoints:

# Health check
curl http://localhost:3001/api/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"2323"}'

# Listar imágenes (reemplaza {token})
curl -X GET "http://localhost:3001/api/images/generadores-nafta/Logus%20GL3300AM" \
  -H "Authorization: Bearer {token}"
```

## 📝 Logs

### Con PM2 (producción):
```bash
pm2 logs kor-backend
pm2 logs kor-backend --lines 100
```

### Sin PM2 (desarrollo):
Los logs aparecen directamente en la consola.

## 🔄 Actualización en Producción

```bash
cd ~/projects/VERSION-KOR-DETALLADO
git pull origin main
cd backend
npm install
pm2 restart kor-backend
```

## 🐛 Troubleshooting

### Error: "EADDRINUSE: address already in use"
```bash
# Ver qué proceso usa el puerto
sudo netstat -tulpn | grep 3001
# O
sudo lsof -i :3001

# Matar el proceso
kill -9 {PID}
```

### Error: "Cannot read .env"
```bash
# Verificar que existe .env
ls -la .env

# Copiar desde ejemplo
cp .env.example .env
nano .env
```

### Error de permisos al subir archivos
```bash
# Dar permisos a la carpeta assets
chmod -R 755 ../assets
chown -R $USER:$USER ../assets
```

## 📊 Monitoreo

### Con PM2:
```bash
pm2 status
pm2 monit
pm2 logs kor-backend
```

### Recursos del sistema:
```bash
htop
df -h
free -h
```

## 🚦 Estados de Response

- `200` - OK
- `201` - Created
- `400` - Bad Request (falta data)
- `401` - Unauthorized (sin token)
- `403` - Forbidden (token inválido)
- `404` - Not Found
- `500` - Internal Server Error

## 📞 Soporte

Desarrollado para **KOR Generadores**

- Web: www.generadores.ar
- GitHub: https://github.com/ivankorzy25/VERSION-KOR-DETALLADO

---

**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
