# 🏗️ Arquitectura del Sistema KOR Generadores

## 📐 Visión General

El sistema KOR Generadores utiliza una **arquitectura híbrida** que combina:

1. **Frontend estático** en GitHub Pages (gratis, rápido, CDN global)
2. **Backend dinámico** en servidor Ubuntu (gestión de archivos)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│         USUARIO (Navegador)                             │
│                                                         │
└───────────────────┬─────────────────────────────────────┘
                    │
                    │ HTTPS
                    │
    ┌───────────────┴─────────────────┐
    │                                 │
    │ Lectura (GET)          Escritura (POST/DELETE)
    │                                 │
    ▼                                 ▼
┌─────────────────────┐         ┌──────────────────────┐
│                     │         │                      │
│  GitHub Pages       │         │  Servidor Ubuntu     │
│  (Frontend)         │         │  (Backend API)       │
│                     │         │                      │
│  - HTML/CSS/JS      │◄────────┤  - Node.js/Express   │
│  - Imágenes         │  Sync   │  - Multer (uploads)  │
│  - PDFs             │  (git)  │  - JWT (auth)        │
│  - Solo Lectura     │         │  - CORS              │
│                     │         │                      │
└─────────────────────┘         └──────────────────────┘
         │                               │
         │                               │
         │       GitHub Repository       │
         └───────────────┬───────────────┘
                         │
                    ┌────▼─────┐
                    │          │
                    │   Git    │
                    │   Repo   │
                    │          │
                    └──────────┘
```

---

## 🎯 Flujo de Trabajo

### 1. **Usuario ve el sitio** (Lectura)

```
Usuario → GitHub Pages → HTML → Script.js → API.js
                  ↓
            Imágenes/PDFs (CDN GitHub)
```

- El usuario accede a: `https://ivankorzy25.github.io/VERSION-KOR-DETALLADO/`
- GitHub sirve el HTML estático
- Las imágenes y PDFs se cargan desde el repositorio

### 2. **Usuario edita imágenes** (Escritura - Modo Interno)

```
Usuario → Modo Interno (password 2323)
    ↓
API.js → Backend Ubuntu → Multer → Filesystem
    ↓
git add/commit/push → GitHub
    ↓
GitHub Pages actualiza automáticamente (2-5 min)
```

**Pasos:**

1. Usuario activa "Modo Uso Interno"
2. Ingresa contraseña `2323`
3. API.js obtiene token JWT del backend
4. Usuario sube/elimina/reordena imágenes
5. Backend guarda cambios en el filesystem
6. Backend hace commit y push a GitHub
7. GitHub Pages se actualiza automáticamente

---

## 📂 Estructura de Archivos

```
VERSION-KOR-DETALLADO/
│
├── Frontend (GitHub Pages)
│   ├── index.html              # Página principal
│   ├── styles.css              # Estilos
│   ├── script.js               # Lógica de UI
│   ├── api.js                  # Cliente API ← NUEVO
│   ├── kor-logo.png            # Logo
│   ├── background360.jpg       # Fondo 360°
│   │
│   └── assets/
│       ├── products/           # Imágenes de productos
│       │   └── generadores-nafta/
│       │       ├── gl3300am/
│       │       │   ├── GL3300AM_1.webp
│       │       │   ├── GL3300AM_2.webp
│       │       │   └── ...
│       │       ├── gl3300e/
│       │       └── ...
│       │
│       └── pdfs/               # Fichas técnicas
│           └── generadores-nafta/
│               ├── Logus_GL3300AM.pdf
│               └── ...
│
└── Backend (Servidor Ubuntu)
    └── backend/
        ├── server.js           # API REST
        ├── package.json        # Dependencias
        ├── .env                # Configuración
        ├── README.md           # Documentación
        └── INSTALL_UBUNTU.md   # Guía de instalación
```

---

## 🔐 Seguridad

### Frontend (api.js)

```javascript
// 1. Login con contraseña
const response = await KorAPI.auth.login('2323');
// Devuelve: { token: "eyJhbG...", expiresIn: 86400 }

// 2. Token se guarda en localStorage
localStorage.setItem('kor_api_token', token);

// 3. Todas las peticiones incluyen el token
headers: {
    'Authorization': `Bearer ${token}`
}
```

### Backend (server.js)

```javascript
// 1. Verifica token JWT en cada request
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido' });
        req.user = user;
        next();
    });
}

// 2. Todas las rutas protegidas usan el middleware
app.post('/api/images/upload', authenticateToken, upload.array('images'), ...);
```

**Capas de seguridad:**

1. ✅ Contraseña para modo interno
2. ✅ JWT con expiración (24h)
3. ✅ Helmet (headers de seguridad HTTP)
4. ✅ CORS (solo dominios permitidos)
5. ✅ Rate limiting (100 req/15min por IP)
6. ✅ Validación de tipos de archivo
7. ✅ Límite de tamaño (10MB por archivo)

---

## 🔄 Ciclo de Actualización

### Opción 1: Manual (Actual)

```bash
# En el servidor Ubuntu
cd ~/projects/VERSION-KOR-DETALLADO

# Backend recibe cambios y los guarda
# Luego manualmente:
git add assets/
git commit -m "Actualizar imágenes"
git push

# GitHub Pages actualiza en 2-5 minutos
```

### Opción 2: Automática (Futura mejora)

```javascript
// En server.js, después de cada cambio:
const { exec } = require('child_process');

function gitPushChanges(message) {
    exec(`cd ${REPO_PATH} && git add assets/ && git commit -m "${message}" && git push`,
        (error, stdout, stderr) => {
            if (error) console.error(`Error: ${error}`);
            console.log(`Git push exitoso: ${stdout}`);
        }
    );
}
```

---

## 🌐 Comunicación Frontend-Backend

### Frontend (api.js)

```javascript
// Configuración
const API_CONFIG = {
    baseURL: 'http://TU_IP_SERVIDOR:3001/api',
    timeout: 30000
};

// Subir imágenes
const formData = new FormData();
formData.append('images', file);
formData.append('productName', 'Logus GL3300AM');
formData.append('category', 'generadores-nafta');

const response = await fetch(`${API_CONFIG.baseURL}/images/upload`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### Backend (server.js)

```javascript
// Recibir y procesar
app.post('/api/images/upload', authenticateToken, upload.array('images', 10),
    async (req, res) => {
        // req.files = array de archivos
        // req.body = { productName, category }

        // Multer ya guardó los archivos en:
        // assets/products/{category}/{productName}/

        res.json({
            success: true,
            files: req.files.map(f => f.path)
        });
    }
);
```

---

## 📊 Endpoints de la API

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login con contraseña | No |
| GET | `/api/auth/verify` | Verificar token | Sí |
| POST | `/api/images/upload` | Subir imágenes | Sí |
| GET | `/api/images/:cat/:prod` | Listar imágenes | Sí |
| DELETE | `/api/images/delete` | Eliminar imágenes | Sí |
| POST | `/api/images/reorder` | Reordenar imágenes | Sí |
| POST | `/api/pdfs/upload` | Subir PDF | Sí |
| GET | `/api/health` | Estado del servidor | No |

---

## 💾 Persistencia de Datos

### Base de Datos

❌ **No usamos base de datos** - Todo está en el filesystem del repositorio.

**Ventajas:**
- ✅ Simple
- ✅ Versionado con Git
- ✅ Backup automático (GitHub)
- ✅ Fácil de migrar

**Desventajas:**
- ❌ No es escalable para miles de productos
- ❌ Git no es ideal para archivos grandes

### Alternativa Futura: Base de Datos

Si el catálogo crece mucho, considerar:

```javascript
// MongoDB para metadatos
{
    productName: "Logus GL3300AM",
    category: "generadores-nafta",
    images: [
        { url: "...", order: 1, size: 1024000 },
        { url: "...", order: 2, size: 2048000 }
    ],
    pdf: { url: "...", size: 512000 }
}

// S3/Cloudinary para archivos
// GitHub Pages solo para HTML/CSS/JS
```

---

## 🧪 Testing

### Health Check

```bash
# Verificar que el backend está online
curl http://TU_IP:3001/api/health

# Respuesta esperada:
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "uptime": 1234.56,
  "environment": "production"
}
```

### Test de Upload

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"2323"}' \
    | jq -r '.token')

# 2. Subir imagen
curl -X POST http://localhost:3001/api/images/upload \
    -H "Authorization: Bearer $TOKEN" \
    -F "images=@/path/to/image.jpg" \
    -F "productName=Logus GL3300AM" \
    -F "category=generadores-nafta"
```

---

## 🚀 Deploy y Escalabilidad

### Configuración Actual (Pequeña)

```
1 servidor Ubuntu
- 2 GB RAM
- 1 vCPU
- 25 GB SSD
- Node.js + PM2

→ Soporta ~100 productos
→ ~1000 requests/día
→ Costo: $5-10/mes
```

### Escalado Medio

```
GitHub Pages (frontend) → Gratis, escala automáticamente

Backend:
- 4 GB RAM, 2 vCPU
- Nginx como proxy reverso
- PM2 cluster mode (4 workers)
- PostgreSQL para metadatos
- S3/Cloudflare R2 para archivos

→ Soporta ~1000 productos
→ ~10000 requests/día
→ Costo: $20-30/mes
```

### Escalado Grande

```
- Frontend: Vercel/Netlify (gratis)
- Backend: AWS Lambda/Google Cloud Functions (serverless)
- Database: MongoDB Atlas
- Files: AWS S3 + CloudFront CDN
- Auth: Auth0 o Firebase Auth

→ Soporta ilimitado
→ Escala automáticamente
→ Costo: variable según uso
```

---

## 🔧 Mantenimiento

### Actualizar Frontend

```bash
# Local
git add .
git commit -m "Actualizar frontend"
git push

# GitHub Pages actualiza automáticamente en 2-5 min
```

### Actualizar Backend

```bash
# En el servidor Ubuntu
cd ~/projects/VERSION-KOR-DETALLADO/backend
git pull
npm install
pm2 restart kor-backend
```

### Backup

```bash
# Backup de assets (manual)
cd ~/projects/VERSION-KOR-DETALLADO
tar -czf backup-$(date +%Y%m%d).tar.gz assets/

# Backup automático (cron)
0 2 * * * cd ~/projects/VERSION-KOR-DETALLADO && tar -czf ~/backups/assets-$(date +\%Y\%m\%d).tar.gz assets/
```

---

## 📈 Métricas y Logs

### Logs del Backend

```bash
# Tiempo real
pm2 logs kor-backend

# Últimas 100 líneas
pm2 logs kor-backend --lines 100

# Buscar errores
pm2 logs kor-backend --err
```

### Monitoreo

```bash
# Dashboard de PM2
pm2 monit

# Recursos del servidor
htop

# Espacio en disco
df -h
```

### Métricas (Futuro)

- Prometheus + Grafana
- Logs centralizados con ELK Stack
- Alertas con PagerDuty/Slack

---

## 🎓 Aprendizajes Clave

1. **Separación de concerns**: Frontend sirve contenido, backend maneja lógica
2. **GitHub Pages es limitado**: Solo archivos estáticos, no server-side
3. **JWT es simple y efectivo**: Para autenticación sin base de datos de sesiones
4. **PM2 es esencial**: Mantiene el proceso corriendo 24/7
5. **CORS puede ser complicado**: Configurar bien los headers es crítico
6. **Git no es para archivos grandes**: Para producción real, usar S3 o similar

---

**Desarrollado para KOR Generadores**
**Noviembre 2025**
